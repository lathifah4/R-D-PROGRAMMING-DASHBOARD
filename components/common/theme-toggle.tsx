"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function useDarkTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ThemeToggle() {
  const dark = useDarkTheme();
  const label = dark ? "Aktifkan tema terang" : "Aktifkan tema gelap";
  return <button
    type="button"
    className="dashboard-theme-toggle"
    aria-label="Tema gelap"
    aria-pressed={dark}
    title={label}
    onClick={() => {
      document.documentElement.classList.toggle("dark", !dark);
      try { localStorage.setItem("inews-theme", dark ? "light" : "dark"); } catch {}
    }}
  >
    {dark ? <SunIcon size={21} aria-hidden="true" /> : <MoonIcon size={21} aria-hidden="true" />}
  </button>;
}
