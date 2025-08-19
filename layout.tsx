import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Webmake – AI Website Generator',
  description: 'Generate a complete website with AI in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b">
          <nav className="container-custom flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
              <span>Webmake</span>
              <span className="text-brand-400">AI</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="nav-link">
                Home
              </Link>
              <Link href="/demo" className="nav-link">
                Demo
              </Link>
              <Link href="/contact" className="nav-link">
                Contact
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t">
          <div className="container-custom py-10 text-sm text-gray-600">© {new Date().getFullYear()} Webmake. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}