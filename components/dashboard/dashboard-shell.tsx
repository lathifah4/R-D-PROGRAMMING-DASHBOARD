"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DashboardProvider, useDashboard } from "./dashboard-context";
import { FiltersBar } from "./filters-bar";
import { ThemeToggle } from "@/components/common/theme-toggle";
import Navbar from "../common/navbar";
import { usePathname } from "next/navigation";
type DashboardShellProps = { children: ReactNode; footers: Record<string, ReactNode> };

export function DashboardShell({ children, footers }: DashboardShellProps) {
  return (
    <DashboardProvider>
      <DashboardFrame footers={footers}>{children}</DashboardFrame>
    </DashboardProvider>
  );
}

function DashboardFrame({ children, footers }: DashboardShellProps) {
  const topbar = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { period } = useDashboard();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setStuck((current) => current
        ? scrollY > 0
        : scrollY > (topbar.current?.offsetHeight ?? 160));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="dashboard-wrap">
      <a href="#main-content" className="skip-link">Langsung ke konten</a>
      <div ref={topbar} className={`dashboard-topbar${stuck ? " is-stuck" : ""}`}>
        <header className="dashboard-head">
          <div>
            <div className="dashboard-eyebrow">INEWS Media Group</div>
            <div className="dashboard-title"><span>Integrated</span> Media Performance</div>
          </div>
          <div className="dashboard-head-actions">
            <div className="dashboard-period" aria-live="polite">{period || "TV & Digital"}</div>
            <ThemeToggle />
          </div>
        </header>
        <Navbar />
      </div>
      <main id="main-content" className="dashboard-layer" tabIndex={-1}>
        {!pathname.startsWith("/data-tv") && pathname !== "/content" && <FiltersBar />}
        {children}
      </main>
      {footers[pathname]}
    </div>
  );
}
