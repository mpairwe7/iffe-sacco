"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Setting } from "@iffe/shared";

interface SettingsState {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  currency: string;
  dateFormat: string;
  language: string;
  timezone: string;
  address: string;
}

const defaultSettings: SettingsState = {
  companyName: "IFFE SACCO",
  tagline: "Empowering Financial Freedom",
  email: "info@iffeds.org",
  phone: "+256 700 000 000",
  currency: "USh",
  dateFormat: "Y-m-d",
  language: "English",
  timezone: "Africa/Kampala (UTC+3)",
  address: "Kampala, Uganda",
};

const settingKeyMap: Record<keyof SettingsState, string> = {
  companyName: "company_name",
  tagline: "tagline",
  email: "company_email",
  phone: "company_phone",
  currency: "base_currency",
  dateFormat: "date_format",
  language: "language",
  timezone: "timezone",
  address: "address",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [original, setOriginal] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = Object.keys(settings).some(
    (k) => settings[k as keyof SettingsState] !== original[k as keyof SettingsState]
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiClient.get<Setting[]>("/settings");
        if (data && Array.isArray(data)) {
          const loaded = { ...defaultSettings };
          for (const s of data) {
            const localKey = Object.entries(settingKeyMap).find(
              ([, apiKey]) => apiKey === s.key
            )?.[0] as keyof SettingsState | undefined;
            if (localKey) {
              loaded[localKey] = s.value;
            }
          }
          setSettings(loaded);
          setOriginal(loaded);
        }
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const key of Object.keys(settings) as (keyof SettingsState)[]) {
        if (settings[key] !== original[key]) {
          promises.push(
            apiClient.put(`/settings/${settingKeyMap[key]}`, {
              value: settings[key],
            })
          );
        }
      }
      if (promises.length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }
      await Promise.all(promises);
      setOriginal({ ...settings });
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof SettingsState, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-text/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-text" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">System Settings</h1>
          <p className="text-text-muted text-sm">Configure your SACCO system</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-xl">
            <div className="p-6 border-b border-border">
              <h3 className="text-base font-semibold text-text">General Settings</h3>
              <p className="text-sm text-text-muted mt-1">Basic system configuration</p>
            </div>
            <div className="p-6 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Company Name</label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => update("companyName", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Tagline</label>
                      <input
                        type="text"
                        value={settings.tagline}
                        onChange={(e) => update("tagline", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Email</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Phone</label>
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Base Currency</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => update("currency", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="USh">Uganda Shilling (USh)</option>
                        <option value="KES">Kenya Shilling (KES)</option>
                        <option value="TZS">Tanzania Shilling (TZS)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Date Format</label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => update("dateFormat", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="Y-m-d">YYYY-MM-DD</option>
                        <option value="d/m/Y">DD/MM/YYYY</option>
                        <option value="m/d/Y">MM/DD/YYYY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => update("language", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option>English</option>
                        <option>Kiswahili</option>
                        <option>Luganda</option>
                        <option>Lusoga</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => update("timezone", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option>Africa/Kampala (UTC+3)</option>
                        <option>Africa/Nairobi (UTC+3)</option>
                        <option>Africa/Dar_es_Salaam (UTC+3)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Address</label>
                    <textarea
                      rows={2}
                      value={settings.address}
                      onChange={(e) => update("address", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-border">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
      </form>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-surface/95 backdrop-blur-sm border-t border-border/50 p-4 flex items-center justify-between z-40">
          <p className="text-sm text-text-muted">You have unsaved changes</p>
          <div className="flex gap-3">
            <button
              onClick={() => setSettings({ ...original })}
              className="px-4 py-2 text-sm text-text-muted border border-border rounded-lg hover:bg-surface-hover"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
