import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: devices } = await supabase
    .from("devices")
    .select("*")
    .order("device_name_ko");

  const { data: relations } = await supabase
    .from("clinic_devices")
    .select("device_id");

  const countMap: Record<number, number> = {};
  (relations || []).forEach((r) => {
    countMap[r.device_id] = (countMap[r.device_id] || 0) + 1;
  });

  return (devices || []).map((d) => ({
    ...d,
    clinicCount: countMap[d.id] || 0,
  }));
}

export default async function DevicesPage() {
  const devices = await getData();
  const categories = [
    ...new Set(devices.map((d) => d.category_ko || "기타")),
  ].sort();

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">장비 / Devices</h1>
          <p className="text-gray-400 mt-1">{devices.length}개 장비</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        {categories.map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices
                .filter((d) => (d.category_ko || "기타") === cat)
                .map((d) => (
                  <Link
                    key={d.id}
                    href={`/devices/${encodeURIComponent(d.device_name_ko)}`}
                    className="border rounded-lg p-4 hover:shadow-md transition block"
                  >
                    <h3 className="font-bold text-lg">{d.device_name_ko}</h3>
                    <p className="text-gray-500 text-sm">{d.device_name_en}</p>
                    <p className="text-blue-600 font-semibold mt-2">
                      {d.clinicCount} clinic{d.clinicCount > 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
