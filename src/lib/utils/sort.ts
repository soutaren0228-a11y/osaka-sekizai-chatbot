/** ISO日時文字列を新しい順（降順）に並べるための比較関数。同じ値なら0を返し元の順序を保つ */
export function compareDesc(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? 1 : -1;
}
