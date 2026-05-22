export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7f7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(70,255,0,0.22),transparent_25%),radial-gradient(circle_at_top_right,rgba(255,65,0,0.12),transparent_28%)]" />
      <div className="absolute inset-0 vercel-grid opacity-55" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f0f0f] text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <svg viewBox="0 0 75 65" fill="currentColor" className="h-6 w-6 text-[#ff4100]">
                <polygon points="37.5,0 75,65 0,65" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-xl font-semibold text-[#0f0f0f]">Baderna</p>
              <p className="text-sm text-[#7a7a7a]">Comunidade, guilda e hub competitivo</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
