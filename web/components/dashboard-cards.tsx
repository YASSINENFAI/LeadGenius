"use client";

import { useRouter } from "next/navigation";
import { Database, Search, Mail, TrendingUp, Plus, Send, Target, Zap, BarChart3 } from "lucide-react";
import { getDashboardStats } from "../lib/api";
import type { DashboardStats } from "../lib/types";
import { usePolling } from "../lib/hooks/use-polling";

interface CardConfig {
  label: string;
  getValue: (stats: DashboardStats) => number | string;
  icon: typeof Database;
  color: string;
  bgColor: string;
  getTrend: (stats: DashboardStats) => string;
}

const CARDS: CardConfig[] = [
  {
    label: "Total Leads",
    getValue: (s) => s.totalLeads,
    icon: Database,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    getTrend: (s) =>
      s.leadsThisWeek > 0
        ? `+${s.leadsThisWeek} this week`
        : "No new leads this week",
  },
  {
    label: "Analyzed",
    getValue: (s) => s.leadsAnalyzed,
    icon: Search,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    getTrend: (s) => {
      const pct =
        s.totalLeads > 0
          ? Math.round((s.leadsAnalyzed / s.totalLeads) * 100)
          : 0;
      return `${pct}% of total`;
    },
  },
  {
    label: "Contacted",
    getValue: (s) => s.leadsContacted,
    icon: Mail,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    getTrend: (s) => `${s.leadsResponded} responded`,
  },
  {
    label: "Conversion Rate",
    getValue: (s) => s.conversionRate + "%",
    icon: TrendingUp,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    getTrend: (s) => `${s.leadsWon} won deals`,
  },
];

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-slate-700">
          <div className="w-6 h-6 bg-slate-600 rounded" />
        </div>
      </div>
      <div className="h-10 w-24 bg-slate-700 rounded mb-2" />
      <div className="h-5 w-32 bg-slate-700 rounded" />
      <div className="h-4 w-28 bg-slate-700 rounded mt-4" />
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const router = useRouter();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => router.push("/pipeline")}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          Send Email
        </button>
        <button 
          onClick={() => router.push("/agents")}
          className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Target className="w-4 h-4" />
          Find Leads
        </button>
        <button 
          onClick={() => router.push("/reports")}
          className="flex items-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          View Reports
        </button>
        <button 
          onClick={() => router.push("/settings")}
          className="flex items-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
        >
          <Database className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}

// Email Performance Component
function EmailPerformance({ stats }: { stats: DashboardStats }) {
  const openRate = stats.leadsContacted > 0 
    ? Math.round((stats.leadsResponded / stats.leadsContacted) * 100)
    : 0;
  
  const replyRate = stats.leadsContacted > 0
    ? Math.round((stats.leadsWon / stats.leadsContacted) * 100)
    : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-blue-400" />
        Email Performance
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Open Rate</span>
            <span className="text-sm font-medium text-slate-200">{openRate}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${openRate}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Reply Rate</span>
            <span className="text-sm font-medium text-slate-200">{replyRate}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${replyRate}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Conversion</span>
            <span className="text-sm font-medium text-slate-200">{stats.conversionRate}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.conversionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardCards() {
  const { data, isLoading } = usePolling(
    () => getDashboardStats(),
    15_000,
  );

  const stats = data?.stats ?? null;

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const value = card.getValue(stats);
          const trend = card.getTrend(stats);

          return (
            <div
              key={card.label}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <p className="text-4xl font-bold text-slate-100">{value}</p>
              <p className="text-base text-slate-300 mt-1 font-medium">{card.label}</p>
              <p className="text-sm text-slate-500 mt-3">
                {trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Email Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActions />
        <EmailPerformance stats={stats} />
      </div>
    </div>
  );
}
