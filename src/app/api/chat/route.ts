import { NextRequest } from "next/server";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth/session";
import { isOriginAllowed, corsHeaders } from "@/lib/security/allowedOrigins";
import { checkAndRecordRateLimit, getClientIp, hashIp } from "@/lib/security/rateLimit";
import { checkUsageLimit, recordUsage } from "@/lib/data/server/usageServer";
import { loadChatContext } from "@/lib/data/server/chatContext";
import { logConversationTurn } from "@/lib/data/server/conversationLog";
import { recordUnansweredServer } from "@/lib/data/server/unansweredServer";
import { matchBannedTopic, buildContact, appendContact, FALLBACK_TEMPLATES, REFUSAL_TEMPLATES } from "@/lib/ai/templates";
import { embedQuery } from "@/lib/ai/embeddings";
import { topKBySimilarity } from "@/lib/ai/similarity";
import { streamChatCompletion } from "@/lib/ai/anthropic";
import { createMarkerStripper } from "@/lib/ai/answerMarker";
import { encodeEvent } from "@/lib/ai/streamProtocol";

const MAX_QUESTION_LENGTH = 500;
const CHUNK_MATCH_COUNT = 6;
const FAQ_MATCH_COUNT = 3;
const FAQ_SIMILARITY_THRESHOLD = 0.75;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const body = (await request.json().catch(() => null)) as
    | { question?: string; isTest?: boolean; conversationId?: string }
    | null;

  if (!body?.question || !body.conversationId) {
    return jsonError("questionとconversationIdは必須です", 400, origin);
  }

  const question = body.question.slice(0, MAX_QUESTION_LENGTH).trim();
  const isTest = Boolean(body.isTest);

  if (isTest) {
    const auth = await requireMember();
    if (!auth.ok) return jsonError("unauthorized", auth.status, origin);
  } else {
    if (origin && !isOriginAllowed(origin)) {
      return jsonError("このドメインからは利用できません", 403, origin);
    }
    const ip = getClientIp(request);
    const botId = await getBotId();
    const rate = await checkAndRecordRateLimit(botId, hashIp(ip));
    if (!rate.allowed) {
      return jsonError(rate.reason ?? "利用回数の上限を超えました", 429, origin);
    }
  }

  const botId = await getBotId();
  const usage = await checkUsageLimit(botId);
  if (usage.unavailable) {
    return streamSingleMessage(usage.message, "unavailable", origin);
  }

  const context = await loadChatContext(botId, isTest);
  if (!context) {
    return jsonError(
      isTest ? "設定を読み込めませんでした" : "まだ公開されていません",
      isTest ? 500 : 404,
      origin
    );
  }
  const { persona, appearance } = context;

  const bannedTopic = matchBannedTopic(question, persona.bannedTopics);
  if (bannedTopic) {
    const contact = buildContact(persona);
    const text = appendContact(REFUSAL_TEMPLATES[persona.tone](bannedTopic.label), contact);
    await logConversationTurn({
      botId,
      conversationId: body.conversationId,
      isTest,
      greeting: appearance.greeting,
      question,
      answer: text,
    });
    return streamSingleMessage(text, "refused", origin, contact);
  }

  const queryEmbedding = await embedQuery(question);

  const supabase = getSupabaseServerClient();
  const [{ data: chunkMatches }, faqMatches] = await Promise.all([
    supabase.rpc("match_chunks", {
      p_bot_id: botId,
      p_query_embedding: queryEmbedding,
      p_match_count: CHUNK_MATCH_COUNT,
    }),
    Promise.resolve(
      topKBySimilarity(
        queryEmbedding,
        context.faqs.filter((f) => f.answer.trim().length > 0),
        (f) => f.embedding,
        FAQ_MATCH_COUNT
      ).filter((f) => f.similarity >= FAQ_SIMILARITY_THRESHOLD)
    ),
  ]);

  const stream = streamChatCompletion(question, {
    botName: appearance.botName,
    persona: {
      tone: persona.tone,
      bannedTopicLabels: persona.bannedTopics.filter((t) => t.enabled).map((t) => t.label),
      contactPhone: persona.contactPhone,
      contactUrl: persona.contactUrl,
    },
    chunks: (chunkMatches ?? []).map((c: { content: string }) => ({ content: c.content })),
    faqs: faqMatches.map((f) => ({ question: f.question, answer: f.answer })),
  });

  const markerStripper = createMarkerStripper();
  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const visible = markerStripper.push(event.delta.text);
            if (visible) {
              fullText += visible;
              controller.enqueue(encoder.encode(encodeEvent({ type: "delta", text: visible })));
            }
          }
        }

        const finalMessage = await stream.finalMessage();
        const status = markerStripper.getStatus();
        const contact = status === "unanswered" || status === "refused" ? buildContact(persona) : undefined;

        await recordUsage(botId, finalMessage.usage.input_tokens, finalMessage.usage.output_tokens);
        await logConversationTurn({
          botId,
          conversationId: body.conversationId!,
          isTest,
          greeting: appearance.greeting,
          question,
          answer: fullText || FALLBACK_TEMPLATES[persona.tone],
        });
        if (status === "unanswered") {
          await recordUnansweredServer(botId, question, isTest);
        }

        controller.enqueue(encoder.encode(encodeEvent({ type: "done", status, contact })));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: "error",
              message: err instanceof Error ? err.message : "回答の生成に失敗しました",
            })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { headers: origin ? corsHeaders(origin) : undefined });
}

function jsonError(message: string, status: number, origin: string | null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function streamSingleMessage(
  text: string,
  status: "unavailable" | "refused",
  origin: string | null,
  contact?: ReturnType<typeof buildContact>
): Response {
  const encoder = new TextEncoder();
  const body =
    encodeEvent({ type: "delta", text }) + encodeEvent({ type: "done", status, contact });
  return new Response(encoder.encode(body), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}
