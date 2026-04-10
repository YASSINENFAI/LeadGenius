"use client";

import { BarChart3, Mail, Users, TrendingUp, Calendar } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
        <p className="text-sm text-slate-400 mt-1">
          View performance metrics and analytics
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
        <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Reports Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Advanced reporting features are being developed. You'll be able to view detailed analytics, 
          email performance trends, and lead conversion reports.
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-200">Email Analytics</h3>
            <p className="text-xs text-slate-500 mt-1">Open rates, reply rates, bounce rates</p>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-200">Lead Insights</h3>
            <p className="text-xs text-slate-500 mt-1">Source analysis, industry breakdown</p>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-200">Trends</h3>
            <p className="text-xs text-slate-500 mt-1">Weekly and monthly performance</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Email Performance (Last 30 Days)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Sent</span>
              <span className="text-lg font-semibold text-slate-200">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Average Open Rate</span>
              <span className="text-lg font-semibold text-slate-200">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Average Reply Rate</span>
              <span className="text-lg font-semibold text-slate-200">--</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Lead Generation (Last 30 Days)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">New Leads</span>
              <span className="text-lg font-semibold text-slate-200">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Analyzed</span>
              <span className="text-lg font-semibold text-slate-200">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Contacted</span>
              <span className="text-lg font-semibold text-slate-200">--</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
