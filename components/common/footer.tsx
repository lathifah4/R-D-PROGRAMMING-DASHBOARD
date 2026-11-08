"use client";

import { useSyncExternalStore } from "react";
import { DialogTrigger } from "@/components/ui/dialog";

const subscribe = () => () => {};

export default function Footer() {
    const year = useSyncExternalStore(subscribe, () => new Date().getFullYear(), () => null);

    return (
        <footer className="dashboard-footer">
            <div className="dashboard-footer-org">INEWS Media Group <span>Integrated Media Performance</span></div>
            <div className="flex flex-wrap items-center justify-center gap-2 ">
                <p>© {year ?? "2026"} iNews. All rights reserved.</p>
            </div>
        </footer>
    );
}
