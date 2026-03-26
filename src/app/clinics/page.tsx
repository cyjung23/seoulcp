import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/* ── 구 목록 (고정) ── */
const SEOUL_DISTRICTS = [
  "강남구", "서초구", "송파구", "마포구", "영등포구",
  "중구", "강서구", "강동구", "노원구", "양천구",
  "광진구", "성동구", "은평구", "용산구", "관악구",
  "동작구", "강북구", "구로구", "동대문구", "종로구",
  "서대문구", "성북구", "중랑구", "금천구", "도봉구",
];

/* ── 시술(1~17) / 수술(18~25) 구분 ── */
const TREATMENT_MAX_ORDER = 17;

async function getData(
  selectedDistricts: string[],
  selectedTreatments: string[],
  selectedSurgeries: string[]
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "public" }, global: { headers: {} } }
  );

  const selectedCategories = [...selectedTreatments, ...selectedSurgeries];
  const hasFilter =
    selectedDistricts.length > 0 || selectedCategories.length > 0;

  /* ── 구별 클리닉 수 ── */
  const { data: allClinicsForCount } = await supabase
    .from("clinics")
    .select("id, district_ko");

  const districtCounts: Record<string, number> = {};
  SEOUL_DISTRICTS.forEach((d) => (districtCounts[d] = 0));
  (allClinicsForCount || []).forEach((c: any) => {
    if (c.district_ko) {
      const d = c.district_ko.split(" ")[0];
      if (districtCounts[d] !== undefined) districtCounts[d]++;
    }
  });
  const totalCount = allClinicsForCount?.length || 0;

  /* ── 카테고리 목록 (시술 / 수술 분리) ── */
  const { data: standards } = await supabase
    .from("standard_treatments")
    .select("id, name_ko, category_ko, category_order")
    .order("category_order");

  const treatmentCategories: string[] = [];
  const surgeryCategories: string[] = [];
  const seenCat = new Set<string>();

  (standards || []).forEach((s: any) => {
    if (!seenCat.has(s.category_ko)) {
      seenCat.add(s.category_ko);
      if (s.category_order <= TREATMENT_MAX_ORDER) {
        treatmentCategories.push(s.category_ko);
      } else {
        surgeryCategories.push(s.category_ko);
      }
    }
  });

  /* ── 필터 없으면 여기서 리턴 ── */
  if (!hasFilter) {
    return {
      clinics: [],
      totalCount,
      districtCounts,
      treatmentCategories,
      surgeryCategories,
      hasFilter: false,
    };
  }

  /* ── 클리닉 로딩 ── */
  let clinicQuery = supabase.from("clinics").select("*").order("name_ko");

  if (selectedDistricts.length > 0) {
    const orFilter = selectedDistricts
      .map((d) => `district_ko.like.${d}%`)
      .join(",");
    clinicQuery = clinicQuery.or(orFilter);
  }

  const { data: clinics } = await clinicQuery;

  /* ── 카테고리 필터용 데이터 ── */
  let categoryMap: Record<string, number[]> = {};

  if (selectedCategories.length > 0) {
    const { data: allTreatments } = await supabase
      .from("treatments")
      .select("id, name_ko, standard_treatment_id")
      .limit(5000);

    const { data: ct1 } = await supabase
      .from("clinic_treatments")
      .select("clinic_id, treatment_id")
      .range(0, 999);
    const { data: ct2 } = await supabase
      .from("clinic_treatments")
      .select("clinic_id, treatment_id")
      .range(1000, 1999);
    const allClinicTreatments = [...(ct1 || []), ...(ct2 || [])];

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

    const catMap: Record<string, Set<number>> = {};
    (allClinicTreatments || []).forEach((ct: any) => {
      const stdId = treatmentToStdId[ct.treatment_id];
      if (stdId) {
        const cat = stdIdToCategory[stdId];
        if (cat) {
          if (!catMap[cat]) catMap[cat] = new Set();
          catMap[cat].add(ct.clinic_id);
        }
      }
    });

    categoryMap = Object.fromEntries(
      Object.entries(catMap).map(([k, v]) => [k, Array.from(v)])
    );
  }

  /* ── 시술 태그 데이터 ── */
  const clinicIds = (clinics || []).map((c: any) => c.id);

  const { data: clinicSpecs } = await supabase
    .from("clinic_specialties")
    .select("clinic_id, specialty_ko")
    .in("clinic_id", clinicIds.length > 0 ? clinicIds : [0]);

  const clinicSpecMap: Record<number, string[]> = {};
  (clinicSpecs || []).forEach((cs: any) => {
    if (!clinicSpecMap[cs.clinic_id]) clinicSpecMap[cs.clinic_id] = [];
    if (!clinicSpecMap[cs.clinic_id].includes(cs.specialty_ko)) {
      clinicSpecMap[cs.clinic_id].push(cs.specialty_ko);
    }
  });

  const { data: filteredCT } = await supabase
    .from("clinic_treatments")
    .select("clinic_id, treatment_id")
    .in("clinic_id", clinicIds.length > 0 ? clinicIds : [0]);

  const { data: treatmentsForNames } = await supabase
    .from("treatments")
    .select("id, name_ko")
    .limit(5000);

  const treatmentToName: Record<number, string> = {};
  (treatmentsForNames || []).forEach((t: any) => {
    treatmentToName[t.id] = t.name_ko;
  });

  const clinicTreatmentNames: Record<number, string[]> = {};
  (filteredCT || []).forEach((ct: any) => {
    const name = treatmentToName[ct.treatment_id];
    if (name) {
      if (!clinicTreatmentNames[ct.clinic_id])
        clinicTreatmentNames[ct.clinic_id] = [];
      if (!clinicTreatmentNames[ct.clinic_id].includes(name)) {
        clinicTreatmentNames[ct.clinic_id].push(name);
      }
    }
  });

  let clinicsWithInfo = (clinics || []).map((c: any) => ({
    ...c,
    specialties: clinicSpecMap[c.id] || [],
    treatmentNames: (clinicTreatmentNames[c.id] || []).sort(),
  }));

  /* ── 카테고리 필터 적용 ── */
  if (selectedCategories.length > 0) {
    const sets = selectedCategories
      .map((cat) => new Set(categoryMap[cat] || []))
      .filter((s) => s.size > 0);
    if (sets.length > 0) {
      clinicsWithInfo = clinicsWithInfo.filter((c: any) =>
        sets.every((s) => s.has(c.id))
      );
    }
  }

  return {
    clinics: clinicsWithInfo,
    totalCount,
    districtCounts,
    treatmentCategories,
    surgeryCategories,
    hasFilter: true,
  };
}

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{
    district?: string;
    treatment?: string;
    surgery?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedDistricts = params.district
    ? decodeURIComponent(params.district).split(",").filter(Boolean)
    : [];
  const selectedTreatments = params.treatment
    ? decodeURIComponent(params.treatment).split(",").filter(Boolean)
    : [];
  const selectedSurgeries = params.surgery
    ? decodeURIComponent(params.surgery).split(",").filter(Boolean)
    : [];

  const {
    clinics,
    totalCount,
    districtCounts,
    treatmentCategories,
    surgeryCategories,
    hasFilter,
  } = await getData(selectedDistricts, selectedTreatments, selectedSurgeries);

  function toggleUrl(
    key: "district" | "treatment" | "surgery",
    val: string,
    cur: string[]
  ) {
    const nl = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    const p = new URLSearchParams();
    const d = key === "district" ? nl : selectedDistricts;
    const t = key === "treatment" ? nl : selectedTreatments;
    const s = key === "surgery" ? nl : selectedSurgeries;
    if (d.length > 0) p.set("district", d.join(","));
    if (t.length > 0) p.set("treatment", t.join(","));
    if (s.length > 0) p.set("surgery", s.join(","));
    const qs = p.toString();
    return qs ? `/clinics?${qs}` : "/clinics";
  }

  const hasAnyFilter =
    selectedDistricts.length > 0 ||
    selectedTreatments.length > 0 ||
    selectedSurgeries.length > 0;

  const MAX_TAG_CHARS = 80;

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            클리닉 / Clinics
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            서울 미용클리닉 {totalCount.toLocaleString()}개
            {hasFilter && ` → ${clinics.length.toLocaleString()}개 검색됨`}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-5 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          {/* ── 1. 시술 카테고리 (최상단) ── */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2">
              💉 시술
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {treatmentCategories.map((cat) => (
                <Link
                  key={cat}
                  href={toggleUrl("treatment", cat, selectedTreatments)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                    selectedTreatments.includes(cat)
                      ? "bg-ui-secondary text-white border-ui-secondary"
                      : "bg-white text-gray-600 border-gray-300 hover:border-ui-secondary"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* ── 2. 수술 카테고리 ── */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2">
              🔪 수술
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {surgeryCategories.map((cat) => (
                <Link
                  key={cat}
                  href={toggleUrl("surgery", cat, selectedSurgeries)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                    selectedSurgeries.includes(cat)
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* ── 3. 지역 (하단) ── */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2">
              📍 지역
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SEOUL_DISTRICTS.map((d) => (
                <Link
                  key={d}
                  href={toggleUrl("district", d, selectedDistricts)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                    selectedDistricts.includes(d)
                      ? "bg-ui-primary text-white border-ui-primary"
                      : "bg-white text-gray-600 border-gray-300 hover:border-ui-primary"
                  }`}
                >
                  {d}
                  <span
                    className={`ml-1 ${
                      selectedDistricts.includes(d)
                        ? "text-blue-200"
                        : "text-gray-400"
                    }`}
                  >
                    {districtCounts[d]?.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 선택된 필터 태그 ── */}
          {hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t">
              <span className="text-xs text-gray-400 mr-1">선택됨:</span>
              {selectedTreatments.map((cat) => (
                <Link
                  key={`t-${cat}`}
                  href={toggleUrl("treatment", cat, selectedTreatments)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-teal-50 text-teal-700 rounded-full text-xs hover:bg-teal-100"
                >
                  💉 {cat} <span className="text-teal-400">✕</span>
                </Link>
              ))}
              {selectedSurgeries.map((cat) => (
                <Link
                  key={`s-${cat}`}
                  href={toggleUrl("surgery", cat, selectedSurgeries)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-purple-50 text-purple-700 rounded-full text-xs hover:bg-purple-100"
                >
                  🔪 {cat} <span className="text-purple-400">✕</span>
                </Link>
              ))}
              {selectedDistricts.map((d) => (
                <Link
                  key={`d-${d}`}
                  href={toggleUrl("district", d, selectedDistricts)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100"
                >
                  📍 {d} <span className="text-blue-400">✕</span>
                </Link>
              ))}
              <Link
                href="/clinics"
                className="text-xs sm:text-sm text-ui-primary hover:opacity-80 underline ml-2"
              >
                초기화
              </Link>
            </div>
          )}
        </div>

        {/* ── 결과 영역 ── */}
        {!hasFilter ? (
          <div className="text-center py-16 sm:py-24">
            <p className="text-4xl sm:text-5xl mb-4">🏥</p>
            <p className="text-gray-500 text-base sm:text-lg font-medium">
              검색 조건을 선택해주세요
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              시술, 수술, 또는 지역을 선택하면 클리닉이 표시됩니다
            </p>
          </div>
        ) : clinics.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            선택한 조건에 해당하는 클리닉이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {clinics.map((c: any) => {
              const greenTags: string[] = c.specialties;
              const blueTags: string[] = c.treatmentNames.filter(
                (name: string) => !greenTags.includes(name)
              );

              const allTags = [
                ...greenTags.map((t: string) => ({
                  text: t,
                  color: "primary",
                })),
                ...blueTags.map((t: string) => ({
                  text: t,
                  color: "accent",
                })),
              ];

              let charCount = 0;
              let visibleCount = 0;
              for (const tag of allTags) {
                charCount += tag.text.length;
                if (charCount > MAX_TAG_CHARS && visibleCount > 0) break;
                visibleCount++;
              }

              const visibleTags = allTags.slice(0, visibleCount);
              const remaining = allTags.length - visibleCount;

              return (
                <Link
                  key={c.id}
                  href={`/clinics/${c.id}`}
                  className="border rounded-xl px-4 sm:px-5 py-3 sm:py-4 hover:shadow-lg transition block min-h-40 sm:min-h-48 max-h-72 overflow-hidden"
                >
                  <h2 className="text-lg sm:text-xl font-bold">
                    {c.name_ko || c.name_en}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {c.name_en}
                  </p>
                  {c.district_ko && (
                    <p className="text-gray-400 text-xs mt-1">
                      📍 {c.district_ko}
                    </p>
                  )}
                  {c.phone && (
                    <p className="text-gray-400 text-xs">📞 {c.phone}</p>
                  )}

                  {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3">
                      {visibleTags.map((tag, i) => (
                        <span
                          key={i}
                          className={
                            tag.color === "primary"
                              ? "bg-blue-50 text-ui-primary px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                              : "bg-green-50 text-ui-accent px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                          }
                        >
                          {tag.text}
                        </span>
                      ))}
                      {remaining > 0 && (
                        <span className="bg-amber-100 text-amber-700 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium">
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
