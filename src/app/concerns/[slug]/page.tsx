import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const concernName = decodeURIComponent(slug);

  const { data: concern } = await supabase
    .from("concerns")
    .select("*, concern_group_ko, concern_group_en")
    .eq("name_ko", concernName)
    .single();

  if (!concern) return null;

  const { data: treatmentRows } = await supabase
    .from("treatment_concerns")
    .select("treatment_id, treatments(id, name_ko, name_en, category_ko)")
    .eq("concern_id", concern.id);

  const treatments = (treatmentRows || [])
    .map((r: any) => r.treatments)
    .filter(Boolean);

  const treatmentIds = treatments.map((t: any) => t.id);

  const { data: clinicRelations } = await supabase
    .from("clinic_treatments")
    .select("treatment_id, clinic_id")
    .in("treatment_id", treatmentIds.length > 0 ? treatmentIds : [0]);

  const clinicCountMap: Record<number, number> = {};
  (clinicRelations || []).forEach((r) => {
    clinicCountMap[r.treatment_id] = (clinicCountMap[r.treatment_id] || 0) + 1;
  });

  const uniqueClinicIds = [
    ...new Set((clinicRelations || []).map((r) => r.clinic_id)),
  ];

  let clinics: any[] = [];
  if (uniqueClinicIds.length > 0) {
    const { data: clinicData } = await supabase
      .from("clinics")
      .select("id, name_ko, name_en, address_ko, phone")
      .in("id", uniqueClinicIds);
    clinics = clinicData || [];
  }

  return {
    concern,
    treatments: treatments.map((t: any) => ({
      ...t,
      clinicCount: clinicCountMap[t.id] || 0,
    })),
    clinics,
  };
}

export default async function ConcernDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData(slug);

  if (!data) return notFound();

  const { concern, treatments, clinics } = data;

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <span>/</span>
            {concern.concern_group_ko ? (
              <>
                <Link
                  href={`/concerns?category=${encodeURIComponent(
                    concern.concern_group_ko
                  )}`}
                  className="hover:text-white transition"
                >
                  {concern.concern_group_ko}
                </Link>
                <span>/</span>
              </>
            ) : (
              <>
                <Link
                  href="/concerns"
                  className="hover:text-white transition"
                >
                  고민
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-300">{concern.name_ko}</span>
          </div>

          <h1 className="text-3xl font-bold mt-3">{concern.name_ko}</h1>
          <p className="text-gray-400 mt-1">{concern.name_en}</p>
          {concern.concern_group_ko && (
            <span className="inline-block bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs mt-3">
              {concern.concern_group_ko} · {concern.concern_group_en}
            </span>
          )}
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        <h2 className="text-xl font-bold mb-4">
          관련 시술 ({treatments.length})
        </h2>
        {treatments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {treatments.map((t: any) => (
              <Link
                key={t.id}
                href={`/treatments/${encodeURIComponent(t.name_ko)}`}
                className="border rounded-lg p-4 hover:shadow-md hover:border-ui-secondary transition block"
              >
                <h3 className="font-bold text-lg">{t.name_ko}</h3>
                <p className="text-gray-500 text-sm">{t.name_en}</p>
                <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs mt-2">
                  {t.category_ko}
                </span>
                <p className="text-ui-accent font-semibold mt-2">
                  {t.clinicCount} clinic{t.clinicCount !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-10">
            아직 연결된 시술이 없습니다.
          </p>
        )}

        {clinics.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4">
              관련 클리닉 ({clinics.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/clinics/${c.id}`}
                  className="border rounded-lg p-4 hover:shadow-md hover:border-ui-accent transition block"
                >
                  <h3 className="font-bold text-lg">{c.name_ko}</h3>
                  <p className="text-gray-500 text-sm">{c.name_en}</p>
                  {c.address_ko && (
                    <p className="text-gray-600 text-sm mt-2">
                      📍 {c.address_ko}
                    </p>
                  )}
                  {c.phone && (
                    <p className="text-gray-600 text-sm mt-1">
                      📞 {c.phone}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
