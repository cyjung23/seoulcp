import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "./components/SearchBar";

/* ────────────────────────────────────────────
   12 카테고리 정의 (확정본)
   ──────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 1,
    ko: "주름·탄력",
    en: "Wrinkles & Firmness",
    icon: "✨",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: 2,
    ko: "얼굴윤곽·볼륨",
    en: "Face Shape & Volume",
    icon: "💎",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: 3,
    ko: "체형·지방",
    en: "Body Contouring & Fat",
    icon: "🏋️",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    id: 4,
    ko: "색소·피부톤",
    en: "Pigmentation & Skin Tone",
    icon: "🎨",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: 5,
    ko: "점·사마귀·제거",
    en: "Spots, Warts & Removal",
    icon: "🔍",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    id: 6,
    ko: "여드름·모공·피지",
    en: "Acne, Pores & Sebum",
    icon: "🧴",
    color: "bg-lime-50 text-lime-700 border-lime-200",
  },
  {
    id: 7,
    ko: "피부회복·안티에이징",
    en: "Skin Rejuvenation & Anti-Aging",
    icon: "🌿",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: 8,
    ko: "홍조·혈관",
    en: "Redness & Vessels",
    icon: "❤️‍🔥",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: 9,
    ko: "탈모·두피",
    en: "Hair Loss & Scalp",
    icon: "💇",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    id: 10,
    ko: "흉터",
    en: "Scars",
    icon: "🩹",
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: 11,
    ko: "부작용·재시술",
    en: "Complications & Correction",
    icon: "🔄",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: 12,
    ko: "기타고민",
    en: "Other Concerns",
    icon: "📋",
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
];

/* ────────────────────────────────────────────
   데이터 로드
   ──────────────────────────────────────────── */
async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 전체 카운트
  const [clinics, devices, treatments] = await Promise.all([
    supabase.from("clinics").select("*", { count: "exact", head: true }),
    supabase.from("devices").select("*", { count: "exact", head: true }),
    supabase.from("treatments").select("*", { count: "exact", head: true }),
  ]);

  // 카테고리별 concern 수
  const { data: concerns } = await supabase
    .from("concerns")
    .select("id, concern_group_ko");

  const groupCounts: Record<string, number> = {};
  (concerns || []).forEach((c) => {
    const key = c.concern_group_ko || "기타고민";
    groupCounts[key] = (groupCounts[key] || 0) + 1;
  });

  return {
    clinicCount: clinics.count || 0,
    deviceCount: devices.count || 0,
    treatmentCount: treatments.count || 0,
    groupCounts,
  };
}

/* ────────────────────────────────────────────
   페이지 렌더링
   ──────────────────────────────────────────── */
export default async function Home() {
  const { clinicCount, deviceCount, treatmentCount, groupCounts } =
    await getData();

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <header className="bg-gray-900 text-white py-14 px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight"><span className="text-[#22d3ee]">A</span><span>ll </span><span className="text-[#fb37a3]">B</span><span>eauty </span><span className="text-[#facc15]">C</span><span>linic </span><span className="text-[#a3e635]">Seoul</span></h1>
        <p className="text-gray-400 mt-2 text-sm tracking-wide">서울 미용·피부·성형 클리닉 검색 플랫폼</p><p className="text-gray-300 mt-3 text-lg">
          어떤 고민이 있으신가요?
        </p>
        <div className="mt-5 px-4">
          <SearchBar placeholder="고민, 시술, 장비, 클리닉을 검색하세요..." />
        </div>
        <p className="text-gray-500 mt-4 text-sm">
          {clinicCount} clinics · {deviceCount} devices · {treatmentCount}{" "}
          treatments
        </p>
      </header>

      {/* 12 카테고리 그리드 */}
      <section className="max-w-6xl mx-auto py-10 px-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          고민별 카테고리
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const count = groupCounts[cat.ko] || 0;
            return (
              <Link
                key={cat.id}
                href={`/concerns?category=${encodeURIComponent(cat.ko)}`}
                className={`border rounded-xl p-5 hover:shadow-lg transition block ${cat.color}`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <h3 className="font-bold text-base mt-3 leading-snug">
                  {cat.ko}
                </h3>
                <p className="text-xs mt-1 opacity-70">{cat.en}</p>
                <p className="text-sm font-semibold mt-2">
                  {count}개 고민
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 빠른 링크 */}
      <section className="max-w-6xl mx-auto pb-12 px-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">바로가기</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/treatments"
            className="border rounded-xl p-6 hover:shadow-lg transition block text-center"
          >
            <span className="text-3xl">💉</span>
            <h3 className="font-bold mt-3">시술</h3>
            <p className="text-gray-500 text-sm mt-1">
              {treatmentCount}가지 시술 정보
            </p>
          </Link>
          <Link
            href="/devices"
            className="border rounded-xl p-6 hover:shadow-lg transition block text-center"
          >
            <span className="text-3xl">🔬</span>
            <h3 className="font-bold mt-3">장비</h3>
            <p className="text-gray-500 text-sm mt-1">
              {deviceCount}개 미용 장비
            </p>
          </Link>
          <Link
            href="/clinics"
            className="border rounded-xl p-6 hover:shadow-lg transition block text-center"
          >
            <span className="text-3xl">🏥</span>
            <h3 className="font-bold mt-3">클리닉</h3>
            <p className="text-gray-500 text-sm mt-1">
              서울 {clinicCount}개 클리닉
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
