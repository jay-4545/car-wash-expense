"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { TrendingUp, TrendingDown, Car, Wallet, RefreshCw } from "lucide-react";

interface Stats {
  totalIncome: number;
  totalCars: number;
  totalExpenses: number;
  netProfit: number;
  todayCars: number;
  period: string;
}

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "All Time", value: "all" },
];

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  loading,
  isCount,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  loading: boolean;
  isCount?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={17} strokeWidth={1.5} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-28 bg-slate-100 rounded-lg animate-pulse" />
      ) : (
        <p className={`text-2xl font-bold text-slate-800 tracking-tight ${value < 0 ? "text-red-500" : ""}`}>
          {!isCount && "₹"}
          {isCount ? value.toLocaleString() : Math.abs(value).toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (!res.ok) throw new Error("Failed");
      setStats(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <AppShell title="Dashboard" subtitle="Business overview">
      {/* Period selector + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              id={`period-${p.value}`}
              onClick={() => setPeriod(p.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.value
                  ? "bg-[#1e2235] text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          id="refresh-stats"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <StatCard title="Total Income" value={stats?.totalIncome ?? 0} icon={TrendingUp} accent="bg-emerald-50 text-emerald-600" loading={loading} />
        <StatCard title="Total Expenses" value={stats?.totalExpenses ?? 0} icon={TrendingDown} accent="bg-red-50 text-red-500" loading={loading} />
        <StatCard title="Cars Washed" value={stats?.totalCars ?? 0} icon={Car} accent="bg-blue-50 text-blue-600" loading={loading} isCount />
        <StatCard title="Net Profit" value={stats?.netProfit ?? 0} icon={Wallet} accent="bg-violet-50 text-violet-600" loading={loading} />
      </div>

      {/* Today summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <h2 className="text-slate-700 font-semibold text-sm">Today's Summary</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-slate-400 text-xs font-medium mb-1.5">Cars Today</p>
              <p className="text-slate-800 font-bold text-xl">{stats?.todayCars ?? 0}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-slate-400 text-xs font-medium mb-1.5">Viewing</p>
              <p className="text-slate-800 font-semibold text-sm capitalize">
                {PERIODS.find((p) => p.value === period)?.label}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <p className="text-slate-400 text-xs font-medium mb-1.5">Profit Margin</p>
              <p className={`font-semibold text-sm ${stats && stats.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {stats && stats.totalIncome > 0
                  ? `${((stats.netProfit / stats.totalIncome) * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}