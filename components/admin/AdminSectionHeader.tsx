type AdminSectionHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function AdminSectionHeader({
  title,
  description,
  actions,
}: AdminSectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-[#111827] font-heading">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
