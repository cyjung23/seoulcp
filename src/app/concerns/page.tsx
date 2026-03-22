import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: concerns } = await supabase
    .from("concerns")
    .select("*")
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

export default async function ConcernsPage() {
  const concerns = await getData();

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">고민 / Concerns</h1>
          <p className="text-gray-400 mt-1">{concerns.length}가지 피부 고민</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {concerns.map((c) => (
            <Link
              key={c.id}
              href={`/concerns/${encodeURIComponent(c.name_ko)}`}
              className="border rounded-lg p-4 hover:shadow-md transition block"
            >
              <h3 className="font-bold text-lg">{c.name_ko}</h3>
              <p className="text-gray-500 text-sm">{c.name_en}</p>
              <p className="text-red-600 font-semibold mt-2">
                {c.treatmentCount} treatment{c.treatmentCount > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
