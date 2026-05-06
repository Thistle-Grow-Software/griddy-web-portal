import { Text } from "@mantine/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import type { ColumnDef } from "../types";

const ROW_HEIGHT = 36;
const TABLE_HEIGHT = 600;

function cellText(value: unknown, column: ColumnDef): string {
	if (column.format) return column.format(value);
	if (value === null || value === undefined) return "—";
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString() : "—";
	return String(value);
}

export function ResultsTable({
	rows,
	columns,
}: {
	rows: Record<string, unknown>[];
	columns: ColumnDef[];
}) {
	const parentRef = useRef<HTMLDivElement>(null);

	const gridTemplateColumns = useMemo(
		() => columns.map((c) => `minmax(${c.minWidth ?? 100}px, 1fr)`).join(" "),
		[columns],
	);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 12,
	});

	return (
		<div data-testid="results-table" aria-label="Results">
			<div
				style={{
					display: "grid",
					gridTemplateColumns,
					gap: 8,
					padding: "8px 12px",
					borderBottom: "1px solid var(--mantine-color-default-border)",
					fontWeight: 600,
					fontSize: "0.85rem",
					background: "var(--mantine-color-default-hover)",
				}}
			>
				{columns.map((c) => (
					<div key={c.id} style={{ textAlign: c.numeric ? "right" : "left" }}>
						{c.label}
					</div>
				))}
			</div>
			<div
				ref={parentRef}
				style={{
					height: TABLE_HEIGHT,
					overflow: "auto",
					contain: "strict",
					border: "1px solid var(--mantine-color-default-border)",
				}}
				data-testid="results-table-scroll"
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: "100%",
						position: "relative",
					}}
				>
					{virtualizer.getVirtualItems().map((vRow) => {
						const row = rows[vRow.index];
						return (
							<div
								key={vRow.key}
								data-testid={`row-${vRow.index}`}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									height: `${vRow.size}px`,
									transform: `translateY(${vRow.start}px)`,
									display: "grid",
									gridTemplateColumns,
									gap: 8,
									padding: "6px 12px",
									alignItems: "center",
									borderBottom: "1px solid var(--mantine-color-default-border)",
								}}
							>
								{columns.map((c) => (
									<Text key={c.id} size="sm" ta={c.numeric ? "right" : "left"} truncate>
										{cellText(row?.[c.id], c)}
									</Text>
								))}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
