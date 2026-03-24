import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

/* ────────────────────────────────────────────
   데이터 로드
   ──────────────────────────────────────────── */
async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: clinics } = await supabase
    .from("clinics")
    .select("*")
    .order("name_ko");

  // 시술 카테고리 (필터용)
  const { data: allClinicTreatments } = await supabase
    .from("clinic_treatments")
    .select("clinic_id, treatment_id, treatments(category_ko)");

  // 클리닉별 카운트
  const clinicsWithCounts = await Promise.all(
    (clinics || []).map(async (c) => {
      const [devices, treatments, doctors] = await Promise.all([
        supabase
          .from("clinic_devices")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", c.id),
        supabase
          .from("clinic_treatments")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", c.id),
        supabase
          .from("doctors")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", c.id),
      ]);
      return {
        ...c,
        deviceCount: devices.count || 0,
        treatmentCount: treatments.count || 0,
        doctorCount: doctors.count || 0,
      };
    })
  );

  // 지역구 목록 추출 (구 단위로 통일)
  const districtSet = new Set<string>();
  (clinics || []).forEach((c) => {
    if (c.district_ko) {
      const gu = c.district_ko.split(" ")[0];
      districtSet.add(gu);
    }
  });
  const districts = Array.from(districtSet).sort();

  // 시술 카테고리 목록 추출 + 클리닉 매핑
  const categoryMap: Record<string, Set<string>> = {};
  const categoryNames = new Set<string>();
  (allClinicTreatments || []).forEach((ct: any) => {
    const cat = ct.treatments?.category_ko;
    if (cat) {
      categoryNames.add(cat);
      if (!categoryMap[cat]) categoryMap[cat] = new Set();
      categoryMap[cat].add(ct.clinic_id);
    }
  });

  return {
    clinics: clinicsWithCounts,
    districts,
    categoryNames: Array.from(categoryNames).sort(),
    categoryMap: Object.fromEntries(
      Object.entries(categoryMap).map(([k, v]) => [k, Array.from(v)])
    ),
  };
}

/* ────────────────────────────────────────────
   페이지 렌더링
   ──────────────────────────────────────────── */
export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; category?: string }>;
}) {
  const params = await searchParams;
  const { clinics, districts, categoryNames, categoryMap } = await getData();

  // 쉼표 구분 다중 선택 파싱
  const selectedDistricts = params.district
    ? decodeURIComponent(params.district).split(",").filter(Boolean)
    : [];
  const selectedCategories = params.category
    ? decodeURIComponent(params.category).split(",").filter(Boolean)
    : [];

  // 필터 적용
  let filtered = clinics;

  // 지역 필터: OR 방식 (강남구 또는 서초구)
  if (selectedDistricts.length > 0) {
    filtered = filtered.filter(
      (c) =>
        c.district_ko &&
        selectedDistricts.some((d) => c.district_ko.startsWith(d))
    );
  }

  // 시술 카테고리 필터: AND 방식 (리프팅도 하고 보톡스도 하는 클리닉)
  if (selectedCategories.length > 0) {
    const clinicIdSets = selectedCategories
      .map((cat) => new Set(categoryMap[cat] || []))
      .filter((s) => s.size > 0);
    if (clinicIdSets.length > 0) {
      filtered = filtered.filter((c) =>
        clinicIdSets.every((s) => s.has(c.id))
      );
    }
  }

  // 다중 선택 토글 URL 생성 함수
  function buildToggleUrl(key: string, value: string, currentList: string[]) {
    const newList = currentList.includes(value)
      ? currentList.filter((v) => v !== value)
      : [...currentList, value];

    const p = new URLSearchParams();
    const all = {
      district: key === "district" ? newList : selectedDistricts,
      category: key === "category" ? newList : selectedCategories,
    };
    if (all.district.length > 0) p.set("district", all.district.join(","));
    if (all.category.length > 0) p.set("category", all.category.join(","));
    const qs = p.toString();
    return qs ? `/clinics?${qs}` : "/clinics";
  }

  // 특정 필터 전체 해제 URL
  function buildClearUrl(key: string) {
    const p = new URLSearchParams();
    const all = {
      district: key === "district" ? [] : selectedDistricts,
      category: key === "category" ? [] : selectedCategories,
    };
    if (all.district.length > 0) p.set("district", all.district.join(","));
    if (all.category.length > 0) p.set("category", all.category.join(","));
    const qs = p.toString();
    return qs ? `/clinics?${qs}` : "/clinics";
  }

  const hasAnyFilter = selectedDistricts.length > 0 || selectedCategories.length > 0;

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
            {hasAnyFilter && ` (전체 ${clinics.length}개 중)`}
          </p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        {/* ── 필터 영역 ── */}
        <div className="mb-8 space-y-4">

          {/* 지역 필터 (다중 선택, OR) */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-2">📍 지역</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildClearUrl("district")}
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
                  href={buildToggleUrl("district", d, selectedDistricts)}
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

          {/* 시술 카테고리 필터 (다중 선택, AND) */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-2">💉 시술 카테고리</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildClearUrl("category")}
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
                  href={buildToggleUrl("category", cat, selectedCategories)}
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

          {/* 선택된 필터 요약 + 초기화 */}
          {hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {selectedDistricts.map((d) => (
                <Link
                  key={`sel-d-${d}`}
                  href={buildToggleUrl("district", d, selectedDistricts)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition"
                >
                  📍 {d} <span className="text-gray-400">✕</span>
                </Link>
              ))}
              {selectedCategories.map((cat) => (
                <Link
                  key={`sel-c-${cat}`}
                  href={buildToggleUrl("category", cat, selectedCategories)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition"
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

        {/* ── 클리닉 목록 ── */}
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            선택한 조건에 해당하는 클리닉이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((c) => (
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

                <div className="flex gap-4 mt-4">
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    💉 {c.treatmentCount} treatments
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    🔬 {c.deviceCount} devices
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    👨‍⚕️ {c.doctorCount} doctors
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
