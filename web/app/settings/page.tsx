"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { clearAllData } from "../../lib/api";

export default function SettingsPage() {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<{
    deleted: {
      leads: number;
      analyses: number;
      outreaches: number;
      agentLogs: number;
      pipelineRuns: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClearAll() {
    setClearing(true);
    setError(null);
    try {
      const res = await clearAllData();
      setResult(res);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear data");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-400">
          Configure API endpoints and manage data.
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-400">
            API Base URL
          </label>
          <input
            type="text"
            defaultValue="http://127.0.0.1:3001"
            className="px-3 py-2 border border-slate-700 rounded-lg text-sm w-full bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-400">
            Redis URL
          </label>
          <input
            type="text"
            defaultValue="redis://127.0.0.1:6379"
            className="px-3 py-2 border border-slate-700 rounded-lg text-sm w-full bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-900 rounded-xl border border-red-900/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-slate-400">
          Permanently delete all leads, analyses, outreach emails, agent logs,
          and pipeline runs. This cannot be undone. Agent configurations are
          preserved.
        </p>

        {confirming ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                Are you sure? All data will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {clearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {clearing ? "Clearing..." : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={clearing}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setConfirming(true);
              setResult(null);
              setError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg text-sm font-medium hover:bg-red-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        )}

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        {result && (
          <div className="p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Data cleared successfully
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span>
                {result.deleted.leads} leads
              </span>
              <span>
                {result.deleted.analyses} analyses
              </span>
              <span>
                {result.deleted.outreaches} outreaches
              </span>
              <span>
                {result.deleted.agentLogs} logs
              </span>
              <span>
                {result.deleted.pipelineRuns} runs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
