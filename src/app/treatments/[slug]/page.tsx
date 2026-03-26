import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const treatmentName = decodeURIComponent(slug);

  const { data: standard } = await supabase
    .from("standard_treatments")
    .select("*")
    .eq("name_ko", treatmentName)
    .single();

  if (!standard) return null;

  const { data: treatments } = await supabase
    .from("treatments")
    .select("id, name_ko, name_en")
    .eq("standard_treatment_id", standard.id)
    .order("name_ko");

  const treatmentIds = (treatments || []).map((t) => t.id);

  if (treatmentIds.length === 0) {
    return { standard, treatments: [], clinics: [], concerns: [], bodyParts: [] };
  }

  const { data: clinicRows } = await supabase
    .from("clinic_treatments")
    .select(
      "treatment_id, price_krw, description, clinics(id, name_ko, name_en, address_ko, phone)"
    )
    .in("treatment_id", treatmentIds);

  const clinicMap = new Map<number, any>();
  (clinicRows || []).forEach((r: any) => {
    if (!r.clinics?.id) return;
    const clinicId = r.clinics.id;
    if (!clinicMap.has(clinicId)) {
      clinicMap.set(clinicId, {
        ...r.clinics,
        treatments: [],
      });
    }
    const treatmentInfo = (treatments || []).find((t) => t.id === r.treatment_id);
    clinicMap.get(clinicId).treatments.push({
      name_ko: treatmentInfo?.name_ko || "",
      price_krw: r.price_krw,
      description: r.description,
    });
  });

  const { data: concernRows } = await supabase
    .from("treatment_concerns")
    .select("concern_id, concerns(id, name_ko, name_en)")
    .in("treatment_id", treatmentIds);

  const concernMap = new Map<number, any>();
  (concernRows || []).forEach((r: any) => {
    if (r.concerns?.id) concernMap.set(r.concerns.id, r.concerns);
  });

  const { data: bodyPartRows } = await supabase
    .from("treatment_body_parts")
    .select("body_part_id, body_parts(id, name_ko, name_en)")
    .in("treatment_id", treatmentIds);

  const bodyPartMap = new Map<number, any>();
  (bodyPartRows || []).forEach((r: any) => {
    if (r.body_parts?.id) bodyPartMap.set(r.body_parts.id, r.body_parts);
  });

  return {
    standard,
    treatments: treatments || [],
    clinics: Array.from(clinicMap.values()),
    concerns: Array.from(concernMap.values()),
    bodyParts: Array.from(bodyPartMap.values()),
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

  const { standard, treatments, clinics, concerns, bodyParts } = data;

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/treatments"
            className="text-gray-400 hover:text-white text-sm"
          >
            ← 시술 목록
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">{standard.name_ko}</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{standard.name_en}</p>
          <span className="inline-block bg-gray-700 px-3 py-1 rounded-full text-xs sm:text-sm mt-2">
            {standard.category_ko}
          </span>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-5 sm:py-8 px-4 sm:px-6">
        {treatments.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3">
              세부 시술 ({treatments.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {treatments.map((t) => (
                <span
                  key={t.id}
                  className="bg-blue-50 text-ui-secondary px-3 py-1 rounded-full text-xs sm:text-sm"
                >
                  {t.name_ko}
                </span>
              ))}
            </div>
          </div>
        )}

        {bodyParts.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3">시술 부위</h2>
            <div className="flex flex-wrap gap-2">
              {bodyParts.map((bp: any) => (
                <span
                  key={bp.id}
                  className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs sm:text-sm"
                >
                  {bp.name_ko}
                </span>
              ))}
            </div>
          </div>
        )}

        {concerns.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3">관련 고민</h2>
            <div className="flex flex-wrap gap-2">
              {concerns.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/concerns/${encodeURIComponent(c.name_ko)}`}
                  className="bg-blue-50 text-ui-primary px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-blue-100"
                >
                  {c.name_ko}
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
          시술 가능 클리닉 ({clinics.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {clinics.map((c: any) => (
            <Link
              key={c.id}
              href={`/clinics/${c.id}`}
              className="border rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-ui-accent transition block"
            >
              <h3 className="font-bold text-base sm:text-lg">{c.name_ko}</h3>
              <p className="text-gray-500 text-xs sm:text-sm">{c.name_en}</p>
              {c.address_ko && (
                <p className="text-gray-600 text-xs sm:text-sm mt-2">📍 {c.address_ko}</p>
              )}
              {c.phone && (
                <p className="text-gray-600 text-xs sm:text-sm mt-1">📞 {c.phone}</p>
              )}
              {c.treatments && c.treatments.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  {c.treatments.map((ct: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs sm:text-sm mt-1">
                      <span className="text-gray-700">{ct.name_ko}</span>
                      {ct.price_krw && (
                        <span className="text-ui-accent font-semibold">
                          ₩{ct.price_krw.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
