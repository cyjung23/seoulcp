import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [clinics, devices, treatments, concerns] = await Promise.all([
    supabase.from("clinics").select("*", { count: "exact", head: true }),
    supabase.from("devices").select("*", { count: "exact", head: true }),
    supabase.from("treatments").select("*", { count: "exact", head: true }),
    supabase.from("concerns").select("*", { count: "exact", head: true }),
  ]);

  return {
    clinicCount: clinics.count || 0,
    deviceCount: devices.count || 0,
    treatmentCount: treatments.count || 0,
    concernCount: concerns.count || 0,
  };
}

export default async function Home() {
  const { clinicCount, deviceCount, treatmentCount, concernCount } =
    await getData();

  const categories = [
    {
      title: "장비 / Devices",
      description: `${deviceCount}개의 미용 장비 정보`,
      href: "/devices",
      icon: "🔬",
    },
    {
      title: "클리닉 / Clinics",
      description: `서울 ${clinicCount}개 클리닉`,
      href: "/clinics",
      icon: "🏥",
    },
    {
      title: "시술 / Treatments",
      description: `${treatmentCount}가지 시술 정보`,
      href: "/treatments",
      icon: "💉",
    },
    {
      title: "고민 / Concerns",
      description: `${concernCount}가지 피부 고민`,
      href: "/concerns",
      icon: "🔍",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold">ABC Seoul</h1>
        <p className="text-gray-400 mt-2">서울 미용클리닉 검색 플랫폼</p>
        <p className="text-gray-500 mt-1 text-sm">
          {clinicCount} clinics · {deviceCount} devices · {treatmentCount}{" "}
          treatments
        </p>
      </header>

      <section className="max-w-4xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="border rounded-xl p-8 hover:shadow-lg transition block"
            >
              <span className="text-4xl">{cat.icon}</span>
              <h2 className="text-xl font-bold mt-4">{cat.title}</h2>
              <p className="text-gray-500 mt-2">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
