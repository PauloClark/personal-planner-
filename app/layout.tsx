import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
export const metadata: Metadata = { title: 'My Planner', description: 'A little structure. More room for life.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f8f9f6' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
