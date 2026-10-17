import type { Metadata, Viewport } from 'next';
import './globals.css';
import './pixel.css';
export const metadata: Metadata = { title: 'あわもんとなかまたち｜ちいさな幸せ。', description: '食器洗い・食材活用・料理・洗濯。毎日の「できた」で4つの小さな世界を育てよう。', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'あわもん', statusBarStyle: 'default' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#d7e9f3' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body>{children}</body></html>; }
