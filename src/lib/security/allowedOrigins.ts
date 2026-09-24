import "server-only";

/**
 * 埋め込みウィジェットからのアクセスを許可するドメインのチェック。
 * ALLOWED_WIDGET_ORIGINS（カンマ区切り）に含まれるオリジンだけ許可する。
 */
function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_WIDGET_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

/** 許可されたオリジンからのリクエストに付けるCORSヘッダー */
export function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
