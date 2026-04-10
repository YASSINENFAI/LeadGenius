"use client";

import { useState } from "react";
import { Send, Loader2, Sparkles, Pencil, AlertTriangle, Clock } from "lucide-react";
import type { Lead, Outreach } from "../lib/types";
import { generateOutreach, updateOutreach, sendOutreach, scheduleOutreach } from "../lib/api";

export function OutreachPanel({ lead, onLeadUpdated }: { lead: Lead; onLeadUpdated: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<"professional" | "friendly" | "urgent">("professional");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleOutreachId, setScheduleOutreachId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const outreaches = lead.outreaches ?? [];

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await generateOutreach(lead.id, { tone, sync: true });
      onLeadUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(id: string) {
    setError(null);
    try {
      await updateOutreach(id, { subject: editSubject, body: editBody });
      setEditingId(null);
      onLeadUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save email");
    }
  }

  async function handleSend(outreachId: string) {
    setSendingId(outreachId);
    setError(null);
    try {
      const result = await sendOutreach(lead.id, outreachId, true) as Record<string, unknown> | null;
      if (result && result.sent === false) {
        setError(String(result.reason || result.error || "Email was not sent"));
      }
      onLeadUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingId(null);
    }
  }

  function openScheduleModal(outreachId: string) {
    setScheduleOutreachId(outreachId);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    setScheduleDate(now.toISOString().split("T")[0]);
    setScheduleTime(now.toTimeString().slice(0, 5));
    setShowSchedule(true);
  }

  async function handleSchedule() {
    if (!scheduleOutreachId || !scheduleDate || !scheduleTime) return;
    
    setSchedulingId(scheduleOutreachId);
    setError(null);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      await scheduleOutreach(scheduleOutreachId, scheduledAt.toISOString());
      setShowSchedule(false);
      onLeadUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule email");
    } finally {
      setSchedulingId(null);
    }
  }

  function startEditing(o: Outreach) {
    setEditingId(o.id);
    setEditSubject(o.subject);
    setEditBody(o.body);
  }

  return (
    <div className="space-y-4">
      {/* Generate */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? "Generating..." : "Generate Email"}
          </button>
        </div>
      </div>

      {/* Error feedback */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950 text-red-300 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Outreach list */}
      {outreaches.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500">
          No outreach emails yet. Generate one to get started.
        </div>
      ) : (
        outreaches.map((o) => (
          <div key={o.id} className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  o.status === "sent"
                    ? "bg-emerald-900/60 text-emerald-300"
                    : o.status === "opened"
                      ? "bg-blue-900/60 text-blue-300"
                      : o.status === "replied"
                        ? "bg-purple-900/60 text-purple-300"
                        : "bg-slate-800 text-slate-300"
                }`}
              >
                {o.status}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(o.createdAt).toLocaleString("nl-NL")}
              </span>
            </div>

            {editingId === o.id ? (
              <div className="space-y-2">
                <input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-slate-200"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(o.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold text-sm text-slate-200">{o.subject}</p>
                <p className="text-sm text-slate-400 whitespace-pre-wrap line-clamp-6">{o.body}</p>
                <div className="flex gap-2">
                  {(o.status === "draft" || o.status === "pending_approval") && (
                    <>
                      <button
                        onClick={() => startEditing(o)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleSend(o.id)}
                        disabled={sendingId === o.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        Send
                      </button>
                      <button
                        onClick={() => openScheduleModal(o.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium"
                      >
                        <Clock className="w-3 h-3" />
                        Schedule
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Schedule Email</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSchedule(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={schedulingId !== null || !scheduleDate || !scheduleTime}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {schedulingId ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
