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

  return clinicsWithCounts;
}

export default async function ClinicsPage() {
  const clinics = await getData();

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold mt-2">클리닉 / Clinics</h1>
          <p className="text-gray-400 mt-1">서울 {clinics.length}개 클리닉</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto py-8 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clinics.map((c) => (
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
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  🔬 {c.deviceCount} devices
                </span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  💉 {c.treatmentCount} treatments
                </span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  👨‍⚕️ {c.doctorCount} doctors
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
