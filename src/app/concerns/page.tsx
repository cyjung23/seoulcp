import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = [
  { ko: "주름/탄력", en: "Wrinkles & Firmness", icon: "✨" },
  { ko: "얼굴윤곽/볼륨", en: "Face Shape & Volume", icon: "💎" },
  { ko: "체형/지방", en: "Body Contouring & Fat", icon: "🏋️" },
  { ko: "색소/피부톤", en: "Pigmentation & Skin Tone", icon: "🎨" },
  { ko: "점/사마귀 제거", en: "Spot & Wart Removal", icon: "🔍" },
  { ko: "여드름/모공/피지", en: "Acne, Pores & Sebum", icon: "🧴" },
  { ko: "피부회복/안티에이징", en: "Skin Rejuvenation & Anti-Aging", icon: "🌿" },
  { ko: "홍조/혈관", en: "Redness & Vessels", icon: "❤️‍🔥" },
  { ko: "탈모/두피", en: "Hair Loss & Scalp", icon: "💇" },
  { ko: "흉터", en: "Scars", icon: "🩹" },
  { ko: "부작용/재시술", en: "Complications & Correction", icon: "🔄" },
  { ko: "기타고민", en: "Other Concerns", icon: "📋" },
];

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: concerns } = await supabase
    .from("concerns")
    .select("id, name_ko, name_en, concern_group_ko, concern_group_en")
    .order("name_ko");

  const { data: relations } = await supabase
    .from("treatment_concerns")
    .select("concern_id");

  const countMap: Record<number, number> = {};
  (relations || []).forEach((r) => {
    countMap[r.concern_id] = (countMap[r.concern_id] || 0) + 1;
  });

  return (concerns || []).map((c) => ({
    ...c,
    treatmentCount: countMap[c.id] || 0,
  }));
}

export default async function ConcernsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allConcerns = await getData();

  const grouped: Record<string, typeof allConcerns> = {};
  allConcerns.forEach((c) => {
    const key = c.concern_group_ko || "기타고민";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  const selectedCategory = category ? decodeURIComponent(category) : null;

  const displayCategories = selectedCategory
    ? CATEGORY_ORDER.filter((cat) => cat.ko === selectedCategory)
    : CATEGORY_ORDER;

  const totalCount = selectedCategory
    ? (grouped[selectedCategory] || []).length
    : allConcerns.length;

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            {selectedCategory ? selectedCategory : "전체 고민"}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            {selectedCategory
              ? `${
                  CATEGORY_ORDER.find((c) => c.ko === selectedCategory)?.en ||
                  ""
                } · ${totalCount}개 고민`
              : `12개 카테고리 · ${totalCount}개 고민`}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
          <Link
            href="/concerns"
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
              !selectedCategory
                ? "bg-cat-concern text-white border-cat-concern"
                : "bg-white text-gray-600 border-gray-300 hover:border-cat-concern"
            }`}
          >
            전체
          </Link>
          {CATEGORY_ORDER.map((cat) => {
            const isActive = selectedCategory === cat.ko;
            const count = (grouped[cat.ko] || []).length;
            return (
              <Link
                key={cat.ko}
                href={`/concerns?category=${encodeURIComponent(cat.ko)}`}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                  isActive
                    ? "bg-cat-concern text-white border-cat-concern"
                    : "bg-white text-gray-600 border-gray-300 hover:border-cat-concern"
                }`}
              >
                {cat.icon} {cat.ko}
                <span className="ml-1 opacity-60">{count}</span>
              </Link>
            );
          })}
        </div>

        {displayCategories.map((cat) => {
          const items = grouped[cat.ko] || [];
          if (items.length === 0) return null;
          return (
            <div key={cat.ko} className="mb-6 sm:mb-8">
              {!selectedCategory && (
                <div className="flex items-center gap-2 mb-3 sm:mb-4 border-b pb-2">
                  <span className="text-lg sm:text-xl">{cat.icon}</span>
                  <h2 className="text-lg sm:text-xl font-bold">{cat.ko}</h2>
                  <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">{cat.en}</span>
                  <span className="text-xs sm:text-sm text-gray-400 ml-auto">
                    {items.length}개
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {items.map((c) => (
                  <Link
                    key={c.id}
                    href={`/concerns/${encodeURIComponent(c.name_ko)}`}
                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-cat-concern transition block"
                  >
                    <h3 className="font-bold text-base sm:text-lg">{c.name_ko}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm">{c.name_en}</p>
                    <p className="text-cat-concern font-semibold mt-1.5 sm:mt-2 text-sm">
                      {c.treatmentCount} treatment
                      {c.treatmentCount !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {selectedCategory && (grouped[selectedCategory] || []).length === 0 && (
          <p className="text-gray-500 text-center py-12">
            해당 카테고리에 등록된 고민이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}
