"use client";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useMemo, useCallback } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SEOUL_DISTRICTS = [
  "강남구", "서초구", "송파구", "마포구", "영등포구",
  "중구", "강서구", "강동구", "성원구", "양천구",
  "관악구", "성동구", "동작구", "용산구", "광진구",
  "동대문구", "강북구", "구로구", "도봉구", "종로구",
  "서대문구", "중랑구", "금천구", "은평구", "노원구",
];

const MAX_TAG_CHARS = 80;

/* ── 타입 ── */
interface Clinic {
  id: number;
  name_ko: string;
  name_en: string;
  district_ko: string;
  phone: string;
  specialties: string[];
  treatmentNames: string[];
}

export default function ClinicsPage() {
  // ── 상태 ──
  const [totalCount, setTotalCount] = useState<number>(0);
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});
  const [treatmentCategories, setTreatmentCategories] = useState<string[]>([]);
  const [surgeryCategories, setSurgeryCategories] = useState<string[]>([]);

  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedSurgeries, setSelectedSurgeries] = useState<string[]>([]);

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);

  // ── 카테고리 매핑 (한번만 로드) ──
  const [categoryClinicMap, setCategoryClinicMap] = useState<Record<string, number[]>>({});

  // ── 초기 로딩: 총 수, 구별 수, 카테고리 목록 ──
  useEffect(() => {
    async function loadInit() {
      const { count } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true });
      setTotalCount(count ?? 0);

      const allDistricts: { district_ko: string }[] = [];
      let from = 0;
      while (true) {
        const { data } = await supabase
          .from("clinics")
          .select("district_ko")
          .range(from, from + 999);
        if (!data || data.length === 0) break;
        allDistricts.push(...data);
        if (data.length < 1000) break;
        from += 1000;
      }
      const dc: Record<string, number> = {};
      SEOUL_DISTRICTS.forEach((d) => (dc[d] = 0));
      allDistricts.forEach((c) => {
        if (c.district_ko) {
          const d = c.district_ko.split(" ")[0];
          if (dc[d] !== undefined) dc[d]++;
        }
      });
      setDistrictCounts(dc);

      const { data: standards } = await supabase
        .from("standard_treatments")
        .select("id, name_ko, category_ko, category_order")
        .order("category_order");

      const tCats: string[] = [];
      const sCats: string[] = [];
      const seen = new Set<string>();
      (standards || []).forEach((s: any) => {
        if (s.category_ko && !seen.has(s.category_ko)) {
          seen.add(s.category_ko);
          if (s.category_order < 200) tCats.push(s.category_ko);
          else sCats.push(s.category_ko);
        }
      });
      setTreatmentCategories(tCats);
      setSurgeryCategories(sCats);

      const { data: allTreatments } = await supabase
        .from("treatments")
        .select("id, standard_treatment_id")
        .limit(5000);

      const ct: any[] = [];
      let ctFrom = 0;
      while (true) {
        const { data } = await supabase
          .from("clinic_treatments")
          .select("clinic_id, treatment_id")
          .range(ctFrom, ctFrom + 999);
        if (!data || data.length === 0) break;
        ct.push(...data);
        if (data.length < 1000) break;
        ctFrom += 1000;
      }

      const treatmentToStdId: Record<number, string> = {};
      (allTreatments || []).forEach((t: any) => {
        if (t.standard_treatment_id) treatmentToStdId[t.id] = t.standard_treatment_id;
      });

      const stdIdToCategory: Record<string, string> = {};
      (standards || []).forEach((s: any) => {
        stdIdToCategory[s.id] = s.category_ko;
      });

      const catMap: Record<string, Set<number>> = {};
      ct.forEach((row: any) => {
        const stdId = treatmentToStdId[row.treatment_id];
        if (stdId) {
          const cat = stdIdToCategory[stdId];
          if (cat) {
            if (!catMap[cat]) catMap[cat] = new Set();
            catMap[cat].add(row.clinic_id);
          }
        }
      });

      const catClinicMap: Record<string, number[]> = {};
      Object.entries(catMap).forEach(([k, v]) => {
        catClinicMap[k] = Array.from(v);
      });
      setCategoryClinicMap(catClinicMap);

      setInitLoaded(true);
    }
    loadInit();
  }, []);

  const hasAnyFilter =
    selectedDistricts.length > 0 ||
    selectedTreatments.length > 0 ||
    selectedSurgeries.length > 0;

  useEffect(() => {
    if (!initLoaded) return;
    if (!hasAnyFilter) {
      setClinics([]);
      return;
    }

    async function fetchClinics() {
      setLoading(true);

      let allResults: any[] = [];
      let from = 0;

      if (selectedDistricts.length > 0) {
        const orFilter = selectedDistricts.map((d) => `district_ko.like.${d}%`).join(",");
        while (true) {
          const { data } = await supabase
            .from("clinics")
            .select("id, name_ko, name_en, district_ko, phone")
            .or(orFilter)
            .order("name_ko")
            .range(from, from + 999);
          if (!data || data.length === 0) break;
          allResults.push(...data);
          if (data.length < 1000) break;
          from += 1000;
        }
      } else {
        while (true) {
          const { data } = await supabase
            .from("clinics")
            .select("id, name_ko, name_en, district_ko, phone")
            .order("name_ko")
            .range(from, from + 999);
          if (!data || data.length === 0) break;
          allResults.push(...data);
          if (data.length < 1000) break;
          from += 1000;
        }
      }

      const selectedCats = [...selectedTreatments, ...selectedSurgeries];
      if (selectedCats.length > 0) {
        const sets = selectedCats
          .map((cat) => new Set(categoryClinicMap[cat] || []))
          .filter((s) => s.size > 0);
        if (sets.length > 0) {
          allResults = allResults.filter((c) => sets.every((s) => s.has(c.id)));
        } else {
          allResults = [];
        }
      }

      const clinicIds = allResults.map((c) => c.id);

      let specialtiesData: any[] = [];
      let treatmentsData: any[] = [];

      if (clinicIds.length > 0) {
        const batchSize = 200;
        for (let i = 0; i < clinicIds.length; i += batchSize) {
          const batch = clinicIds.slice(i, i + batchSize);

          const [specRes, ctRes] = await Promise.all([
            supabase.from("clinic_specialties").select("clinic_id, specialty_ko").in("clinic_id", batch),
            supabase.from("clinic_treatments").select("clinic_id, treatment_id").in("clinic_id", batch),
          ]);
          if (specRes.data) specialtiesData.push(...specRes.data);
          if (ctRes.data) treatmentsData.push(...ctRes.data);
        }
      }

      const treatmentIds = [...new Set(treatmentsData.map((t: any) => t.treatment_id))];
      const treatmentNameMap: Record<number, string> = {};
      if (treatmentIds.length > 0) {
        for (let i = 0; i < treatmentIds.length; i += 200) {
          const batch = treatmentIds.slice(i, i + 200);
          const { data } = await supabase.from("treatments").select("id, name_ko").in("id", batch);
          (data || []).forEach((t: any) => { treatmentNameMap[t.id] = t.name_ko; });
        }
      }

      const specMap: Record<number, string[]> = {};
      specialtiesData.forEach((s: any) => {
        if (!specMap[s.clinic_id]) specMap[s.clinic_id] = [];
        if (!specMap[s.clinic_id].includes(s.specialty_ko)) specMap[s.clinic_id].push(s.specialty_ko);
      });

      const treatMap: Record<number, string[]> = {};
      treatmentsData.forEach((ct: any) => {
        const name = treatmentNameMap[ct.treatment_id];
        if (name) {
          if (!treatMap[ct.clinic_id]) treatMap[ct.clinic_id] = [];
          if (!treatMap[ct.clinic_id].includes(name)) treatMap[ct.clinic_id].push(name);
        }
      });

      const enriched: Clinic[] = allResults.map((c) => ({
        ...c,
        specialties: specMap[c.id] || [],
        treatmentNames: (treatMap[c.id] || []).sort(),
      }));

      setClinics(enriched);
      setLoading(false);
    }

    fetchClinics();
  }, [initLoaded, selectedDistricts, selectedTreatments, selectedSurgeries, categoryClinicMap, hasAnyFilter]);

  const toggleDistrict = useCallback((d: string) => {
    setSelectedDistricts((prev) => prev.includes(d) ? prev.filter((v) => v !== d) : [...prev, d]);
  }, []);
  const toggleTreatment = useCallback((cat: string) => {
    setSelectedTreatments((prev) => prev.includes(cat) ? prev.filter((v) => v !== cat) : [...prev, cat]);
  }, []);
  const toggleSurgery = useCallback((cat: string) => {
    setSelectedSurgeries((prev) => prev.includes(cat) ? prev.filter((v) => v !== cat) : [...prev, cat]);
  }, []);
  const clearAll = useCallback(() => {
    setSelectedDistricts([]);
    setSelectedTreatments([]);
    setSelectedSurgeries([]);
  }, []);

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
            서울 미용클리닉 {(totalCount ?? 0).toLocaleString()}개
            {hasAnyFilter && !loading && ` → ${clinics.length.toLocaleString()}개 검색됨`}
            {loading && " → 검색 중..."}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto py-5 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          {/* 1. 시술 카테고리 */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2">🔹 시술</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {treatmentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleTreatment(cat)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                    selectedTreatments.includes(cat)
                      ? "bg-cat-treat text-white border-cat-treat"
                      : "bg-white text-gray-600 border-gray-300 hover:border-cat-treat"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 수술 카테고리 */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2">🔸 수술</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {surgeryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleSurgery(cat)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                    selectedSurgeries.includes(cat)
                      ? "bg-cat-surgery text-white border-cat-surgery"
                      : "bg-white text-gray-600 border-gray-300 hover:border-cat-surgery"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 지역 */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2">📍 지역</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SEOUL_DISTRICTS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDistrict(d)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
                    selectedDistricts.includes(d)
                      ? "bg-cat-clinic text-white border-cat-clinic"
                      : "bg-white text-gray-600 border-gray-300 hover:border-cat-clinic"
                  }`}
                >
                  {d}
                  <span className={`ml-1 ${selectedDistricts.includes(d) ? "text-green-200" : "text-gray-400"}`}>
                    {districtCounts[d]?.toLocaleString() ?? ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 선택된 필터 태그 */}
          {hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t">
              <span className="text-xs text-gray-400 mr-1">선택됨</span>
              {selectedTreatments.map((cat) => (
                <button
                  key={`t-${cat}`}
                  onClick={() => toggleTreatment(cat)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-tag-treat-bg text-cat-treat rounded-full text-xs hover:opacity-80"
                >
                  🔹 {cat} <span className="opacity-50">✕</span>
                </button>
              ))}
              {selectedSurgeries.map((cat) => (
                <button
                  key={`s-${cat}`}
                  onClick={() => toggleSurgery(cat)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-tag-surgery-bg text-cat-surgery rounded-full text-xs hover:opacity-80"
                >
                  🔸 {cat} <span className="opacity-50">✕</span>
                </button>
              ))}
              {selectedDistricts.map((d) => (
                <button
                  key={`d-${d}`}
                  onClick={() => toggleDistrict(d)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-tag-clinic-bg text-cat-clinic rounded-full text-xs hover:opacity-80"
                >
                  📍 {d} <span className="opacity-50">✕</span>
                </button>
              ))}
              <button onClick={clearAll} className="text-xs sm:text-sm text-cat-concern hover:opacity-80 underline ml-2">
                초기화
              </button>
            </div>
          )}
        </div>

        {/* 결과 영역 */}
        {!hasAnyFilter ? (
          <div className="text-center py-16 sm:py-24">
            <p className="text-4xl sm:text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-base sm:text-lg font-medium">
              검색 조건을 선택해주세요
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              시술, 수술, 또는 지역을 선택하면 클리닉이 표시됩니다
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-16 sm:py-24">
            <div className="inline-block w-8 h-8 border-4 border-cat-concern border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-base">검색 중...</p>
          </div>
        ) : clinics.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            선택한 조건에 해당하는 클리닉이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {clinics.map((c) => {
              const greenTags = c.specialties;
              const blueTags = c.treatmentNames.filter((name) => !greenTags.includes(name));

              const allTags = [
                ...greenTags.map((t) => ({ text: t, color: "specialty" })),
                ...blueTags.map((t) => ({ text: t, color: "treatment" })),
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
                  <h2 className="text-lg sm:text-xl font-bold">{c.name_ko || c.name_en}</h2>
                  <p className="text-gray-500 text-xs sm:text-sm">{c.name_en}</p>
                  {c.district_ko && (
                    <p className="text-gray-400 text-xs mt-1">📍 {c.district_ko}</p>
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
                            tag.color === "specialty"
                              ? "bg-tag-device-bg text-cat-device px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                              : "bg-tag-treat-bg text-cat-treat px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
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
