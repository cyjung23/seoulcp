import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface StandardTreatment {
  id: string;
  name_ko: string;
  name_en: string;
  category_ko: string;
  category_order: number;
  sort_order: number;
}

interface Treatment {
  id: number;
  name_ko: string;
  name_en: string;
  standard_treatment_id: string;
  clinicCount: number;
}

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: standards } = await supabase
    .from("standard_treatments")
    .select("*")
    .eq("type", "surgery")
    .order("category_order")
    .order("sort_order");

  const { data: treatments } = await supabase
    .from("treatments")
    .select("id, name_ko, name_en, standard_treatment_id")
    .not("standard_treatment_id", "is", null)
    .order("name_ko");

  const { data: relations } = await supabase
    .from("clinic_treatments")
    .select("treatment_id");

  const countMap: Record<number, number> = {};
  (relations || []).forEach((r) => {
    countMap[r.treatment_id] = (countMap[r.treatment_id] || 0) + 1;
  });

  const treatmentsWithCount = (treatments || []).map((t) => ({
    ...t,
    clinicCount: countMap[t.id] || 0,
  }));

  return {
    standards: (standards || []) as StandardTreatment[],
    treatments: treatmentsWithCount as Treatment[],
  };
}

export default async function SurgeriesPage() {
  const { standards, treatments } = await getData();

  const categories = standards.reduce<
    Record<string, { order: number; items: StandardTreatment[] }>
  >((acc, s) => {
    if (!acc[s.category_ko]) {
      acc[s.category_ko] = { order: s.category_order, items: [] };
    }
    acc[s.category_ko].items.push(s);
    return acc;
  }, {});

  const sortedCategories = Object.entries(categories).sort(
    ([, a], [, b]) => a.order - b.order
  );

  const stdClinicCount = (stdId: string) => {
    return treatments
      .filter((t) => t.standard_treatment_id === stdId)
      .reduce((sum, t) => sum + t.clinicCount, 0);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">수술 / Surgeries</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            {sortedCategories.length}개 카테고리 · {standards.length}개 표준 수술
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
        {sortedCategories.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            등록된 수술 정보가 없습니다.
          </p>
        ) : (
          sortedCategories.map(([categoryName, { items }]) => (
            <div key={categoryName} className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 border-b pb-2">
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {items.map((std) => {
                  const clinics = stdClinicCount(std.id);
                  return (
                    <Link
                      key={std.id}
                      href={`/treatments/${encodeURIComponent(std.name_ko)}`}
                      className="border rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-ui-primary transition block"
                    >
                      <h3 className="font-bold text-base sm:text-lg">{std.name_ko}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm">{std.name_en}</p>
                      <div className="mt-1.5 sm:mt-2 text-sm">
                        {clinics > 0 ? (
                          <span className="text-ui-accent font-semibold">
                            🏥 {clinics}개 클리닉
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">
                            준비중
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
