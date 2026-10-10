"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherSettingsAlias() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/settings");
  }, [router]);
  return (
    <div className="p-8 text-sm text-[var(--text-muted)]">Opening settings...</div>
  );
}
