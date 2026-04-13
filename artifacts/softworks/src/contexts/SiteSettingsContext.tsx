import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { API } from "@/lib/apiUrl";

const LS_LOGO = "sw_site_logo";
const LS_NAME = "sw_site_name";
const LS_SETTINGS_CACHE = "sw_settings_cache";

export interface SiteSettings {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialLinkedin: string | null;
  socialTwitter: string | null;
  footerText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "SOFTWORKS IT FARM",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#6366f1",
  contactEmail: null,
  contactPhone: null,
  address: null,
  socialFacebook: null,
  socialInstagram: null,
  socialLinkedin: null,
  socialTwitter: null,
  footerText: null,
  seoTitle: null,
  seoDescription: null,
};

interface SiteSettingsContextType extends SiteSettings {
  apiLoaded: boolean;
  apiConnected: boolean;
  setLogoUrl: (url: string | null) => void;
  setSiteName: (name: string) => void;
  saveSettings: (patch: Partial<SiteSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  ...DEFAULT_SETTINGS,
  apiLoaded: false,
  apiConnected: false,
  setLogoUrl: () => {},
  setSiteName: () => {},
  saveSettings: async () => {},
  reloadSettings: async () => {},
});

function getCachedSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_CACHE);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return {
    ...DEFAULT_SETTINGS,
    logoUrl: localStorage.getItem(LS_LOGO) || null,
    siteName: localStorage.getItem(LS_NAME) || "SOFTWORKS IT FARM",
  };
}

function cacheSettings(s: SiteSettings) {
  try {
    localStorage.setItem(LS_SETTINGS_CACHE, JSON.stringify(s));
    if (s.logoUrl) localStorage.setItem(LS_LOGO, s.logoUrl);
    else localStorage.removeItem(LS_LOGO);
    localStorage.setItem(LS_NAME, s.siteName);
  } catch {}
}

const SETTINGS_URL = `${API}/api/settings`;

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<SiteSettings>(getCachedSettings);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const hasFetched = useRef(false);

  async function loadFromApi() {
    try {
      const r = await fetch(SETTINGS_URL, { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const merged: SiteSettings = {
        siteName: data.siteName || DEFAULT_SETTINGS.siteName,
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        primaryColor: data.primaryColor || DEFAULT_SETTINGS.primaryColor,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        address: data.address || null,
        socialFacebook: data.socialFacebook || null,
        socialInstagram: data.socialInstagram || null,
        socialLinkedin: data.socialLinkedin || null,
        socialTwitter: data.socialTwitter || null,
        footerText: data.footerText || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      };
      setSettingsState(merged);
      cacheSettings(merged);
      setApiLoaded(true);
      setApiConnected(true);
    } catch (e) {
      console.warn("[SiteSettings] Could not load from API, using cached values:", e);
      setApiLoaded(false);
      setApiConnected(false);
    }
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadFromApi();
    }
  }, []);

  const saveSettings = async (patch: Partial<SiteSettings>) => {
    try {
      const r = await fetch(SETTINGS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error("Save failed");
      const updated = await r.json();
      const merged: SiteSettings = { ...settings, ...updated };
      setSettingsState(merged);
      cacheSettings(merged);
      setApiConnected(true);
    } catch (e) {
      console.error("[SiteSettings] Save failed:", e);
      throw e;
    }
  };

  const setLogoUrl = (url: string | null) => {
    const next = { ...settings, logoUrl: url };
    setSettingsState(next);
    cacheSettings(next);
    fetch(SETTINGS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: url }),
    }).catch(() => {});
  };

  const setSiteName = (name: string) => {
    const next = { ...settings, siteName: name || "SOFTWORKS IT FARM" };
    setSettingsState(next);
    cacheSettings(next);
    fetch(SETTINGS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteName: next.siteName }),
    }).catch(() => {});
  };

  return (
    <SiteSettingsContext.Provider value={{
      ...settings,
      apiLoaded,
      apiConnected,
      setLogoUrl,
      setSiteName,
      saveSettings,
      reloadSettings: loadFromApi,
    }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
