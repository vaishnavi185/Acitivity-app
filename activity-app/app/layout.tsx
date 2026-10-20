import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import AppShell from '@/src/components/dashboard/AppShell';
import { AuthProvider } from '@/src/components/auth/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'GatherUp',
  description: 'Discover and host local activities with GatherUp.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<main className="min-h-screen bg-[#FAF8F5]" aria-label="Loading application" />}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
