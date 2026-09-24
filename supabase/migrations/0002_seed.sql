-- 初期データ（ダミーUI試作フェーズの初期値と同じ内容にしている）
--
-- 埋め込み(embedding)は初期状態では計算しない（NULLのまま）。
-- 管理画面で質問を保存し直すと、そのタイミングでVoyage AIを呼んで計算される
-- （src/lib/data/faqs.ts の real 実装を参照）。

insert into bots (slug, name, draft_persona, draft_appearance)
values (
  'osaka-sekizai',
  'コーポレートサイト案内ボット',
  jsonb_build_object(
    'tone', 'polite',
    'bannedTopics', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid(), 'label', '他社との比較', 'enabled', true, 'isPreset', true),
      jsonb_build_object('id', gen_random_uuid(), 'label', '値引きの交渉', 'enabled', true, 'isPreset', true),
      jsonb_build_object('id', gen_random_uuid(), 'label', '宗派・しきたりの断定', 'enabled', true, 'isPreset', true),
      jsonb_build_object('id', gen_random_uuid(), 'label', '採用・求人について', 'enabled', true, 'isPreset', true)
    ),
    'contactPhone', '0120-1114-90',
    'contactUrl', 'https://www.osaka-sekizai.jp/contact/'
  ),
  jsonb_build_object(
    'colorPresetKey', 'navy',
    'customColor', '#1F3A7A',
    'position', 'right',
    'iconDataUrl', null,
    'botName', 'コーポレートサイト案内ボット',
    'launcherLabel', 'AIに相談する',
    'greeting', 'こんにちは。大阪石材の案内ボットです。お墓じまいや戒名彫刻など、気になることをお気軽にご質問ください。',
    'disclaimer', 'AIによる自動回答です。内容は参考情報であり、正式な金額はお見積もりでご確認ください。',
    'suggestions', jsonb_build_array('お墓じまいの金額・相場は？', 'お墓じまいの流れは？', '戒名彫刻の費用は？')
  )
)
on conflict (slug) do nothing;

insert into faqs (bot_id, question, answer)
select b.id, q, ''
from bots b
cross join (values
  ('お墓じまいの金額・相場は？'),
  ('お墓じまいの流れは？'),
  ('戒名彫刻の費用は？'),
  ('戒名彫刻の流れは？'),
  ('お墓じまい後の自宅用モニュメント制作')
) as seed(q)
where b.slug = 'osaka-sekizai'
on conflict do nothing;

insert into usage_settings (bot_id, monthly_limit_yen, notify_email)
select id, 50000, ''
from bots
where slug = 'osaka-sekizai'
on conflict (bot_id) do nothing;

-- 最初のメンバー（管理者）は、Supabase Authでユーザーを作成したあとに
-- 手動で1行追加する（email を実際のログインメールアドレスに置き換えること）。
-- 例:
-- insert into members (bot_id, email, role, is_owner)
-- select id, 'your-email@example.com', 'editor', true from bots where slug = 'osaka-sekizai';
