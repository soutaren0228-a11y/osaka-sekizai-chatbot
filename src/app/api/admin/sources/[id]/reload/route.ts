import { NextRequest, NextResponse, after } from "next/server";
import { requireMember } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ingestSource } from "@/lib/ai/ingest";
import { mapSourceRow } from "@/lib/data/mappers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireMember({ requireEditor: true });
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: auth.status });

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sources")
    .update({ status: "loading", error_message: null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  after(() => ingestSource(id));
  return NextResponse.json({ source: mapSourceRow(data) });
}
