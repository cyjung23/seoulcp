"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { href: "/concerns", label: "고민", icon: "💬" },
  { href: "/treatments", label: "시술", icon: "💉" },
  { href: "/surgeries", label: "수술", icon: "🔪" },
  { href: "/devices", label: "장비", icon: "🔬" },
  { href: "/clinics", label: "클리닉", icon: "🏥" },
];

export default function NavMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* 햄버거 버튼 — 768px 이하에서만 표시 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden text-gray-300 text-xl leading-none p-1 hover:text-white transition"
        aria-label="메뉴 열기"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-base-dark border-t border-gray-700 z-50">
          <div className="max-w-7xl mx-auto px-4 py-2">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 py-3 px-2 text-sm font-medium border-b border-gray-800 last:border-b-0 transition
                  ${pathname.startsWith(item.href)
                    ? "text-ui-primary"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                <span className="text-base w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
