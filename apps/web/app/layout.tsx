import type { Metadata } from 'next';
import { APP_NAME } from '@raanko/shared';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Multi-tenant logistics and freight management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
