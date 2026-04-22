"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 sticky top-0 z-20">
      <button
        id="mobile-menu-btn"
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-slate-700 mr-3 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
      >
        <Menu size={18} />
      </button>
      <div>
        <h1 className="text-slate-800 text-base font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </header>
  );
}