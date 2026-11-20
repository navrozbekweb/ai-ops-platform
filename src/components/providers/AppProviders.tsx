"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme as antdTheme } from "antd";

import { THEME_COOKIE, type ThemePreference } from "@/lib/theme";

type Resolved = "light" | "dark";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: Resolved;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme AppProviders ichida ishlatilishi kerak");
  return ctx;
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function AppProviders({
  children,
  initialPreference,
}: {
  children: React.ReactNode;
  initialPreference: ThemePreference;
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  // Server faqat aniq tanlovni biladi. "system" bo'lsa, brauzerda aniqlanadi.
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const resolved: Resolved =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.classList.toggle(
      "dark",
      value === "dark" || (value === "system" && systemPrefersDark()),
    );
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext value={value}>
      <AntdRegistry layer>
        <ConfigProvider
          theme={{
            algorithm:
              resolved === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              colorPrimary: "#2563eb",
              borderRadius: 8,
              fontFamily: "'Inter Variable', system-ui, sans-serif",
              ...(resolved === "dark"
                ? {
                    colorBgContainer: "#171a22",
                    colorBgElevated: "#171a22",
                    colorBorder: "#272c38",
                  }
                : {}),
            },
          }}
        >
          {children}
        </ConfigProvider>
      </AntdRegistry>
    </ThemeContext>
  );
}
