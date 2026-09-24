import "server-only";

/**
 * Voyage AI（埋め込み）呼び出し層。
 * モデルは環境変数 VOYAGE_EMBEDDING_MODEL で切り替え可能（既定：voyage-multilingual-2）。
 *
 * 差し替えの指針：埋め込みプロバイダーを変える場合は、この2関数のシグネチャ
 * （文字列配列→ベクトル配列 / 文字列→ベクトル）を保てば、呼び出し側の変更は不要。
 */
const VOYAGE_ENDPOINT = "https://api.voyageai.com/v1/embeddings";
const BATCH_SIZE = 100;

function getConfig() {
  const apiKey = process.env.VOYAGE_API_KEY;
  const model = process.env.VOYAGE_EMBEDDING_MODEL || "voyage-multilingual-2";
  if (!apiKey) {
    throw new Error(
      "VOYAGE_API_KEY が設定されていません（.env.example参照）。"
    );
  }
  return { apiKey, model };
}

async function callVoyage(
  inputs: string[],
  inputType: "document" | "query"
): Promise<number[][]> {
  const { apiKey, model } = getConfig();

  const res = await fetch(VOYAGE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: inputs, model, input_type: inputType }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage AI API エラー (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** 保存する文書（チャンク・FAQの質問文）を埋め込む */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await callVoyage(batch, "document");
    results.push(...embeddings);
  }
  return results;
}

/** お客さまの質問文を埋め込む（検索クエリ用） */
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await callVoyage([text], "query");
  return embedding;
}
