import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

async function getData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const treatmentName = decodeURIComponent(slug);

  const { data: treatment } = await supabase
    .from("treatments")
    .select("*")
    .eq("name_ko", treatmentName)
    .single();

  if (!treatment) return null;

  const { data: clinicRows } = await supabase
    .from("clinic_treatments")
    .select("clinic_id, price_krw, description, clinics(id, name_ko, name_en, address_ko, phone)")
    .eq("treatment_id", treatment.id);

  const { data: concernRows } = await supabase
    .from("treatment_concerns")
    .select("concern_id, concerns(id, name_ko, name_en)")
    .eq("treatment_id", treatment.id);

  const { data: bodyPartRows } = await supabase
    .from("treatment_body_parts")
    .select("body_part_id, body_parts(id, name_ko, name_en)")
    .eq("treatment_id", treatment.id);

  return {
    treatment,
    clinics: (clinicRows || []).map((r: any) => ({
      ...r.clinics,
      price_krw: r.price_krw,
      description: r.description,
    })).filter((c: any) => c.id),
    concerns: (concernRows || []).map((r: any) => r.concerns).filter(Boolean),
    bodyParts: (bodyPartRows || []).map((r: any) => r.body_parts).filter(Boolean),
  };
}

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData(slug);

  if (!data) return notFound();

  const { treatment, clinics, concerns, bodyParts } = data;

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/treatments" className="text-gray-400 hover:text-white text-sm">
            ← 시술 목록
          </Link>
          <h1 className="text-3xl font-bold mt-2">{treatment.name_ko}</h1>
          <p className="text-gray-400 mt-1">{treatment.name_en}</p>
          <span className="inline-block bg-gray-700 px-3 py-1 rounded-full text-sm mt-3">
            {treatment.category_ko}
          </span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        {/* 시술 설명 */}
        {treatment.description_ko && (
          <div className="border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-2">시술 설명</h2>
            <p className="text-gray-600">{treatment.description_ko}</p>
          </div>
        )}

        {/* 관련 부위 */}
        {bodyParts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">시술 부위</h2>
            <div className="flex flex-wrap gap-2">
              {bodyParts.map((bp: any) => (
                <span key={bp.id} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                  {bp.name_ko}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 관련 고민 */}
        {concerns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">관련 고민</h2>
            <div className="flex flex-wrap gap-2">
              {concerns.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/concerns/${encodeURIComponent(c.name_ko)}`}
                  className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-100"
                >
                  {c.name_ko}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 시술 가능 클리닉 */}
        <h2 className="text-xl font-bold mb-4">
          시술 가능 클리닉 ({clinics.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((c: any) => (
            <Link
              key={c.id}
              href={`/clinics/${c.id}`}
              className="border rounded-lg p-4 hover:shadow-md transition block"
            >
              <h3 className="font-bold text-lg">{c.name_ko}</h3>
              <p className="text-gray-500 text-sm">{c.name_en}</p>
              {c.address_ko && (
                <p className="text-gray-600 text-sm mt-2">📍 {c.address_ko}</p>
              )}
              {c.phone && (
                <p className="text-gray-600 text-sm mt-1">📞 {c.phone}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
