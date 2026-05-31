import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="bg-primary text-white p-4">
        <ul className="flex space-x-4">
          <li><Link href="/journal">Journal</Link></li>
          <li><Link href="/entries">Entries</Link></li>
          <li><Link href="/roots">Roots</Link></li>
          <li><Link href="/insights">Insights</Link></li>
          <li><Link href="/settings">Settings</Link></li>
        </ul>
      </nav>
      <main className="flex-grow p-4">
        {children}
      </main>
    </div>
  );
}
