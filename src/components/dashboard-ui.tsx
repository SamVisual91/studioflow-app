export function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">{copy}</p>
    </div>
  );
}
