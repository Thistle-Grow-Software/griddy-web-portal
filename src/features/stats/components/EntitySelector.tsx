import { SegmentedControl } from "@mantine/core";
import { REGISTRY } from "../registry";
import { ENTITIES, type Entity } from "../types";

export function EntitySelector({
	value,
	onChange,
}: {
	value: Entity;
	onChange: (next: Entity) => void;
}) {
	const data = ENTITIES.map((e) => ({ value: e, label: REGISTRY[e].label }));
	return (
		<SegmentedControl
			aria-label="Entity selector"
			value={value}
			onChange={(next) => onChange(next as Entity)}
			data={data}
		/>
	);
}
