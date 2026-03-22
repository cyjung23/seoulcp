import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

async function getData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const deviceName = decodeURIComponent(slug);

  const { data: device } = await supabase
    .from("devices")
    .select("*")
    .eq("device_name_ko", deviceName)
    .single();

  if (!device) return null;

  const { data: clinicRows } = await supabase
    .from("clinic_devices")
    .select("clinic_id, clinics(id, name_ko, name_en, address_ko, phone, district_ko)")
    .eq("device_id", device.id);

  return {
    device,
    clinics: (clinicRows || []).map((r: any) => r.clinics).filter(Boolean),
  };
}

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData(slug);

  if (!data) return notFound();

  const { device, clinics } = data;

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/devices" className="text-gray-400 hover:text-white text-sm">
            ← 장비 목록
          </Link>
          <h1 className="text-3xl font-bold mt-2">{device.device_name_ko}</h1>
          <p className="text-gray-400 mt-1">{device.device_name_en}</p>
          <div className="flex gap-4 mt-3">
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              {device.category_ko}
            </span>
            {device.manufacturer && (
              <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                {device.manufacturer}
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        <h2 className="text-xl font-bold mb-4">
          보유 클리닉 ({clinics.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((c: any) => (
            <Link
              key={c.id}
              href={`/clinics/${c.id}`}
              className="border rounded-lg p-4 hover:shadow-md transition block"
            >
              <h3 className="font-bold text-lg">{c.name_ko}</h3>
              <p className="text-gray-500 text-sm">{c.name_en}</p>
              {c.address_ko && (
                <p className="text-gray-600 text-sm mt-2">📍 {c.address_ko}</p>
              )}
              {c.phone && (
                <p className="text-gray-600 text-sm mt-1">📞 {c.phone}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
