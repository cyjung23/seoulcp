import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: clinics } = await supabase
    .from("clinics")
    .select("*")
    .order("name_ko");

  const { data: standards } = await supabase
    .from("standard_treatments")
    .select("id, category_ko, category_order")
    .order("category_order");

  const categorySet = new Map<string, number>();
  (standards || []).forEach((s) => {
    if (!categorySet.has(s.category_ko)) {
      categorySet.set(s.category_ko, s.category_order);
    }
  });
  const categoryNames = Array.from(categorySet.keys());

  const { data: allTreatments } = await supabase
    .from("treatments")
    .select("id, standard_treatment_id");

  const { data: allClinicTreatments } = await supabase
    .from("clinic_treatments")
    .select("clinic_id, treatment_id");

  const treatmentToStdId: Record<number, string> = {};
  (allTreatments || []).forEach((t: any) => {
    if (t.standard_treatment_id) {
      treatmentToStdId[t.id] = t.standard_treatment_id;
    }
  });

  const stdIdToCategory: Record<string, string> = {};
  (standards || []).forEach((s: any) => {
    stdIdToCategory[s.id] = s.category_ko;
  });

  const categoryMap: Record<string, Set<number>> = {};
  (allClinicTreatments || []).forEach((ct: any) => {
    const stdId = treatmentToStdId[ct.treatment_id];
    if (stdId) {
      const cat = stdIdToCategory[stdId];
      if (cat) {
        if (!categoryMap[cat]) categoryMap[cat] = new Set();
        categoryMap[cat].add(ct.clinic_id);
      }
    }
  });

  // 카테고리별 보유 클리닉 수 (희소성 계산)
  const categoryClinicCount: Record<string, number> = {};
  Object.entries(categoryMap).forEach(([cat, clinicSet]) => {
    categoryClinicCount[cat] = clinicSet.size;
  });

  // clinic_specialties 조회
  const { data: clinicSpecs } = await supabase
    .from("clinic_specialties")
    .select("clinic_id, specialty_ko");

  const clinicSpecMap: Record<number, string[]> = {};
  (clinicSpecs || []).forEach((cs: any) => {
    if (!clinicSpecMap[cs.clinic_id]) clinicSpecMap[cs.clinic_id] = [];
    if (!clinicSpecMap[cs.clinic_id].includes(cs.specialty_ko)) {
      clinicSpecMap[cs.clinic_id].push(cs.specialty_ko);
    }
  });

  // 희소성 기반 정렬: 보유 클리닉 적은 순 → 앞에 배치
  Object.keys(clinicSpecMap).forEach((cid) => {
    clinicSpecMap[Number(cid)].sort((a, b) => {
      const countA = categoryClinicCount[a] || 999;
      const countB = categoryClinicCount[b] || 999;
      return countA - countB;
    });
  });

  const clinicsWithInfo = (clinics || []).map((c) => ({
    ...c,
    specialties: clinicSpecMap[c.id] || [],
  }));

  const districtSet = new Set<string>();
  (clinics || []).forEach((c) => {
    if (c.district_ko) districtSet.add(c.district_ko.split(" ")[0]);
  });

  return {
    clinics: clinicsWithInfo,
    districts: Array.from(districtSet).sort(),
    categoryNames,
    categoryMap: Object.fromEntries(
      Object.entries(categoryMap).map(([k, v]) => [k, Array.from(v)])
    ),
  };
}

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; category?: string }>;
}) {
  const params = await searchParams;
  const { clinics, districts, categoryNames, categoryMap } = await getData();

  const selectedDistricts = params.district
    ? decodeURIComponent(params.district).split(",").filter(Boolean)
    : [];
  const selectedCategories = params.category
    ? decodeURIComponent(params.category).split(",").filter(Boolean)
    : [];

  let filtered = clinics;

  if (selectedDistricts.length > 0) {
    filtered = filtered.filter((c) =>
      c.district_ko && selectedDistricts.some((d) => c.district_ko.startsWith(d))
    );
  }

  if (selectedCategories.length > 0) {
    const sets = selectedCategories
      .map((cat) => new Set(categoryMap[cat] || []))
      .filter((s) => s.size > 0);
    if (sets.length > 0)
      filtered = filtered.filter((c) => sets.every((s) => s.has(c.id)));
  }

  function toggleUrl(key: string, val: string, cur: string[]) {
    const nl = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    const p = new URLSearchParams();
    const d = key === "district" ? nl : selectedDistricts;
    const ca = key === "category" ? nl : selectedCategories;
    if (d.length > 0) p.set("district", d.join(","));
    if (ca.length > 0) p.set("category", ca.join(","));
    const qs = p.toString();
    return qs ? `/clinics?${qs}` : "/clinics";
  }

  function clearUrl(key: string) {
    const p = new URLSearchParams();
    const d = key === "district" ? [] : selectedDistricts;
    const ca = key === "category" ? [] : selectedCategories;
    if (d.length > 0) p.set("district", d.join(","));
    if (ca.length > 0) p.set("category", ca.join(","));
    const qs = p.toString();
    return qs ? `/clinics?${qs}` : "/clinics";
  }

  const hasFilter = selectedDistricts.length > 0 || selectedCategories.length > 0;

  // 글자수 기준으로 표시할 태그 수 결정
  function getVisibleTags(specs: string[]) {
    const maxChars = 30;
    let totalChars = 0;
    let count = 0;
    for (const s of specs) {
      totalChars += s.length;
      if (totalChars > maxChars && count > 0) break;
      count++;
    }
    return count;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">클리닉 / Clinics</h1>
          <p className="text-gray-400 mt-1">
            서울 {filtered.length}개 클리닉
            {hasFilter && ` (전체 ${clinics.length}개 중)`}
          </p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        <div className="mb-8 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-2">📍 지역</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={clearUrl("district")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedDistricts.length === 0
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                전체
              </Link>
              {districts.map((d) => (
                <Link
                  key={d}
                  href={toggleUrl("district", d, selectedDistricts)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    selectedDistricts.includes(d)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-2">💉 시술 카테고리</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={clearUrl("category")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedCategories.length === 0
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                전체
              </Link>
              {categoryNames.map((cat) => (
                <Link
                  key={cat}
                  href={toggleUrl("category", cat, selectedCategories)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    selectedCategories.includes(cat)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {hasFilter && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {selectedDistricts.map((d) => (
                <Link
                  key={`d-${d}`}
                  href={toggleUrl("district", d, selectedDistricts)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200"
                >
                  📍 {d} <span className="text-gray-400">✕</span>
                </Link>
              ))}
              {selectedCategories.map((cat) => (
                <Link
                  key={`c-${cat}`}
                  href={toggleUrl("category", cat, selectedCategories)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200"
                >
                  💉 {cat} <span className="text-gray-400">✕</span>
                </Link>
              ))}
              <Link
                href="/clinics"
                className="text-sm text-red-500 hover:text-red-700 underline ml-2"
              >
                모든 필터 초기화
              </Link>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            선택한 조건에 해당하는 클리닉이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((c) => {
              const visibleCount = getVisibleTags(c.specialties);
              const visible = c.specialties.slice(0, visibleCount);
              const remaining = c.specialties.length - visibleCount;

              return (
                <Link
                  key={c.id}
                  href={`/clinics/${c.id}`}
                  className="border rounded-xl p-6 hover:shadow-lg transition block"
                >
                  <h2 className="text-xl font-bold">
                    {c.name_ko || c.name_en}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{c.name_en}</p>

                  {c.address_ko && (
                    <p className="text-gray-600 text-sm mt-3">
                      📍 {c.address_ko}
                    </p>
                  )}
                  {c.phone && (
                    <p className="text-gray-600 text-sm mt-1">📞 {c.phone}</p>
                  )}

                  {/* 병원 specialties 초록색 태그 */}
                  {c.specialties.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {visible.map((spec: string, i: number) => (
                        <span
                          key={i}
                          className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                      {remaining > 0 && (
                        <span className="text-gray-400 text-xs">
                          +{remaining}개
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
