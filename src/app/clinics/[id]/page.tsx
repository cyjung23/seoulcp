import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

  const { data: standards } = await supabase
    .from("standard_treatments")
    .select("id, name_ko, name_en, category_ko, category_order, sort_order")
    .order("category_order")
    .order("sort_order");

  const standardMap = new Map<string, any>();
  (standards || []).forEach((s) => standardMap.set(s.id, s));

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

  const { data: clinicSpecs } = await supabase
    .from("clinic_specialties")
    .select("specialty_ko")
    .eq("clinic_id", id);

  const specialties = (clinicSpecs || []).map((cs: any) => cs.specialty_ko);

  return {
    clinic,
    devices: (deviceRows || []).map((r: any) => r.devices).filter(Boolean),
    treatments,
    specialties,
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

  const { clinic, devices, treatments, specialties } = data;

  const deviceCategories = [
    ...new Set(devices.map((d: any) => d.category_ko || "기타")),
  ].sort();

  const treatmentCategories = [
    ...new Set(treatments.map((t: any) => t.standard_category_ko)),
  ].sort((a, b) => {
    const orderA =
      treatments.find((t: any) => t.standard_category_ko === a)
        ?.category_order ?? 999;
    const orderB =
      treatments.find((t: any) => t.standard_category_ko === b)
        ?.category_order ?? 999;
    return orderA - orderB;
  });

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/clinics"
            className="text-gray-400 hover:text-white text-sm"
          >
            ← 클리닉 목록
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            {clinic.name_ko}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            {clinic.name_en}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-5 sm:py-8 px-4 sm:px-6">
        <div className="border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
            기본 정보
          </h2>
          {clinic.address_ko && (
            <p className="text-gray-600 text-sm mb-2">
              📍 {clinic.address_ko}
            </p>
          )}
          {clinic.phone && (
            <p className="text-gray-600 text-sm mb-2">📞 {clinic.phone}</p>
          )}
          {clinic.operating_hours && (
            <p className="text-gray-600 text-sm mb-2">
              🕐 {clinic.operating_hours}
            </p>
          )}
          {clinic.website && (
            <a
              href={clinic.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cat-clinic hover:underline text-sm"
            >
              🔗 {clinic.website}
            </a>
          )}

          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 pt-4 border-t">
              {specialties.map((spec: string, i: number) => (
                <span
                  key={i}
                  className="bg-tag-device-bg text-cat-device px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {treatments.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              💉 시술 목록 ({treatments.length})
            </h2>
            {treatmentCategories.map((cat) => (
              <div key={cat} className="mb-3 sm:mb-4">
                <h3 className="font-semibold text-gray-700 text-sm sm:text-base mb-2">
                  {cat}
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                            ? `/treatments/${encodeURIComponent(
                                t.standard_name_ko
                              )}`
                            : "#"
                        }
                        className="bg-tag-treat-bg text-cat-treat px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm hover:opacity-80"
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

        {devices.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              🔬 보유 장비 ({devices.length})
            </h2>
            {deviceCategories.map((cat) => (
              <div key={cat} className="mb-3 sm:mb-4">
                <h3 className="font-semibold text-gray-700 text-sm sm:text-base mb-2">
                  {cat}
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {devices
                    .filter((d: any) => (d.category_ko || "기타") === cat)
                    .map((d: any) => (
                      <Link
                        key={d.id}
                        href={`/devices/${encodeURIComponent(
                          d.device_name_ko
                        )}`}
                        className="bg-tag-device-bg text-cat-device px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm hover:opacity-80"
                      >
                        {d.device_name_ko}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
