import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const categoryConfig: Record<
  string,
  { label: string; labelEn: string; hoverClass: string; catColor: string }
> = {
  treatment: {
    label: "시술",
    labelEn: "Treatments",
    hoverClass: "hover:border-cat-treat",
    catColor: "text-cat-treat",
  },
  surgery: {
    label: "수술",
    labelEn: "Surgeries",
    hoverClass: "hover:border-cat-surgery",
    catColor: "text-cat-surgery",
  },
  device: {
    label: "장비",
    labelEn: "Devices",
    hoverClass: "hover:border-cat-device",
    catColor: "text-cat-device",
  },
};

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: items } = await supabase
    .from("encyclopedia")
    .select("id, slug, title_ko, title_en, category, summary")
    .order("category")
    .order("title_ko");

  return items || [];
}

export default async function WikiPage() {
  const items = await getData();

  // 카테고리별 그룹화
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const categoryKeys = Object.keys(grouped);
  const totalItems = items.length;

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            미용백과 / Encyclopedia
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            {totalItems > 0
              ? `${categoryKeys.length}개 카테고리 · ${totalItems}개 항목`
              : ""}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
        {totalItems === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl font-bold mb-2">콘텐츠 준비 중입니다</p>
            <p className="text-sm">
              미용백과 항목이 곧 추가될 예정입니다.
            </p>
          </div>
        ) : (
          (["treatment", "surgery", "device"] as const).map((cat) => {
            const catItems = grouped[cat];
            if (!catItems || catItems.length === 0) return null;
            const config = categoryConfig[cat];

            return (
              <div key={cat} className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 border-b pb-2">
                  <span className={config.catColor}>{config.label}</span>
                  <span className="text-gray-400 text-sm sm:text-base ml-2">
                    {config.labelEn}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {catItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/wiki/${item.slug}`}
                      className={`border rounded-lg p-3 sm:p-4 hover:shadow-md ${config.hoverClass} transition block`}
                    >
                      <h3 className="font-bold text-base sm:text-lg">
                        {item.title_ko}
                      </h3>
                      {item.title_en && (
                        <p className="text-gray-500 text-xs sm:text-sm">
                          {item.title_en}
                        </p>
                      )}
                      {item.summary && (
                        <p className="text-gray-400 text-xs sm:text-sm mt-1.5 sm:mt-2 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
