export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "radial-gradient(ellipse at 65% 40%, #1a3a6e 0%, #0f2147 40%, #070d1f 100%)" }} className="min-h-screen">
      {children}
    </div>
  );
}
