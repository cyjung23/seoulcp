"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar({
  initialQuery = "",
  placeholder = "시술, 고민, 장비, 클리닉 검색...",
}: {
  initialQuery?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-5 py-3.5 pr-14 rounded-xl border border-gray-300 bg-white text-gray-900 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-cat-concern focus:border-transparent placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-cat-concern text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          검색
        </button>
      </div>
    </form>
  );
}
