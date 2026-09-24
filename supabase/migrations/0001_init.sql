-- 大阪石材 AIチャットボット 初期スキーマ（本実装フェーズ1相当）
--
-- 設計方針（CLAUDE.md 13節を参照）：
-- ・このアプリのテーブルには、ブラウザから直接アクセスさせない。
--   すべての読み書きは Next.js のサーバー側コード（Route Handler）が
--   SUPABASE_SERVICE_ROLE_KEY を使って行い、認可はアプリ側（members テーブルとの
--   突き合わせ）で判定する。そのため RLS は有効化するが、
--   anon / authenticated ロールに対する許可ポリシーは意図的に追加していない
--   （service_role は Supabase の仕組みにより RLS を常にバイパスする）。
-- ・埋め込み次元数は Voyage AI の `voyage-multilingual-2`（1024次元）を前提にしている。
--   別モデルに変更する場合は vector(1024) の次元数を合わせてマイグレーションし直すこと。

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ============================================================
-- bots / bot_versions：下書きと公開の二層構成
-- ============================================================

create table if not exists bots (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null default 'コーポレートサイト案内ボット',
  -- 下書きの設定（persona・appearance）。faqs は別テーブル（embedding検索が必要なため）。
  draft_persona jsonb not null,
  draft_appearance jsonb not null,
  current_published_version_id uuid,
  -- 会話ログの保存期間（日）。この試作では自動削除の実行は行わない（CLAUDE.md 13-3参照）
  conversation_retention_days integer not null default 90,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bot_versions (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  published_at timestamptz not null default now(),
  published_by text not null,
  -- この版を公開したときの「未公開の変更」ログの要約（表示用）
  change_summaries jsonb not null default '[]'::jsonb,
  -- persona・appearance・faqs（question/answer/embeddingを含む）をまるごと保存する
  snapshot jsonb not null
);

alter table bots
  add constraint bots_current_published_version_fk
  foreign key (current_published_version_id) references bot_versions(id) on delete set null;

create index if not exists bot_versions_bot_id_idx on bot_versions (bot_id, published_at desc);

-- 「未公開の変更」ログ（公開すると空になる）
create table if not exists draft_changes (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  summary text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists draft_changes_bot_id_idx on draft_changes (bot_id, occurred_at desc);

-- ============================================================
-- faqs：下書きのよくある質問（公開版は bot_versions.snapshot に入る）
-- ============================================================

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  question text not null,
  answer text not null default '',
  embedding vector(1024),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_bot_id_idx on faqs (bot_id);
create index if not exists faqs_embedding_idx on faqs
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- sources / chunks：AIに覚えさせる情報（RAG対象）
-- ============================================================

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  type text not null check (type in ('url', 'pdf', 'text')),
  name text not null,
  detail text not null default '',
  size_label text not null default '',
  status text not null default 'loading' check (status in ('loading', 'ready', 'error')),
  error_message text,
  active boolean not null default true,
  storage_path text,
  -- type='text' の場合のみ使う（url/pdfは取り込みのたびに取得し直すため保存しない）
  body text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sources_bot_id_idx on sources (bot_id) where deleted_at is null;

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  content text not null,
  embedding vector(1024),
  created_at timestamptz not null default now()
);

create index if not exists chunks_source_id_idx on chunks (source_id);
create index if not exists chunks_embedding_idx on chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- 会話ログ・答えられなかった質問
-- ============================================================

create table if not exists conversations (
  id uuid primary key,
  bot_id uuid not null references bots(id) on delete cascade,
  is_test boolean not null default false,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_bot_id_idx on conversations (bot_id, is_test, updated_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on messages (conversation_id, at);

create table if not exists unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  question text not null,
  normalized_question text not null,
  count integer not null default 1,
  last_asked_at timestamptz not null default now(),
  test_only boolean not null default true,
  status text not null default 'open' check (status in ('open', 'dismissed'))
);

create unique index if not exists unanswered_bot_normalized_idx
  on unanswered_questions (bot_id, normalized_question);

-- ============================================================
-- メンバーと権限
-- ============================================================

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'viewer' check (role in ('editor', 'viewer')),
  is_owner boolean not null default false,
  invited_at timestamptz not null default now(),
  unique (bot_id, email)
);

create index if not exists members_user_id_idx on members (user_id);

-- ============================================================
-- 利用状況・上限、レート制限
-- ============================================================

create table if not exists usage_settings (
  bot_id uuid primary key references bots(id) on delete cascade,
  monthly_limit_yen integer not null default 50000,
  notify_email text not null default '',
  unavailable_message text not null default
    '現在ご利用いただけません。しばらく経ってから改めてお試しいただくか、お電話でお問い合わせください。',
  force_unavailable boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists usage_totals (
  bot_id uuid not null references bots(id) on delete cascade,
  year_month text not null, -- 'YYYY-MM'
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  estimated_cost_yen numeric not null default 0,
  primary key (bot_id, year_month)
);

-- IPごとの回数制限用。行が増え続けるため、運用時は古い行を定期的に削除する
-- （本実装ではVercel Cron等での削除は未実装。CLAUDE.md 13-3参照）。
create table if not exists rate_limit_events (
  id bigint generated always as identity primary key,
  bot_id uuid not null references bots(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_lookup_idx
  on rate_limit_events (bot_id, ip_hash, created_at desc);

-- ============================================================
-- ベクトル検索用関数（chunks / faqs）
-- ============================================================

create or replace function match_chunks(
  p_bot_id uuid,
  p_query_embedding vector(1024),
  p_match_count int default 6
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select c.id, c.source_id, c.content,
         1 - (c.embedding <=> p_query_embedding) as similarity
  from chunks c
  join sources s on s.id = c.source_id
  where c.bot_id = p_bot_id
    and s.active = true
    and s.status = 'ready'
    and s.deleted_at is null
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;

create or replace function match_faqs(
  p_bot_id uuid,
  p_query_embedding vector(1024),
  p_match_count int default 3
)
returns table (
  id uuid,
  question text,
  answer text,
  similarity float
)
language sql stable
as $$
  select f.id, f.question, f.answer,
         1 - (f.embedding <=> p_query_embedding) as similarity
  from faqs f
  where f.bot_id = p_bot_id
    and f.embedding is not null
    and length(trim(f.answer)) > 0
  order by f.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- ============================================================
-- RLS：すべてのテーブルで有効化するが、許可ポリシーは追加しない。
-- アプリからのアクセスはすべて Next.js サーバー側で SUPABASE_SERVICE_ROLE_KEY を使う
-- （service_role は RLS を常にバイパスするため、これらのテーブルには
-- ブラウザ（anon / authenticated ロール）から直接アクセスできない）。
-- ============================================================

alter table bots enable row level security;
alter table bot_versions enable row level security;
alter table draft_changes enable row level security;
alter table faqs enable row level security;
alter table sources enable row level security;
alter table chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table unanswered_questions enable row level security;
alter table members enable row level security;
alter table usage_settings enable row level security;
alter table usage_totals enable row level security;
alter table rate_limit_events enable row level security;
