import { Group, SegmentedControl, Select } from "@mantine/core";
import type { ColumnDef } from "../types";

export function SortControl({
	columns,
	sortId,
	direction,
	onChange,
}: {
	columns: ColumnDef[];
	sortId: string;
	direction: "asc" | "desc";
	onChange: (next: { id: string; direction: "asc" | "desc" }) => void;
}) {
	const sortable = columns.filter((c) => c.sortable);
	const data = sortable.map((c) => ({ value: c.id, label: c.label }));

	return (
		<Group gap="sm" align="end">
			<Select
				aria-label="Sort by"
				label="Sort by"
				data={data}
				value={sortId}
				onChange={(next) => {
					if (next) onChange({ id: next, direction });
				}}
				w={180}
				allowDeselect={false}
			/>
			<SegmentedControl
				aria-label="Sort direction"
				value={direction}
				onChange={(next) => onChange({ id: sortId, direction: next === "asc" ? "asc" : "desc" })}
				data={[
					{ value: "desc", label: "↓ Desc" },
					{ value: "asc", label: "↑ Asc" },
				]}
			/>
		</Group>
	);
}
