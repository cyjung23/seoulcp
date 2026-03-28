import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

export const dynamic = "force-dynamic";

const categoryLabel: Record<string, string> = {
  treatment: "시술",
  surgery: "수술",
  device: "장비",
};

const categoryColor: Record<string, string> = {
  treatment: "text-cat-treat",
  surgery: "text-cat-surgery",
  device: "text-cat-device",
};

async function getData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: entry } = await supabase
    .from("encyclopedia")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!entry) return null;

  // 관련 시술 조회
  let relatedTreatments: { id: number; name_ko: string; name_en: string }[] = [];
  if (entry.related_treatment_ids && entry.related_treatment_ids.length > 0) {
    const { data } = await supabase
      .from("standard_treatments")
      .select("id, name_ko, name_en")
      .in("id", entry.related_treatment_ids);
    if (data) relatedTreatments = data;
  }

  // 관련 장비 조회
  let relatedDevices: { id: number; device_name_ko: string; device_name_en: string }[] = [];
  if (entry.related_device_ids && entry.related_device_ids.length > 0) {
    const { data } = await supabase
      .from("devices")
      .select("id, device_name_ko, device_name_en")
      .in("id", entry.related_device_ids);
    if (data) relatedDevices = data;
  }

  return { entry, relatedTreatments, relatedDevices };
}

function Section({ title, content }: { title: string; content: string | null }) {
  if (!content || content.trim() === "") return null;
  return (
    <div className="border-b pb-4 mb-4">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="text-gray-700 whitespace-pre-line">{content}</p>
    </div>
  );
}

export default async function WikiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData(slug);

  if (!data) return notFound();

  const { entry, relatedTreatments, relatedDevices } = data;

  return (
    <div className="min-h-screen">
      <header className="bg-base-dark text-white py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/wiki" className="text-gray-400 hover:text-white text-sm">
            ← 미용백과
          </Link>
          <h1 className="text-2xl font-bold mt-1">{entry.title_ko}</h1>
          <div className="flex items-center gap-3 mt-1">
            {entry.title_en && (
              <span className="text-gray-400 text-sm">{entry.title_en}</span>
            )}
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full bg-gray-700 ${categoryColor[entry.category]}`}
            >
              {categoryLabel[entry.category] ?? entry.category}
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-6 px-6">
        {entry.summary && (
          <p className="text-gray-600 text-base mb-6 bg-gray-50 p-4 rounded-lg">
            {entry.summary}
          </p>
        )}

        <Section title="개요" content={entry.overview} />
        <Section title="원리 / 메커니즘" content={entry.mechanism} />
        <Section title="효과" content={entry.effects} />
        <Section title="시술 시간" content={entry.duration} />
        <Section title="회복 기간" content={entry.recovery} />
        <Section title="부작용" content={entry.side_effects} />
        <Section title="가격 범위" content={entry.price_range} />
        <Section title="적합 대상" content={entry.target_audience} />

        {/* 마크다운 콘텐츠 */}
        {entry.content_md && entry.content_md.trim() !== "" && (
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-bold mb-2">상세 정보</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{entry.content_md}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* 관련 시술 */}
        {relatedTreatments.length > 0 && (
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-bold mb-2">관련 시술</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTreatments.map((t) => (
                <Link
                  key={t.id}
                  href={`/treatments/${encodeURIComponent(t.name_ko)}`}
                  className="inline-block bg-tag-treat-bg text-cat-treat text-sm px-3 py-1 rounded-full hover:opacity-80 transition"
                >
                  {t.name_ko}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 관련 장비 */}
        {relatedDevices.length > 0 && (
          <div className="pb-4 mb-4">
            <h2 className="text-lg font-bold mb-2">관련 장비</h2>
            <div className="flex flex-wrap gap-2">
              {relatedDevices.map((d) => (
                <Link
                  key={d.id}
                  href={`/devices/${encodeURIComponent(d.device_name_ko)}`}
                  className="inline-block bg-tag-device-bg text-cat-device text-sm px-3 py-1 rounded-full hover:opacity-80 transition"
                >
                  {d.device_name_ko}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
