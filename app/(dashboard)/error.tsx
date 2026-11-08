"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="flex min-h-45 flex-col items-center justify-center gap-2.5 px-5 py-9 text-center text-zinc-500">
      <h2 className="text-xs font-medium text-zinc-800">
        Dashboard belum dapat dimuat
      </h2>
      <p className="max-w-75 text-2xs leading-relaxed">
        Muat ulang data untuk membuka dashboard kembali.
      </p>
      <Button className="mt-1" onClick={retry}>
        Coba lagi
      </Button>
    </div>
  );
}
