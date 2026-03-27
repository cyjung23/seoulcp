"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NavSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      router.push("/");
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="미용의료에 관한 모든 궁금증을 검색해보세요"
          className="w-full px-3 py-1.5 pr-14 rounded-md border border-gray-600 bg-[#2a3a4e] text-white text-sm outline-none focus:border-cat-concern placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-cat-concern text-white px-3 py-1 rounded text-xs font-semibold hover:opacity-90 transition"
        >
          검색
        </button>
      </div>
    </form>
  );
}
