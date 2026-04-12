import { createContext, useContext, useState, ReactNode } from "react";

const LOGO_KEY = "sw_site_logo";
const SITE_NAME_KEY = "sw_site_name";
const FAVICON_KEY = "sw_site_favicon";

interface SiteSettingsContextType {
  logoUrl: string | null;
  siteName: string;
  setLogoUrl: (url: string | null) => void;
  setSiteName: (name: string) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  logoUrl: null,
  siteName: "SOFTWORKS IT FARM",
  setLogoUrl: () => {},
  setSiteName: () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrlState] = useState<string | null>(() =>
    localStorage.getItem(LOGO_KEY) || null
  );
  const [siteName, setSiteNameState] = useState<string>(() =>
    localStorage.getItem(SITE_NAME_KEY) || "SOFTWORKS IT FARM"
  );

  const setLogoUrl = (url: string | null) => {
    setLogoUrlState(url);
    if (url) localStorage.setItem(LOGO_KEY, url);
    else localStorage.removeItem(LOGO_KEY);
  };

  const setSiteName = (name: string) => {
    setSiteNameState(name);
    localStorage.setItem(SITE_NAME_KEY, name);
  };

  return (
    <SiteSettingsContext.Provider value={{ logoUrl, siteName, setLogoUrl, setSiteName }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
