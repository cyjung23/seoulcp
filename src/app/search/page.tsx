import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../components/SearchBar";

/* ────────────────────────────────────────────
   Supabase 통합 검색
   ──────────────────────────────────────────── */
async function searchAll(query: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const pattern = `%${query}%`;

  const [concerns, treatments, devices, clinics] = await Promise.all([
    supabase
      .from("concerns")
      .select("id, name_ko, name_en, concern_group_ko")
      .or(`name_ko.ilike.${pattern},name_en.ilike.${pattern}`)
      .order("name_ko")
      .limit(20),
    supabase
      .from("treatments")
      .select("id, name_ko, name_en, category_ko")
      .or(`name_ko.ilike.${pattern},name_en.ilike.${pattern}`)
      .order("name_ko")
      .limit(20),
    supabase
      .from("devices")
      .select("id, device_name_ko, device_name_en, category_ko, manufacturer")
      .or(
        `device_name_ko.ilike.${pattern},device_name_en.ilike.${pattern},manufacturer.ilike.${pattern}`
      )
      .order("device_name_ko")
      .limit(20),
    supabase
      .from("clinics")
      .select("id, name_ko, name_en, address_ko, district_ko")
      .or(
        `name_ko.ilike.${pattern},name_en.ilike.${pattern},address_ko.ilike.${pattern},district_ko.ilike.${pattern}`
      )
      .order("name_ko")
      .limit(20),
  ]);

  return {
    concerns: concerns.data || [],
    treatments: treatments.data || [],
    devices: devices.data || [],
    clinics: clinics.data || [],
  };
}

/* ────────────────────────────────────────────
   결과 섹션 컴포넌트
   ──────────────────────────────────────────── */
function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 border-b pb-2">
      <span className="text-xl">{icon}</span>
      <h2 className="text-xl font-bold">{title}</h2>
      <span className="text-sm text-gray-400 ml-auto">{count}건</span>
    </div>
  );
}

/* ────────────────────────────────────────────
   검색어 하이라이트
   ──────────────────────────────────────────── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!text || !query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ────────────────────────────────────────────
   페이지 렌더링
   ──────────────────────────────────────────── */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ? decodeURIComponent(q).trim() : "";

  if (!query) {
    return (
      <div className="min-h-screen">
        <header className="bg-gray-900 text-white py-14 px-6 text-center">
          <h1 className="text-3xl font-bold">통합 검색</h1>
          <p className="text-gray-400 mt-2">검색어를 입력해주세요</p>
          <div className="mt-6">
            <SearchBar />
          </div>
        </header>
      </div>
    );
  }

  const results = await searchAll(query);
  const totalCount =
    results.concerns.length +
    results.treatments.length +
    results.devices.length +
    results.clinics.length;

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-3">
            &ldquo;{query}&rdquo; 검색 결과
          </h1>
          <p className="text-gray-400 mt-1">총 {totalCount}건</p>
          <div className="mt-5">
            <SearchBar initialQuery={query} />
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto py-8 px-6">
        {totalCount === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg">
              &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              다른 검색어를 시도해 보세요.
            </p>
          </div>
        )}

        {/* 고민 결과 */}
        {results.concerns.length > 0 && (
          <div className="mb-10">
            <SectionHeader
              icon="🔍"
              title="고민"
              count={results.concerns.length}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.concerns.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/concerns/${encodeURIComponent(c.name_ko)}`}
                  className="border rounded-lg p-4 hover:shadow-md transition block"
                >
                  <h3 className="font-bold text-lg">
                    <Highlight text={c.name_ko} query={query} />
                  </h3>
                  <p className="text-gray-500 text-sm">
                    <Highlight text={c.name_en} query={query} />
                  </p>
                  {c.concern_group_ko && (
                    <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs mt-2">
                      {c.concern_group_ko}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 시술 결과 */}
        {results.treatments.length > 0 && (
          <div className="mb-10">
            <SectionHeader
              icon="💉"
              title="시술"
              count={results.treatments.length}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.treatments.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/treatments/${encodeURIComponent(t.name_ko)}`}
                  className="border rounded-lg p-4 hover:shadow-md transition block"
                >
                  <h3 className="font-bold text-lg">
                    <Highlight text={t.name_ko} query={query} />
                  </h3>
                  <p className="text-gray-500 text-sm">
                    <Highlight text={t.name_en} query={query} />
                  </p>
                  {t.category_ko && (
                    <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs mt-2">
                      {t.category_ko}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 장비 결과 */}
        {results.devices.length > 0 && (
          <div className="mb-10">
            <SectionHeader
              icon="🔬"
              title="장비"
              count={results.devices.length}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.devices.map((d: any) => (
                <Link
                  key={d.id}
                  href={`/devices/${encodeURIComponent(d.device_name_ko)}`}
                  className="border rounded-lg p-4 hover:shadow-md transition block"
                >
                  <h3 className="font-bold text-lg">
                    <Highlight text={d.device_name_ko} query={query} />
                  </h3>
                  <p className="text-gray-500 text-sm">
                    <Highlight text={d.device_name_en} query={query} />
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {d.category_ko && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                        {d.category_ko}
                      </span>
                    )}
                    {d.manufacturer && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        <Highlight text={d.manufacturer} query={query} />
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 클리닉 결과 */}
        {results.clinics.length > 0 && (
          <div className="mb-10">
            <SectionHeader
              icon="🏥"
              title="클리닉"
              count={results.clinics.length}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.clinics.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/clinics/${c.id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition block"
                >
                  <h3 className="font-bold text-lg">
                    <Highlight text={c.name_ko} query={query} />
                  </h3>
                  <p className="text-gray-500 text-sm">
                    <Highlight text={c.name_en || ""} query={query} />
                  </p>
                  {c.address_ko && (
                    <p className="text-gray-600 text-sm mt-2">
                      📍 <Highlight text={c.address_ko} query={query} />
                    </p>
                  )}
                  {c.district_ko && (
                    <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs mt-2">
                      {c.district_ko}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}