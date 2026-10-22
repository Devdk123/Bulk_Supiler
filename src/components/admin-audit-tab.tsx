"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

type AuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

export function AdminAuditTab() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(t("admin.auditDescription"));
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadLogs();
    });
    return () => { active = false; };
  }, [loadLogs]);

  return (
    <Card className="mt-6 rounded-3xl border border-border bg-card shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">
              {t("admin.auditTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("admin.auditDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="rounded-xl gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{t("admin.refreshLogs")}</span>
          </Button>
        </div>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        {loading && logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {t("admin.loadingLogs")}
          </div>
        ) : null}

        {!loading && logs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            {t("admin.noLogs")}
          </div>
        ) : null}

        {logs.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50 font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3">{t("admin.columns.0")}</th>
                  <th className="py-3 px-3">{t("admin.columns.1")}</th>
                  <th className="py-3 px-3">{t("admin.columns.2")}</th>
                  <th className="py-3 px-3">{t("admin.columns.3")}</th>
                  <th className="py-3 px-3">{t("admin.columns.4")}</th>
                  <th className="py-3 px-3">{t("admin.columns.5")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20">
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-muted-foreground capitalize">
                      {log.entity_type}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                      {log.entity_id ? log.entity_id.slice(0, 8) + "..." : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
