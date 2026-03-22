import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: treatments } = await supabase
    .from("treatments")
    .select("*")
    .order("name_ko");

  const { data: relations } = await supabase
    .from("clinic_treatments")
    .select("treatment_id");

  // 시술별 클리닉 수를 메모리에서 계산
  const countMap: Record<number, number> = {};
  (relations || []).forEach((r) => {
    countMap[r.treatment_id] = (countMap[r.treatment_id] || 0) + 1;
  });

  return (treatments || []).map((t) => ({
    ...t,
    clinicCount: countMap[t.id] || 0,
  }));
}

export default async function TreatmentsPage() {
  const treatments = await getData();
  const categories = [
    ...new Set(treatments.map((t) => t.category_ko || "기타")),
  ].sort();

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">시술 / Treatments</h1>
          <p className="text-gray-400 mt-1">{treatments.length}가지 시술</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        {categories.map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatments
                .filter((t) => (t.category_ko || "기타") === cat)
                .map((t) => (
                  <Link
                    key={t.id}
                    href={`/treatments/${encodeURIComponent(t.name_ko)}`}
                    className="border rounded-lg p-4 hover:shadow-md transition block"
                  >
                    <h3 className="font-bold text-lg">{t.name_ko}</h3>
                    <p className="text-gray-500 text-sm">{t.name_en}</p>
                    <p className="text-green-600 font-semibold mt-2">
                      {t.clinicCount} clinic{t.clinicCount > 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
