"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/problems", label: "Problems", comingSoon: true },
  { href: "/progress", label: "Progress", comingSoon: true },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between max-w-5xl mx-auto mb-10">
      {/* Logo */}
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Prep<span className="text-indigo-400">Forge</span>
      </Link>

      {/* Links */}
      <div className="hidden sm:flex items-center gap-1">
        {NAV_LINKS.map((link) =>
          link.comingSoon ? (
            <span
              key={link.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 cursor-default select-none"
              title="Coming soon"
            >
              {link.label}
              <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-700">
                soon
              </span>
            </span>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          )
        )}
      </div>

      {/* User avatar */}
      <UserButton afterSignOutUrl="/" />
    </nav>
  );
}
