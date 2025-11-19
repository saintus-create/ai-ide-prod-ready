export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen bg-surface text-gray-200 flex flex-col">
      {/* Header */}
      <header className="h-10 bg-surface/80 flex items-center px-4 text-sm">
        <span className="font-mono">AI‑IDE – Codestral / ChatGPT‑OSS / dKimi</span>
      </header>

      {/* Main UI */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}