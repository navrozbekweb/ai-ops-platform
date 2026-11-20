export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="auth-title"
      className="w-full max-w-md flex-[0_1_420px] rounded-3xl border border-white/22 bg-[rgb(8_15_30/0.62)] p-6 backdrop-blur-xl sm:p-8"
    >
      <div className="mb-6 flex flex-col gap-1">
        <h1 id="auth-title" className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-white/75">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
