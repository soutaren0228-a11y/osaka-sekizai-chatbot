import "server-only";

/**
 * トークン数から円換算のコストを見積もる。
 * 料金は変わることがあるため環境変数で設定する（既定値はあくまで目安）。
 */
export function estimateCostYen(inputTokens: number, outputTokens: number): number {
  const inputPricePerMTokUsd = Number(
    process.env.ANTHROPIC_INPUT_PRICE_PER_MTOK_USD ?? "1"
  );
  const outputPricePerMTokUsd = Number(
    process.env.ANTHROPIC_OUTPUT_PRICE_PER_MTOK_USD ?? "5"
  );
  const usdToJpy = Number(process.env.USD_TO_JPY_RATE ?? "155");

  const usd =
    (inputTokens / 1_000_000) * inputPricePerMTokUsd +
    (outputTokens / 1_000_000) * outputPricePerMTokUsd;

  return Math.round(usd * usdToJpy);
}
