import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import NavSearchBar from "./components/NavSearchBar";
import NavMobileMenu from "./components/NavMobileMenu";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "SeoulBC – 서울 미용·피부·성형 클리닉 검색 플랫폼",
    template: "%s | SeoulBC",
  },
  description:
    "서울 미용클리닉의 시술, 장비, 의사 정보를 고민별로 검색하세요. Seoul Beauty Code – 주름, 체형, 색소, 브랜드별 피부·성형 고민별 클리닉을 찾아드립니다.",
  keywords: [
    "서울 미용클리닉",
    "피부과",
    "성형외과",
    "미용시술",
    "피부고민",
    "Seoul beauty clinic",
    "Korean aesthetic clinic",
    "K-beauty clinic",
    "Seoul Beauty Code",
    "SeoulBC",
  ],
  openGraph: {
    title: "SeoulBC – 서울 미용·피부·성형 클리닉 검색 플랫폼",
    description:
      "고민별로 서울 미용클리닉, 시술, 장비를 검색하세요. Seoul Beauty Code.",
    url: "https://seoulbc.vercel.app",
    siteName: "SeoulBC",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL("https://seoulbc.vercel.app"),
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
        <nav className="bg-base-dark text-white border-b border-gray-800 sticky top-0 z-50 relative">
          <div className="max-w-7xl mx-auto px-4">
            {/* 1행: 로고 + 데스크톱 메뉴 + 모바일 햄버거 */}
            <div className="flex items-center justify-between h-11">
              {/* 로고 */}
              <Link href="/" className="text-[15px] font-bold tracking-tight flex-shrink-0">
                <span className="text-logo-s">S</span>
                <span className="text-gray-400">eoul </span>
                <span className="text-logo-b">B</span>
                <span className="text-gray-400">eauty </span>
                <span className="text-logo-c">C</span>
                <span className="text-gray-400">ode</span>
              </Link>

              {/* 데스크톱 메뉴 (md 이상) */}
              <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/concerns" className="text-gray-300 hover:text-ui-primary transition whitespace-nowrap">
                  고민
                </Link>
                <Link href="/treatments" className="text-gray-300 hover:text-ui-primary transition whitespace-nowrap">
                  시술
                </Link>
                <Link href="/surgeries" className="text-gray-300 hover:text-ui-primary transition whitespace-nowrap">
                  수술
                </Link>
                <Link href="/devices" className="text-gray-300 hover:text-ui-primary transition whitespace-nowrap">
                  장비
                </Link>
                <Link href="/clinics" className="text-gray-300 hover:text-ui-primary transition whitespace-nowrap">
                  클리닉
                </Link>
              </div>

              {/* 모바일 햄버거 (md 미만) */}
              <NavMobileMenu />
            </div>

            {/* 2행: 검색바 중앙 정렬 */}
            <div className="flex justify-center pb-2.5">
              <div className="w-full max-w-xl md:max-w-[520px]">
                <NavSearchBar />
              </div>
            </div>
          </div>
        </nav>

        {/* 페이지 본문 */}
        <main className="flex-1">{children}</main>

        {/* 푸터 */}
        <footer className="bg-gray-50 border-t text-gray-500 text-xs py-6 px-6">
          <div className="max-w-7xl mx-auto text-center">
            © 2026 SeoulBC. 서울 미용·피부·성형 클리닉 검색 플랫폼
          </div>
        </footer>
      </body>
    </html>
  );
}
