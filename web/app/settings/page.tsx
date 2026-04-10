"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Mail,
  Unplug,
  Plus,
  Star,
  Zap,
  X,
  ExternalLink,
  Settings2,
  Send,
  Brain,
  Bell,
  Database,
} from "lucide-react";
import {
  clearAllData,
  getEmailProviderStatus,
  getGmailConnectUrl,
  disconnectGmail,
  getEmailSettings,
  setEmailSettings as setEmailSettingsApi,
  getSmtpConfig,
  saveSmtpConfig,
  deleteSmtpConfig,
  testSmtpConfig,
  getAiProviders,
  createAiProvider,
  updateAiProvider,
  deleteAiProvider,
  testAiProvider,
  setDefaultAiProvider,
  getTelegramSettings,
  saveTelegramSettings,
  testTelegramSettings,
  disconnectTelegram,
} from "../../lib/api";
import type {
  EmailProviderStatus,
  EmailSettingsResponse,
  AiProvider,
  AiProviderDefaults,
  AiProviderType,
} from "../../lib/types";

const PROVIDER_TYPES: { value: AiProviderType; label: string; icon: string }[] = [
  { value: "glm", label: "GLM (ZhipuAI)", icon: "🧠" },
  { value: "anthropic", label: "Anthropic Claude", icon: "🟠" },
  { value: "openai", label: "OpenAI", icon: "🟢" },
  { value: "ollama", label: "Ollama (Local)", icon: "🦙" },
  { value: "minimax", label: "MiniMax", icon: "🔵" },
  { value: "kimi", label: "Kimi (Moonshot)", icon: "🌙" },
  { value: "deepseek", label: "DeepSeek", icon: "🔮" },
  { value: "groq", label: "Groq", icon: "⚡" },
];

interface ProviderFormData {
  name: string;
  providerType: AiProviderType;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: string;
  maxTokens: number;
}

const emptyForm: ProviderFormData = {
  name: "",
  providerType: "openai",
  apiKey: "",
  baseUrl: "",
  model: "",
  temperature: "",
  maxTokens: 4096,
};

// Tab type
type SettingsTab = "ai" | "email" | "notifications" | "data";

