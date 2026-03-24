import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

async function getData(id: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", id)
    .single();

  if (!clinic) return null;

  const { data: deviceRows } = await supabase
    .from("clinic_devices")
    .select(
      "device_id, devices(id, device_name_ko, device_name_en, category_ko)"
    )
    .eq("clinic_id", id);

  const { data: treatmentRows } = await supabase
    .from("clinic_treatments")
    .select(
      "treatment_id, price_krw, description, treatments(id, name_ko, name_en, standard_treatment_id)"
    )
    .eq("clinic_id", id);

  // 표준 시술 목록 조회
  const { data: standards } = await supabase
    .from("standard_treatments")
    .select("id, name_ko, name_en, category_ko, category_order, sort_order")
    .order("category_order")
    .order("sort_order");

  const standardMap = new Map<string, any>();
  (standards || []).forEach((s) => standardMap.set(s.id, s));

  // 시술에 표준 시술 정보 연결
  const treatments = (treatmentRows || [])
    .map((r: any) => {
      if (!r.treatments?.id) return null;
      const std = r.treatments.standard_treatment_id
        ? standardMap.get(r.treatments.standard_treatment_id)
        : null;
      return {
        id: r.treatments.id,
        name_ko: r.treatments.name_ko,
        name_en: r.treatments.name_en,
        price_krw: r.price_krw,
        description: r.description,
        standard_name_ko: std?.name_ko || null,
        standard_category_ko: std?.category_ko || "기타",
        category_order: std?.category_order ?? 999,
        sort_order: std?.sort_order ?? 999,
      };
    })
    .filter(Boolean);

  const { data: doctors } = await supabase
    .from("doctors")
    .select("*, doctor_specialties(*)")
    .eq("clinic_id", id);

  return {
    clinic,
    devices: (deviceRows || []).map((r: any) => r.devices).filter(Boolean),
    treatments,
    doctors: doctors || [],
  };
}

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(Number(id));

  if (!data) return notFound();

  const { clinic, devices, treatments, doctors } = data;

  const deviceCategories = [
    ...new Set(devices.map((d: any) => d.category_ko || "기타")),
  ].sort();

  // 표준 카테고리 순서로 정렬
  const treatmentCategories = [
    ...new Set(treatments.map((t: any) => t.standard_category_ko)),
  ].sort((a, b) => {
    const orderA = treatments.find(
      (t: any) => t.standard_category_ko === a
    )?.category_order ?? 999;
    const orderB = treatments.find(
      (t: any) => t.standard_category_ko === b
    )?.category_order ?? 999;
    return orderA - orderB;
  });

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/clinics"
            className="text-gray-400 hover:text-white text-sm"
          >
            ← 클리닉 목록
          </Link>
          <h1 className="text-3xl font-bold mt-2">{clinic.name_ko}</h1>
          <p className="text-gray-400 mt-1">{clinic.name_en}</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        {/* 기본 정보 */}
        <div className="border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">기본 정보</h2>
          {clinic.address_ko && (
            <p className="text-gray-600 mb-2">📍 {clinic.address_ko}</p>
          )}
          {clinic.phone && (
            <p className="text-gray-600 mb-2">📞 {clinic.phone}</p>
          )}
          {clinic.operating_hours && (
            <p className="text-gray-600 mb-2">🕐 {clinic.operating_hours}</p>
          )}
          {clinic.website && (
            <a
              href={clinic.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              🌐 {clinic.website}
            </a>
          )}
        </div>

        {/* 시술 */}
        {treatments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              💉 시술 목록 ({treatments.length})
            </h2>
            {treatmentCategories.map((cat) => (
              <div key={cat} className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {treatments
                    .filter((t: any) => t.standard_category_ko === cat)
                    .sort(
                      (a: any, b: any) =>
                        a.sort_order - b.sort_order ||
                        a.name_ko.localeCompare(b.name_ko)
                    )
                    .map((t: any) => (
                      <Link
                        key={t.id}
                        href={
                          t.standard_name_ko
                            ? `/treatments/${encodeURIComponent(t.standard_name_ko)}`
                            : "#"
                        }
                        className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm hover:bg-green-100"
                      >
                        {t.name_ko}
                        {t.price_krw && (
                          <span className="ml-1 text-gray-500">
                            ₩{t.price_krw.toLocaleString()}
                          </span>
                        )}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 장비 */}
        {devices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              🔬 보유 장비 ({devices.length})
            </h2>
            {deviceCategories.map((cat) => (
              <div key={cat} className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {devices
                    .filter((d: any) => (d.category_ko || "기타") === cat)
                    .map((d: any) => (
                      <Link
                        key={d.id}
                        href={`/devices/${encodeURIComponent(d.device_name_ko)}`}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-100"
                      >
                        {d.device_name_ko}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 의사 */}
        {doctors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              👨‍⚕️ 의료진 ({doctors.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc: any) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <p className="font-bold">{doc.name_ko}</p>
                  <p className="text-gray-500 text-sm">{doc.name_en}</p>
                  <p className="text-gray-600 text-sm mt-1">{doc.title_ko}</p>
                  {doc.doctor_specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.doctor_specialties.map(
                        (s: any, idx: number) => (
                          <span
                            key={idx}
                            className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs"
                          >
                            {s.specialty_ko}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
