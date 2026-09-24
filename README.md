# 大阪石材 AIチャットボット・管理画面

大阪石材（https://www.osaka-sekizai.jp/）のホームページ向けAIチャットボットと、その管理画面です。
Next.js（App Router）+ Supabase（Auth・Postgres・pgvector・Storage）+ Anthropic Claude API + Voyage AI（埋め込み）で構成しています。

要件・用語ルール・設計判断は [`CLAUDE.md`](./CLAUDE.md) にまとめています。作業する前に必ず目を通してください。

> **このリポジトリの現状**：コードは実装済みですが、Supabase・Anthropic・Voyage AIの実アカウント・APIキーはまだ設定されていません。下記の手順で用意すると、そのまま動きます（`npm run lint` / `npx tsc --noEmit` / `npm run build` / `npm run test` はキー無しでも通ります）。

## 1. 必要なアカウント・キー

| サービス | 用途 | 取得先 |
| --- | --- | --- |
| Supabase | DB（Postgres + pgvector）・認証・PDF保存 | https://supabase.com/dashboard でプロジェクトを新規作成 |
| Anthropic | AIの回答生成（Claude API） | https://console.anthropic.com でAPIキーを発行 |
| Voyage AI | 埋め込み（検索用ベクトル） | https://dashboard.voyageai.com でAPIキーを発行 |

## 2. セットアップ手順

### 2-1. Supabaseプロジェクトの準備

1. Supabaseでプロジェクトを新規作成する。
2. プロジェクトの `SQL Editor` で、`supabase/migrations/0001_init.sql` → `supabase/migrations/0002_seed.sql` の順に実行する（pgvector拡張の有効化・テーブル作成・初期データ投入を行う）。
3. `Storage` で `source-files` という名前のバケットを作成する（Private のままでよい。PDFの保存先）。
4. `Authentication > Providers` でメールのマジックリンク（Email OTP / Magic Link）が有効になっていることを確認する。
5. `Authentication > URL Configuration` の Redirect URLs に、あとで設定する `NEXT_PUBLIC_SITE_URL` + `/auth/callback`（例：`http://localhost:3000/auth/callback`、本番なら実際のドメイン）を追加する。
6. 自分（運用担当者）を最初のメンバーとして登録する。`SQL Editor` で以下を実行する（メールアドレスは自分のものに置き換える）。
   ```sql
   insert into members (bot_id, email, role, is_owner)
   select id, 'your-email@example.com', 'editor', true from bots where slug = 'osaka-sekizai';
   ```
7. `Authentication > Users` から、上記と同じメールアドレスでユーザーを1件作成する（またはアプリの `/login` からマジックリンクを送り、初回ログイン時にSupabase Auth側にもユーザーが作られるのを待つ）。

### 2-2. 環境変数

`.env.example` を `.env.local` にコピーし、値を埋める。

```bash
cp .env.example .env.local
```

| 変数 | 説明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseの Project Settings > API から取得（anonキーはログインのセッション管理にのみ使う） |
| `SUPABASE_SERVICE_ROLE_KEY` | 同じくAPI設定から取得。データの読み書きはすべてこのキーを使うサーバー側コードのみが行う（**ブラウザには絶対に出さない**） |
| `BOT_SLUG` | `bots.slug`（既定値 `osaka-sekizai`、seed.sqlと合わせる） |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Claude APIのキーとモデルID（既定 `claude-haiku-4-5-20251001`） |
| `VOYAGE_API_KEY` / `VOYAGE_EMBEDDING_MODEL` | 埋め込みAPIのキーとモデル（既定 `voyage-multilingual-2`、1024次元） |
| `ALLOWED_WIDGET_ORIGINS` | 埋め込みウィジェットの利用を許可するドメイン（カンマ区切り） |
| `RATE_LIMIT_PER_MINUTE` / `RATE_LIMIT_PER_DAY` | お客さま向けチャットのIPごとの回数制限 |
| `NEXT_PUBLIC_SITE_URL` | 管理画面のURL（マジックリンクのリダイレクト先に使う） |
| `ANTHROPIC_INPUT_PRICE_PER_MTOK_USD` / `ANTHROPIC_OUTPUT_PRICE_PER_MTOK_USD` / `USD_TO_JPY_RATE` | 利用状況画面に表示する費用の見積もり用（Anthropicの料金ページの最新値を確認して設定） |

### 2-3. 起動

```bash
npm install
npm run dev
```

`http://localhost:3000/login` からログイン用のマジックリンクを送り（`2-1`で登録したメールアドレス宛）、メール内のリンクを開くと `/admin` に入れます。

## 3. 画面

