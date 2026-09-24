interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-surface px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-lg font-bold text-text">{title}</h1>
          <p className="mt-0.5 text-sm text-text-muted">{description}</p>
        </div>
        <p className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted">
          下書き・公開の仕組みはフェーズ2で追加予定です（今は変更するとすぐに反映されます）
        </p>
      </div>
    </div>
  );
}
