import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

const BODY_CROSS_REF = [
  "지방파괴주사(바디)",
  "지방분해주사(바디)",
];

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: standards } = await supabase
    .from("standard_treatments")
    .select("*")
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

export default async function TreatmentsPage() {
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

  const crossRefItems = standards.filter(
    (s) => s.category_ko === "지방제거주사" && BODY_CROSS_REF.includes(s.name_ko)
  );

  const stdClinicCount = (stdId: string) => {
    return treatments
      .filter((t) => t.standard_treatment_id === stdId)
      .reduce((sum, t) => sum + t.clinicCount, 0);
  };

  const stdTreatmentCount = (stdId: string) => {
    return treatments.filter((t) => t.standard_treatment_id === stdId).length;
  };

  const renderCard = (std: StandardTreatment) => {
    const clinics = stdClinicCount(std.id);
    const treatmentVariants = stdTreatmentCount(std.id);
    return (
      <Link
        key={std.id}
        href={`/treatments/${encodeURIComponent(std.name_ko)}`}
        className="border rounded-lg p-4 hover:shadow-md transition block"
      >
        <h3 className="font-bold text-lg">{std.name_ko}</h3>
        <p className="text-gray-500 text-sm">{std.name_en}</p>
        <div className="mt-2 flex gap-3 text-sm">
          <span className="text-green-600 font-semibold">
            🏥 {clinics}개 클리닉
          </span>
          <span className="text-blue-600 font-semibold">
            💉 {treatmentVariants}개 시술
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">시술 / Treatments</h1>
          <p className="text-gray-400 mt-1">
            {sortedCategories.length}개 카테고리 · {standards.length}개 표준 시술
          </p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        {sortedCategories.map(([categoryName, { items }]) => (
          <div key={categoryName} className="mb-10">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">
              {categoryName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((std) => renderCard(std))}
              {categoryName === "바디" &&
                crossRefItems.map((std) => renderCard(std))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
