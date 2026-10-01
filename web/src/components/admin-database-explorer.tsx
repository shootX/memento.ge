"use client";

import type { AdminDatabaseSnapshot } from "@/lib/admin-database-explorer";

export function AdminDatabaseExplorer({ snapshot }: { snapshot: AdminDatabaseSnapshot | null }) {
  if (!snapshot) {
    return (
      <p className="text-[var(--text-muted)]" data-testid="admin-db-explorer-loading">
        იტვირთება…
      </p>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-db-explorer">
      <p className="text-sm text-[var(--text-muted)]">
        ბოლო განახლება:{" "}
        <time suppressHydrationWarning>
          {new Date(snapshot.capturedAt).toLocaleString("ka-GE")}
        </time>
        {" · "}
        საიდუმლევები და ჰეშები არ ჩანს.
      </p>
      {snapshot.tables.map((table) => (
        <section key={table.key} className="card-chunky overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-pink-100 bg-pink-50/80 px-4 py-3">
            <h2 className="font-extrabold">{table.label}</h2>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[var(--pink)]">
              {table.count} ჩანაწერი
            </span>
          </div>
          {table.hideRows ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">
              უსაფრთხოებისთვის ჩანაწერები არ ჩანს — მხოლოდ რაოდენობა.
            </p>
          ) : table.rows.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">ცარიელი</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-pink-50">
                    {Object.keys(table.rows[0]).map((col) => (
                      <th key={col} className="p-2 font-bold text-[var(--text-muted)]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i} className="border-t border-pink-50/80 align-top">
                      {Object.keys(table.rows[0]).map((col) => (
                        <td key={col} className="max-w-[14rem] break-words p-2 font-mono">
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