// Telegram Settings Component
function TelegramSettings() {
  const [settings, setSettings] = useState<{
    configured: boolean;
    isEnabled: boolean;
    chatId: string | null;
    notifySent: boolean;
    notifyOpen: boolean;
    notifyReply: boolean;
    notifyBounce: boolean;
    notifyFail: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    botToken: "",
    chatId: "",
    isEnabled: true,
    notifySent: true,
    notifyOpen: true,
    notifyReply: true,
    notifyBounce: true,
    notifyFail: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getTelegramSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveTelegramSettings(form);
      setShowForm(false);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    try {
      await testTelegramSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Telegram notifications?")) return;
    try {
      await disconnectTelegram();
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {settings?.configured ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              {settings.isEnabled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <X className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <p className="text-base text-slate-200 font-medium">
                  {settings.isEnabled ? "Connected" : "Disabled"}
                </p>
                {settings.chatId && (
                  <p className="text-sm text-slate-400">Chat ID: {settings.chatId}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTest}
                disabled={testing || !settings.isEnabled}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 disabled:opacity-50 transition-colors"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Test
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                title="Edit"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Disconnect"
              >
                <Unplug className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Notification Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className={`p-3 rounded-lg text-sm ${settings.notifySent ? "bg-purple-900/30 text-purple-300 border border-purple-700/50" : "bg-slate-800/50 text-slate-500 border border-slate-700/30"}`}>
                ✅ Email Sent
              </div>
              <div className={`p-3 rounded-lg text-sm ${settings.notifyOpen ? "bg-purple-900/30 text-purple-300 border border-purple-700/50" : "bg-slate-800/50 text-slate-500 border border-slate-700/30"}`}>
                📧 Email Opened
              </div>
              <div className={`p-3 rounded-lg text-sm ${settings.notifyReply ? "bg-purple-900/30 text-purple-300 border border-purple-700/50" : "bg-slate-800/50 text-slate-500 border border-slate-700/30"}`}>
                💬 Email Replied
              </div>
              <div className={`p-3 rounded-lg text-sm ${settings.notifyBounce ? "bg-purple-900/30 text-purple-300 border border-purple-700/50" : "bg-slate-800/50 text-slate-500 border border-slate-700/30"}`}>
                ⚠️ Email Bounced
              </div>
              <div className={`p-3 rounded-lg text-sm ${settings.notifyFail ? "bg-purple-900/30 text-purple-300 border border-purple-700/50" : "bg-slate-800/50 text-slate-500 border border-slate-700/30"}`}>
                ❌ Email Failed
              </div>
            </div>
          </div>
        </div>
      ) : showForm ? (
        <div className="p-5 bg-slate-800 rounded-lg border border-slate-600 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium text-slate-200">Setup Telegram</h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Bot Token</label>
              <input
                type="password"
                value={form.botToken}
                onChange={(e) => setForm({ ...form, botToken: e.target.value })}
                placeholder="123456789:ABCdef..."
                className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Chat ID</label>
              <input
                type="text"
                value={form.chatId}
                onChange={(e) => setForm({ ...form, chatId: e.target.value })}
                placeholder="123456789"
                className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300"
          >
            <ExternalLink className="w-4 h-4" />
            Create a bot with @BotFather
          </a>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.botToken || !form.chatId}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Connect"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div>
            <p className="text-sm text-slate-400">Not configured</p>
            <p className="text-xs text-slate-500 mt-0.5">Receive notifications when emails are sent, opened, or replied</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Setup
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ai");

  // AI Provider state
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
  const [aiDefaults, setAiDefaults] = useState<Record<string, AiProviderDefaults>>({});
  const [activeProvider, setActiveProvider] = useState<{ name: string; providerType: string; baseUrl: string | null; model: string; isEnvFallback: boolean } | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProviderFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; error?: string; model?: string } | null>(null);

  // Email provider state
  const [providerStatus, setProviderStatus] = useState<EmailProviderStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettingsResponse | null>(null);
  const [showSmtpForm, setShowSmtpForm] = useState(false);
  const [smtpForm, setSmtpForm] = useState({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "FindX",
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Danger zone state
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

  const loadProviderStatus = useCallback(async () => {
    try {
      const status = await getEmailProviderStatus();
      setProviderStatus(status);
      setProviderError(null);
    } catch {
      // Provider status endpoint might not be available yet
    }
  }, []);

  const loadEmailSettings = useCallback(async () => {
    try {
      const settings = await getEmailSettings();
      setEmailSettings(settings);
    } catch {
      // Settings endpoint might not be available yet
    }
  }, []);

  const loadAiProviders = useCallback(async () => {
    setAiLoading(true);
    try {
      const data = await getAiProviders();
      setAiProviders(data.providers);
      setAiDefaults(data.defaults);
      setActiveProvider(data.activeProvider ?? null);
      setAiError(null);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to load AI providers");
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviderStatus();
    loadEmailSettings();
    loadAiProviders();
  }, [loadProviderStatus, loadEmailSettings, loadAiProviders]);

  // Auto-fill form when provider type changes
  useEffect(() => {
    if (!showForm || editingId) return;
    const defaults = aiDefaults[form.providerType];
    if (defaults) {
      setForm((prev) => ({
        ...prev,
        name: defaults.label,
        baseUrl: defaults.defaultBaseUrl,
        model: defaults.defaultModel,
      }));
    }
  }, [form.providerType, aiDefaults, editingId, showForm]);

  async function handleConnectGmail() {
    setConnecting(true);
    setProviderError(null);
    try {
      const { url } = await getGmailConnectUrl();
      const popup = window.open(url, "gmail-auth", "width=500,height=600");
      if (!popup) {
        setProviderError("Popup blocked. Please allow popups for this site.");
        return;
      }
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          loadProviderStatus();
        }
      }, 500);
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : "Failed to connect Gmail");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnectGmail() {
    setDisconnecting(true);
    setProviderError(null);
    try {
      await disconnectGmail();
      await loadProviderStatus();
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : "Failed to disconnect Gmail");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSaveSmtp() {
    setSmtpSaving(true);
    setSmtpTestResult(null);
    try {
      await saveSmtpConfig(smtpForm);
      setShowSmtpForm(false);
      await loadProviderStatus();
      await loadEmailSettings();
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : "Failed to save SMTP config");
    } finally {
      setSmtpSaving(false);
    }
  }

  async function handleTestSmtp() {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const result = await testSmtpConfig();
      setSmtpTestResult(result);
    } catch (err) {
      setSmtpTestResult({ success: false, error: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setSmtpTesting(false);
    }
  }

  async function handleDeleteSmtp() {
    if (!confirm("Delete SMTP configuration?")) return;
    try {
      await deleteSmtpConfig();
      setSmtpForm({ host: "mail.privateemail.com", port: 465, secure: true, user: "", password: "", fromEmail: "", fromName: "FindX" });
      setSmtpTestResult(null);
      await loadProviderStatus();
      await loadEmailSettings();
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : "Failed to delete SMTP config");
    }
  }

  async function handleSetDefaultProvider(provider: "resend" | "gmail" | "smtp") {
    try {
      await setEmailSettingsApi(provider);
      await loadProviderStatus();
      await loadEmailSettings();
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : "Failed to set default provider");
    }
  }

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

  // AI Provider handlers
  function openAddForm() {
    setEditingId(null);
    const d = aiDefaults["openai"];
    setForm({
      ...emptyForm,
      name: d?.label || "",
      baseUrl: d?.defaultBaseUrl || "",
      model: d?.defaultModel || "",
    });
    setShowForm(true);
  }

  function openEditForm(provider: AiProvider) {
    setEditingId(provider.id);
    setForm({
      name: provider.name,
      providerType: provider.providerType,
      apiKey: "",
      baseUrl: provider.baseUrl || "",
      model: provider.model,
      temperature: provider.temperature?.toString() || "",
      maxTokens: provider.maxTokens,
    });
    setShowForm(true);
  }

  async function handleSaveProvider() {
    setSaving(true);
    setAiError(null);
    try {
      const data = {
        name: form.name,
        providerType: form.providerType,
        apiKey: form.apiKey || undefined,
        baseUrl: form.baseUrl || undefined,
        model: form.model,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        maxTokens: form.maxTokens,
      };

      if (editingId) {
        await updateAiProvider(editingId, {
          ...data,
          ...(form.apiKey ? { apiKey: form.apiKey } : {}),
        });
      } else {
        await createAiProvider(data);
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadAiProviders();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to save provider");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProvider(id: string) {
    if (!confirm("Delete this AI provider?")) return;
    try {
      await deleteAiProvider(id);
      await loadAiProviders();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleTestProvider(id: string) {
    setTesting(id);
    setTestResult(null);
    try {
      const res = await testAiProvider(id);
      setTestResult({ id, ...res });
    } catch (err) {
      setTestResult({ id, ok: false, error: err instanceof Error ? err.message : "Test failed" });
    } finally {
      setTesting(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultAiProvider(id);
      await loadAiProviders();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to set default");
    }
  }

  const currentDefaults = aiDefaults[form.providerType];

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "ai", label: "AI Providers", icon: <Brain className="w-4 h-4" /> },
    { id: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "data", label: "Data", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure API endpoints, AI providers, and manage data.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        {/* AI Providers Tab */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-semibold text-slate-200">AI Providers</h3>
              </div>
              <button
                onClick={openAddForm}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Provider
              </button>
            </div>

            {/* Active Provider Banner */}
            {activeProvider && (
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600/20">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-300">Active Provider</span>
                    {activeProvider.isEnvFallback && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-600/30 text-amber-300 rounded">
                        ENV FALLBACK
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {PROVIDER_TYPES.find((t) => t.value === activeProvider.providerType)?.label ?? activeProvider.providerType}
                    {" "}&middot;{" "}
                    <span className="text-slate-300 font-medium">{activeProvider.model}</span>
                  </p>
                </div>
              </div>
            )}

            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading providers...
              </div>
            ) : aiProviders.length === 0 ? (
              <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                <p className="text-sm text-slate-400">
                  No AI providers configured. Add one below or set environment variables.
                </p>
                <button
                  onClick={openAddForm}
                  className="mt-4 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors"
                >
                  Add your first AI provider
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {aiProviders.map((provider) => {
                  const info = PROVIDER_TYPES.find((t) => t.value === provider.providerType);
                  return (
                    <div
                      key={provider.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        provider.isDefault
                          ? "bg-violet-900/20 border-violet-700/50"
                          : "bg-slate-800/50 border-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">{info?.icon || "🤖"}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-200 font-medium">{provider.name}</p>
                            {provider.isDefault && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-violet-600/30 text-violet-300 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {info?.label} &middot; {provider.model}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResult?.id === provider.id && (
                          testResult.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          )
                        )}
                        <button
                          onClick={() => handleTestProvider(provider.id)}
                          disabled={testing === provider.id}
                          className="p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-50 transition-colors"
                          title="Test connection"
                        >
                          {testing === provider.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </button>
                        {!provider.isDefault && (
                          <button
                            onClick={() => handleSetDefault(provider.id)}
                            className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditForm(provider)}
                          className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
              <div className="p-5 bg-slate-800 rounded-lg border border-slate-600 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-slate-200">
                    {editingId ? "Edit Provider" : "Add Provider"}
                  </h4>
                  <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Provider Type</label>
                    <select
                      value={form.providerType}
                      onChange={(e) => setForm({ ...form, providerType: e.target.value as AiProviderType })}
                      disabled={!!editingId}
                      className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {PROVIDER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="My Provider"
                      className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder={editingId ? "Leave empty to keep current key" : "sk-..."}
                    className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Base URL</label>
                    <input
                      type="text"
                      value={form.baseUrl}
                      onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                      placeholder={currentDefaults?.defaultBaseUrl}
                      className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Model</label>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder={currentDefaults?.defaultModel}
                      className="w-full px-3 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveProvider}
                    disabled={saving || !form.name || !form.model}
                    className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : editingId ? "Update Provider" : "Add Provider"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {aiError && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {aiError}
              </p>
            )}
          </div>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-slate-200">Email Provider</h3>
            </div>

            {providerStatus ? (
              <div className="space-y-4">
                {/* Active provider */}
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-300">
                      Active provider:{" "}
                      <span className="font-medium text-slate-100 capitalize">
                        {providerStatus.provider === "none" ? "Not configured" : providerStatus.provider}
                      </span>
                    </p>
                    {providerStatus.email && (
                      <p className="text-xs text-slate-400 mt-1">{providerStatus.email}</p>
                    )}
                  </div>
                  {providerStatus.connected && (
                    <span className="px-3 py-1 text-xs font-medium bg-emerald-900/40 text-emerald-400 rounded-full">
                      Connected
                    </span>
                  )}
                </div>

                {/* Gmail */}
                <div className={`p-4 rounded-lg border space-y-3 ${
                  emailSettings?.providers.gmail.connected
                    ? "bg-slate-800/50 border-slate-700/50"
                    : "bg-slate-800/30 border-slate-700/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📧</span>
                      <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">Gmail</p>
                    </div>
                    {emailSettings?.defaultProvider === "gmail" && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-600/30 text-blue-300 rounded">DEFAULT</span>
                    )}
                  </div>

                  {emailSettings?.providers.gmail.connected ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-slate-300">{emailSettings.providers.gmail.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {emailSettings.defaultProvider !== "gmail" && (
                          <button
                            onClick={() => handleSetDefaultProvider("gmail")}
                            className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={handleDisconnectGmail}
                          disabled={disconnecting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                        >
                          {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : emailSettings?.providers.gmail.configured ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Credentials set. Connect to send emails.</p>
                      <button
                        onClick={handleConnectGmail}
                        disabled={connecting}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        {connecting ? "Connecting..." : "Connect"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Set <code className="text-slate-400">GOOGLE_CLIENT_ID</code> and <code className="text-slate-400">GOOGLE_CLIENT_SECRET</code> env vars.
                    </p>
                  )}
                </div>

                {/* SMTP */}
                <div className={`p-4 rounded-lg border space-y-3 ${
                  emailSettings?.providers.smtp.configured
                    ? "bg-slate-800/50 border-slate-700/50"
                    : "bg-slate-800/30 border-slate-700/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌐</span>
                      <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">SMTP</p>
                    </div>
                    {emailSettings?.defaultProvider === "smtp" && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-600/30 text-blue-300 rounded">DEFAULT</span>
                    )}
                  </div>

                  {emailSettings?.providers.smtp.configured && !showSmtpForm ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-slate-300">{emailSettings.providers.smtp.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {emailSettings.defaultProvider !== "smtp" && (
                          <button
                            onClick={() => handleSetDefaultProvider("smtp")}
                            className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowSmtpForm(true)}
                          className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleDeleteSmtp}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : showSmtpForm ? (
                    <div className="space-y-3 p-4 bg-slate-900 rounded-lg border border-slate-600">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Host</label>
                          <input
                            type="text"
                            value={smtpForm.host}
                            onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Port</label>
                          <input
                            type="number"
                            value={smtpForm.port}
                            onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 465 })}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Username</label>
                          <input
                            type="text"
                            value={smtpForm.user}
                            onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                          <input
                            type="password"
                            value={smtpForm.password}
                            onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">From Email</label>
                          <input
                            type="email"
                            value={smtpForm.fromEmail}
                            onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">From Name</label>
                          <input
                            type="text"
                            value={smtpForm.fromName}
                            onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSaveSmtp}
                          disabled={smtpSaving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {smtpSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleTestSmtp}
                          disabled={smtpTesting}
                          className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50 transition-colors"
                        >
                          {smtpTesting ? "Testing..." : "Test"}
                        </button>
                        <button
                          onClick={() => setShowSmtpForm(false)}
                          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSmtpForm(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Configure SMTP
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Loading email provider status...</div>
            )}

            {providerError && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {providerError}
              </p>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-slate-200">Telegram Notifications</h3>
            </div>
            <TelegramSettings />
          </div>
        )}

        {/* Data Tab */}
        {activeTab === "data" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
            </div>
            <p className="text-sm text-slate-400">
              Permanently delete all leads, analyses, outreach emails, agent logs,
              and pipeline runs. This cannot be undone. Agent configurations are
              preserved.
            </p>

            {confirming ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">
                    Are you sure? All data will be permanently deleted.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {clearing ? "Clearing..." : "Yes, delete everything"}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={clearing}
                    className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
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
                className="flex items-center gap-2 px-5 py-2.5 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg text-sm font-medium hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            )}

            {error && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </p>
            )}

            {result && (
              <div className="p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    Data cleared successfully
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span>{result.deleted.leads} leads</span>
                  <span>{result.deleted.analyses} analyses</span>
                  <span>{result.deleted.outreaches} outreaches</span>
                  <span>{result.deleted.agentLogs} logs</span>
                  <span>{result.deleted.pipelineRuns} runs</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
