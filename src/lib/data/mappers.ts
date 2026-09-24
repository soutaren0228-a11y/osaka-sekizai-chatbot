/**
 * DBの行（snake_case）と、画面が使う型（camelCase）を変換する純粋関数。
 * Supabaseクライアントに依存しないため、単体テストしやすい。
 */
import type { SourceRecord, SourceType, SourceStatus } from "./types";

export interface SourceRow {
  id: string;
  type: string;
  name: string;
  detail: string;
  size_label: string;
  status: string;
  error_message: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function mapSourceRow(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    type: row.type as SourceType,
    name: row.name,
    detail: row.detail,
    sizeLabel: row.size_label,
    status: row.status as SourceStatus,
    errorMessage: row.error_message ?? undefined,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
