import { NextRequest, NextResponse, after } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient, getBotId } from "@/lib/supabase/server";
import { mapSourceRow } from "@/lib/data/mappers";
import { ingestSource, STORAGE_BUCKET } from "@/lib/ai/ingest";

export async function GET() {
  const auth = await requireMember();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("bot_id", botId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data.map(mapSourceRow) });
}

export async function POST(request: NextRequest) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const supabase = getSupabaseServerClient();
  const botId = await getBotId();
  const form = await request.formData();
  const type = form.get("type");

  if (type === "url") {
    const url = String(form.get("url") ?? "");
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "URLが正しくありません" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sources")
      .insert({ bot_id: botId, type: "url", name: hostname, detail: url, status: "loading" })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    after(() => ingestSource(data.id));
    return NextResponse.json({ source: mapSourceRow(data) });
  }

  if (type === "text") {
    const title = String(form.get("title") ?? "");
    const bodyText = String(form.get("body") ?? "");
    if (!title.trim() || !bodyText.trim()) {
      return NextResponse.json({ error: "タイトルと本文を入力してください" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sources")
      .insert({
        bot_id: botId,
        type: "text",
        name: title,
        detail: "直接入力したテキスト",
        body: bodyText,
        status: "loading",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    after(() => ingestSource(data.id));
    return NextResponse.json({ source: mapSourceRow(data) });
  }

  if (type === "pdf") {
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDFファイルを選んでください" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sources")
      .insert({
        bot_id: botId,
        type: "pdf",
        name: file.name.replace(/\.pdf$/i, ""),
        detail: file.name,
        status: "loading",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const storagePath = `${botId}/${data.id}.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      await supabase
        .from("sources")
        .update({ status: "error", error_message: "PDFの保存に失敗しました" })
        .eq("id", data.id);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    await supabase.from("sources").update({ storage_path: storagePath }).eq("id", data.id);

    after(() => ingestSource(data.id));
    return NextResponse.json({ source: mapSourceRow({ ...data, storage_path: storagePath }) });
  }

  return NextResponse.json({ error: "typeが不正です" }, { status: 400 });
}
