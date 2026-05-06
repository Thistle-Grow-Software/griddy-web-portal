import { MultiSelect } from "@mantine/core";
import type { ColumnDef } from "../types";

export function ColumnPicker({
	columns,
	selected,
	onChange,
}: {
	columns: ColumnDef[];
	selected: string[];
	onChange: (next: string[]) => void;
}) {
	const data = columns.map((c) => ({ value: c.id, label: c.label }));
	return (
		<MultiSelect
			aria-label="Columns"
			label="Columns"
			data={data}
			value={selected}
			onChange={onChange}
			searchable
			clearable
			w={320}
			comboboxProps={{ withinPortal: true }}
		/>
	);
}
