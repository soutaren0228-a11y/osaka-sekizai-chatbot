export function ReadOnlyNotice() {
  return (
    <p className="rounded-[var(--radius-control)] border border-border bg-bg px-3 py-2 text-sm text-text-muted">
      今は「見るだけ」の権限で表示しています。変更するには、メンバー画面で権限を「編集できる」に切り替えてください。
    </p>
  );
}
