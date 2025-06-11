import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crossmint Auth Demo',
  description: 'A demo application showcasing Crossmint authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
