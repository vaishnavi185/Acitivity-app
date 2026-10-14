import type { Metadata } from 'next';
import React from 'react';
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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
