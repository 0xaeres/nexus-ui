export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="anvay-scrollbar-visible min-h-screen bg-bg text-fg">{children}</div>
}
