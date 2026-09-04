import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'TOONFORGE — Adaptive Structure-Aware Routing for LLM Context Serialization',
  description:
    'An implemented and empirically benchmarked architecture unifying JSON, TOON, JTON, and ONTO.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-surface antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-container">
        <Sidebar />
        <div className="pl-72 min-h-screen flex flex-col">
          <Header />
          <main className="w-full pt-16 bg-surface flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
