import "server-only";

/**
 * PDFからテキストを抽出する。
 * pdfjs-dist の legacy（Node向け）ビルドを直接使い、画像・キャンバス関連の
 * 重い依存（ネイティブバイナリ）を避けている（テキスト抽出のみが目的のため）。
 */
export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
}> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  await doc.destroy();

  return {
    text: pageTexts.join("\n\n").replace(/[ \t]+/g, " ").trim(),
    pageCount: doc.numPages,
  };
}
