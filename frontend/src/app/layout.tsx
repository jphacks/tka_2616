import type { Metadata, Viewport } from 'next';
import './globals.css';
import './pixel.css';
export const metadata: Metadata = { title: 'あわもん｜洗うたび、ちいさな幸せ。', description: '食器を洗って、水の妖精とちいさな池を育てよう。', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'あわもん', statusBarStyle: 'default' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#d7e9f3' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body>{children}</body></html>; }
