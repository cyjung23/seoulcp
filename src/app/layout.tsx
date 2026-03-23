import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABC Seoul — 서울 미용클리닉 검색",
  description:
    "피부 고민별로 서울 미용클리닉, 시술, 장비를 검색하세요. 14개 클리닉, 146개 장비, 283가지 시술 정보를 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {/* 글로벌 네비게이션 */}
        <nav className="bg-gray-900 text-white border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ABC Seoul
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-gray-300 transition">
                고민
              </Link>
              <Link href="/clinics" className="hover:text-gray-300 transition">
                클리닉
              </Link>
              <Link
                href="/treatments"
                className="hover:text-gray-300 transition"
              >
                시술
              </Link>
              <Link href="/devices" className="hover:text-gray-300 transition">
                장비
              </Link>
            </div>
          </div>
        </nav>

        {/* 페이지 본문 */}
        <main className="flex-1">{children}</main>

        {/* 푸터 */}
        <footer className="bg-gray-50 border-t text-gray-500 text-xs py-6 px-6">
          <div className="max-w-6xl mx-auto text-center">
            © 2026 ABC Seoul. 서울 미용클리닉 검색 플랫폼.
          </div>
        </footer>
      </body>
    </html>
  );
}
