import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { discoverSiteUrls, fetchPageText } from "./extractSiteText";
import { extractPdfText } from "./extractPdfText";
import { chunkText } from "./chunk";
import { embedDocuments } from "./embeddings";

const STORAGE_BUCKET = "source-files";

/**
 * 実際の取り込み処理（チャンク化・埋め込み・保存）。
 * URL登録・PDFアップロード・テキスト追加のいずれも、まずsourcesに
 * status='loading'の行を作ってから、この関数をバックグラウンドで実行する想定。
 */
export async function ingestSource(sourceId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: source, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (error || !source) return;

  try {
    let fullText = "";
    let sizeLabel = "";

    if (source.type === "url") {
      const { urls } = await discoverSiteUrls(source.detail);
      const texts: string[] = [];
      for (const url of urls) {
        const page = await fetchPageText(url);
        if (page) texts.push(page.text);
      }
      fullText = texts.join("\n\n");
      sizeLabel = `${texts.length}ページ・約${fullText.length.toLocaleString("ja-JP")}文字`;
    } else if (source.type === "pdf") {
      if (!source.storage_path) throw new Error("PDFファイルが見つかりません");
      const { data: file, error: downloadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(source.storage_path);
      if (downloadError || !file) throw new Error("PDFファイルの取得に失敗しました");
      const buffer = Buffer.from(await file.arrayBuffer());
      const { text, pageCount } = await extractPdfText(buffer);
      fullText = text;
      const kb = Math.max(1, Math.round(buffer.byteLength / 1024));
      sizeLabel = `${pageCount}ページ・${kb.toLocaleString("ja-JP")}KB`;
    } else {
      fullText = source.body ?? "";
      sizeLabel = `${fullText.length.toLocaleString("ja-JP")}文字`;
    }

    if (!fullText.trim()) {
      throw new Error("本文を取得できませんでした");
    }

    // 既存のチャンクを削除してから作り直す（reload時のため）
    await supabase.from("chunks").delete().eq("source_id", sourceId);

    const pieces = chunkText(fullText);
    const embeddings = await embedDocuments(pieces);
    const rows = pieces.map((content, i) => ({
      source_id: sourceId,
      bot_id: source.bot_id,
      content,
      embedding: embeddings[i],
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("chunks").insert(rows);
      if (insertError) throw insertError;
    }

    await supabase
      .from("sources")
      .update({ status: "ready", size_label: sizeLabel, error_message: null, updated_at: new Date().toISOString() })
      .eq("id", sourceId);
  } catch (err) {
    await supabase
      .from("sources")
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "取り込みに失敗しました",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
  }
}

export { STORAGE_BUCKET };