| URL | 内容 |
| --- | --- |
| `/login` | ログイン（メールにマジックリンクを送る） |
| `/admin` | 管理画面ホーム |
| `/admin/sources` | 「AIに覚えさせる情報」（URL・PDF・テキストの登録。バックグラウンドで読み込み） |
| `/admin/faq` | 「よくある質問」 |
| `/admin/unanswered` | 「答えられなかった質問」 |
| `/admin/persona` | 「話し方・ルール」 |
| `/admin/appearance` | 「見た目」 |
| `/admin/usage` | 「利用状況」（今月の見積もり額・上限・上限到達時の案内） |
| `/admin/members` | 「メンバー」（招待・権限） |
| `/admin/publish` | 「公開と履歴」 |
| `/admin/conversations` | 「会話ログ」 |
| `/widget-demo` | お客さま向けチャットの見た目を確認するデモページ（公開版・実際のAPIを呼ぶ） |

管理画面右の「テスト画面」は常に**下書き**を、`/widget-demo`と埋め込みウィジェットは常に**公開版**を参照します。「AIに覚えさせる情報」「メンバー」「利用状況」は保存すると即座に反映され、下書き/公開の対象外です（理由は `CLAUDE.md` 10・12・13節）。

## 4. サイトへの埋め込み方

大阪石材のサイトの `</body>` の直前に、以下の1行を追加します。

```html
<script src="https://<デプロイ先のドメイン>/widget.js" data-bot-id="osaka-sekizai" async></script>
```

`widget.js` は `npm run build`（`npm run dev` も同様）のたびに `src/widget/main.ts` から自動生成されます（`npm run build:widget`）。Shadow DOMで描画するため、サイト側のCSSと干渉しません。

## 5. 開発コマンド

```bash
npm run lint         # ESLint
npx tsc --noEmit     # 型チェック
npm run test         # vitest（外部APIを呼ばない純粋なロジックの単体テスト）
npm run build        # 本番ビルド（widget.jsのビルドを含む）
npm run build:widget # widget.jsだけを再生成
```

## 6. アーキテクチャ概要

- **データ取得層**（`src/lib/data/`）：管理画面のコンポーネントから呼ばれる薄いクライアント関数。実体はすべて `/api/admin/*` のRoute Handlerへのfetch呼び出し。ブラウザからSupabaseへ直接アクセスすることはない（`CLAUDE.md` 13節）。
- **サーバー側の実処理**（`src/app/api/admin/*`、`src/lib/data/server/`）：`SUPABASE_SERVICE_ROLE_KEY` を使ってSupabaseを読み書きする。認可は `src/lib/auth/session.ts` の `requireMember()` で行う。
- **AIユーティリティ**（`src/lib/ai/`）：チャンク化・埋め込み（Voyage AI）・PDF/サイト本文抽出・Claude API呼び出し・未回答マーカー解析など。`src/app/api/chat/route.ts` がこれらを組み合わせてストリーミング応答を返す。
- **お客さま向けチャット**：管理画面と同じReactコンポーネント（`src/components/chat/`）を使う `/widget-demo` と、独立したvanilla TypeScriptバンドル `public/widget.js`（`src/widget/main.ts`）の2経路がある。どちらも同じ `/api/chat` / `/api/public/bot-config` を呼ぶ。

## 7. 現状の制約・今後

- 会話ログ・利用状況の保存期間に基づく自動削除は未実装（設定項目はあるが、実際の削除処理は行われない）。
- 公開履歴の件数上限・古い版の自動整理は未実装。
- 複数ボットには対応していない（`BOT_SLUG` 環境変数で単一ボットを指定する構成。ウィジェットの `data-bot-id` は受け取るが未使用）。
- 会話は単発処理で、複数ターンの文脈は保持しない。
- この開発環境ではSupabase/Anthropic/Voyage AIの実アカウントが無いため、ライブでの動作確認はできていない（`CLAUDE.md` 13-4節に確認済み範囲を記載）。上記の手順でキーを設定し、`npm run dev` で実際の動作を確認してください。

## 費用の目安について

- Supabase：無料枠内で小規模な運用は可能。DB容量・Storage容量・Auth利用者数に応じて有料プランへの移行を検討。
- Anthropic Claude API：`claude-haiku-4-5` は入出力トークンあたりの従量課金。プロンプトキャッシュを使っているため、同じ設定内容を繰り返し送る分のコストは抑えられる。
- Voyage AI：埋め込みAPIも従量課金（取り込み時と、お客さまの質問ごとに発生）。
- 実際の月額は会話数・サイト規模（チャンク数）に依存するため、`/admin/usage` の見積もり額を見ながら `月の利用上限` を調整してください。
