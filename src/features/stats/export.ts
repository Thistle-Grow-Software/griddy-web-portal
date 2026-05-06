import type { ColumnDef, Entity } from "./types";

/**
 * Builds a filename like `plays-2026-04-20T15-30.csv`. Colons aren't legal
 * on Windows, so the timestamp uses hyphens.
 */
export function buildExportFilename(entity: Entity, ext: "csv" | "xlsx", now = new Date()): string {
	const stamp = now.toISOString().replace(/:/g, "-").split(".")[0];
	return `${entity}-${stamp}.${ext}`;
}

function escapeCsvCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	const str = typeof value === "string" ? value : String(value);
	// Quote when the cell contains a delimiter, quote, or newline.
	if (/[",\n\r]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Builds CSV text from rows + the active column selection, in the order
 * given by `columns`. Header row uses the column labels. Rows with extra
 * fields not in `columns` are dropped — the export must respect the user's
 * column picker selection.
 */
export function buildCsv(rows: Record<string, unknown>[], columns: ColumnDef[]): string {
	const lines: string[] = [];
	lines.push(columns.map((c) => escapeCsvCell(c.label)).join(","));
	for (const row of rows) {
		lines.push(columns.map((c) => escapeCsvCell(row[c.id])).join(","));
	}
	// Trailing newline so POSIX tools don't complain.
	return `${lines.join("\n")}\n`;
}

function triggerDownload(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	// Defer revoke until after the click handler has consumed the URL.
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCsv(
	entity: Entity,
	rows: Record<string, unknown>[],
	columns: ColumnDef[],
): void {
	const csv = buildCsv(rows, columns);
	const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
	triggerDownload(buildExportFilename(entity, "csv"), blob);
}

/**
 * XLSX export. SheetJS is dynamic-imported so the ~400 KB module isn't in
 * the initial bundle — only users who actually click "Download Excel" pay
 * the cost.
 */
export async function downloadXlsx(
	entity: Entity,
	rows: Record<string, unknown>[],
	columns: ColumnDef[],
): Promise<void> {
	const xlsx = await import("xlsx");
	const data: unknown[][] = [
		columns.map((c) => c.label),
		...rows.map((row) => columns.map((c) => row[c.id] ?? "")),
	];
	const sheet = xlsx.utils.aoa_to_sheet(data);
	const workbook = xlsx.utils.book_new();
	xlsx.utils.book_append_sheet(workbook, sheet, entity);
	const buffer = xlsx.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
	const blob = new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	triggerDownload(buildExportFilename(entity, "xlsx"), blob);
}
