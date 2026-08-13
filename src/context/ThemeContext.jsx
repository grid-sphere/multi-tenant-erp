import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("schoolDarkMode") === "true"; }
    catch { return false; }
  });

  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem("schoolLanguage") || "English"; }
    catch { return "English"; }
  });

  // "modern" (Slate & Teal, default) or "classic" (the older blue/purple/teal palette)
  const [palette, setPalette] = useState(() => {
    try { return localStorage.getItem("schoolPalette") || "modern"; }
    catch { return "modern"; }
  });

  // Apply or remove the 'dark' class on <html>
  const applyDarkMode = useCallback((isDark) => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    // Force a repaint by accessing a DOM property (no unused expression)
    void document.body.offsetHeight;
  }, []);

  // Apply or remove the 'classic' class on <html>
  const applyPalette = useCallback((p) => {
    const html = document.documentElement;
    if (p === "classic") {
      html.classList.add('classic');
    } else {
      html.classList.remove('classic');
    }
  }, []);

  // Run whenever darkMode changes
  useEffect(() => {
    applyDarkMode(darkMode);
    try { localStorage.setItem("schoolDarkMode", String(darkMode)); } catch {}
  }, [darkMode, applyDarkMode]);

  // Run whenever palette changes
  useEffect(() => {
    applyPalette(palette);
    try { localStorage.setItem("schoolPalette", palette); } catch {}
  }, [palette, applyPalette]);

  // Sync language to localStorage
  useEffect(() => {
    try { localStorage.setItem("schoolLanguage", language); } catch {}
  }, [language]);

  // On mount, ensure classes match stored preferences
  useEffect(() => {
    applyDarkMode(darkMode);
    applyPalette(palette);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const toggleLanguage = (lang) => setLanguage(lang);

  const toggleClassicPalette = () => {
    setPalette(prev => (prev === "classic" ? "modern" : "classic"));
  };

  return (
    <ThemeContext.Provider value={{
      darkMode, setDarkMode, toggleDarkMode,
      language, setLanguage, toggleLanguage,
      palette, setPalette, toggleClassicPalette,
      isClassicPalette: palette === "classic",
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);