import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "ABC Seoul — 서울 미용·피부·성형 클리닉 검색 플랫폼",
    template: "%s | ABC Seoul",
  },
  description:
    "서울 미용클리닉의 시술, 장비, 의사 정보를 고민별로 검색하세요. All Beauty Clinic Seoul — 주름, 체형, 색소, 여드름 등 피부·성형 고민을 해결할 클리닉을 찾아드립니다.",
  keywords: [
    "서울 미용클리닉",
    "피부과",
    "성형외과",
    "미용시술",
    "피부고민",
    "Seoul beauty clinic",
    "Korean aesthetic clinic",
    "K-beauty clinic",
  ],
  openGraph: {
    title: "ABC Seoul — 서울 미용·피부·성형 클리닉 검색 플랫폼",
    description:
      "고민별로 서울 미용클리닉, 시술, 장비를 검색하세요. All Beauty Clinic Seoul.",
    url: "https://abcseoul.vercel.app",
    siteName: "ABC Seoul",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL("https://abcseoul.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-[var(--font-noto-sans-kr)]">
        {/* 글로벌 네비게이션 */}
        <nav className="bg-gray-900 text-white border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-[#22d3ee]">A</span>
              <span className="text-[#fb37a3]">B</span>
              <span className="text-[#facc15]">C</span>
              <span className="text-[#a3e635]"> Seoul</span>
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-gray-300 transition">
                고민
              </Link>
              <Link
                href="/treatments"
                className="hover:text-gray-300 transition"
              >
                시술
              </Link>
              <Link
                href="/surgeries"
                className="hover:text-gray-300 transition"
              >
                수술
              </Link>
              <Link href="/devices" className="hover:text-gray-300 transition">
                장비
              </Link>
              <Link href="/clinics" className="hover:text-gray-300 transition">
                클리닉
              </Link>
            </div>
          </div>
        </nav>

        {/* 페이지 본문 */}
        <main className="flex-1">{children}</main>

        {/* 푸터 */}
        <footer className="bg-gray-50 border-t text-gray-500 text-xs py-6 px-6">
          <div className="max-w-6xl mx-auto text-center">
            © 2026 ABC Seoul. 서울 미용·피부·성형 클리닉 검색 플랫폼.
          </div>
        </footer>
      </body>
    </html>
  );
}
