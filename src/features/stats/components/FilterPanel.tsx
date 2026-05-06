import { Group, MultiSelect, NumberInput, Select, Stack, Switch, TextInput } from "@mantine/core";
import type { FilterDef, FilterValue, FilterValues } from "../types";

function defaultValueFor(def: FilterDef): FilterValue {
	switch (def.kind) {
		case "select":
			return { kind: "select", value: null };
		case "multiselect":
			return { kind: "multiselect", values: [] };
		case "text":
			return { kind: "text", value: "" };
		case "boolean":
			return { kind: "boolean", value: false };
		case "number-range":
			return { kind: "number-range", min: null, max: null };
	}
}

export function getOrInit(values: FilterValues, def: FilterDef): FilterValue {
	return values[def.id] ?? defaultValueFor(def);
}

export function FilterPanel({
	defs,
	values,
	onChange,
}: {
	defs: FilterDef[];
	values: FilterValues;
	onChange: (next: FilterValues) => void;
}) {
	const setOne = (id: string, next: FilterValue) => onChange({ ...values, [id]: next });

	return (
		<Stack gap="sm" data-testid="filter-panel">
			<Group align="end" wrap="wrap" gap="md">
				{defs.map((def) => {
					const current = getOrInit(values, def);
					switch (def.kind) {
						case "select": {
							const v = current.kind === "select" ? current.value : null;
							return (
								<Select
									key={def.id}
									aria-label={def.label}
									label={def.label}
									data={def.options ?? []}
									value={v}
									onChange={(next) => setOne(def.id, { kind: "select", value: next })}
									clearable
									w={160}
								/>
							);
						}
						case "multiselect": {
							const v = current.kind === "multiselect" ? current.values : [];
							return (
								<MultiSelect
									key={def.id}
									aria-label={def.label}
									label={def.label}
									data={def.options ?? []}
									value={v}
									onChange={(next) => setOne(def.id, { kind: "multiselect", values: next })}
									clearable
									searchable
									w={220}
									comboboxProps={{ withinPortal: true }}
								/>
							);
						}
						case "text": {
							const v = current.kind === "text" ? current.value : "";
							return (
								<TextInput
									key={def.id}
									aria-label={def.label}
									label={def.label}
									placeholder={def.placeholder}
									value={v}
									onChange={(e) => setOne(def.id, { kind: "text", value: e.currentTarget.value })}
									w={180}
								/>
							);
						}
						case "boolean": {
							const v = current.kind === "boolean" ? current.value : false;
							return (
								<Switch
									key={def.id}
									aria-label={def.label}
									label={def.label}
									checked={v}
									onChange={(e) =>
										setOne(def.id, { kind: "boolean", value: e.currentTarget.checked })
									}
								/>
							);
						}
						case "number-range": {
							const v =
								current.kind === "number-range"
									? current
									: { kind: "number-range" as const, min: null, max: null };
							return (
								<Group key={def.id} gap={4} align="end">
									<NumberInput
										aria-label={`${def.label} min`}
										label={`${def.label} min`}
										value={v.min ?? ""}
										onChange={(next) =>
											setOne(def.id, {
												kind: "number-range",
												min: typeof next === "number" ? next : null,
												max: v.max,
											})
										}
										w={100}
									/>
									<NumberInput
										aria-label={`${def.label} max`}
										label="max"
										value={v.max ?? ""}
										onChange={(next) =>
											setOne(def.id, {
												kind: "number-range",
												min: v.min,
												max: typeof next === "number" ? next : null,
											})
										}
										w={100}
									/>
								</Group>
							);
						}
					}
				})}
			</Group>
		</Stack>
	);
}
