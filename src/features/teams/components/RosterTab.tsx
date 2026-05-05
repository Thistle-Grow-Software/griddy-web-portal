import { Center, Loader, Skeleton, Table, UnstyledButton } from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconArrowsSort } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTeamRoster } from "../hooks";
import type { RosterPlayer } from "../types";
import { EmptyState } from "./EmptyState";

type SortKey = "jersey" | "name" | "position";
type SortDir = "asc" | "desc";

function compare(a: RosterPlayer, b: RosterPlayer, key: SortKey): number {
	switch (key) {
		case "jersey":
			return (a.jersey ?? Number.POSITIVE_INFINITY) - (b.jersey ?? Number.POSITIVE_INFINITY);
		case "name":
			return a.name.localeCompare(b.name);
		case "position":
			return a.position.localeCompare(b.position);
	}
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
	if (!active) return <IconArrowsSort size={14} aria-hidden="true" />;
	return dir === "asc" ? (
		<IconArrowUp size={14} aria-hidden="true" />
	) : (
		<IconArrowDown size={14} aria-hidden="true" />
	);
}

export function RosterTab({ teamId, active }: { teamId: string; active: boolean }) {
	const { data, isLoading, isError, error } = useTeamRoster(teamId, active);
	const [sortKey, setSortKey] = useState<SortKey>("jersey");
	const [sortDir, setSortDir] = useState<SortDir>("asc");

	const sorted = useMemo(() => {
		if (!data) return [];
		const copy = data.slice();
		copy.sort((a, b) => compare(a, b, sortKey) * (sortDir === "asc" ? 1 : -1));
		return copy;
	}, [data, sortKey, sortDir]);

	function toggleSort(next: SortKey) {
		if (sortKey === next) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(next);
			setSortDir("asc");
		}
	}

	if (isLoading) {
		return (
			<Center mih={120}>
				<Loader size="sm" />
			</Center>
		);
	}
	if (isError) {
		return <EmptyState title="Couldn't load roster" description={(error as Error).message} />;
	}
	if (!data || data.length === 0) {
		return <EmptyState title="No roster information available" />;
	}

	const header = (key: SortKey, label: string) => (
		<Table.Th>
			<UnstyledButton
				onClick={() => toggleSort(key)}
				aria-label={`Sort by ${label}`}
				style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
			>
				<span>{label}</span>
				<SortIcon active={sortKey === key} dir={sortDir} />
			</UnstyledButton>
		</Table.Th>
	);

	return (
		<Table striped highlightOnHover withTableBorder verticalSpacing="xs">
			<Table.Thead>
				<Table.Tr>
					{header("jersey", "#")}
					{header("name", "Name")}
					{header("position", "Pos")}
					<Table.Th>Ht</Table.Th>
					<Table.Th>Wt</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{sorted.map((player) => (
					<Table.Tr key={player.id}>
						<Table.Td>{player.jersey ?? "—"}</Table.Td>
						<Table.Td>
							<Link
								to="/players/$playerId"
								params={{ playerId: player.id }}
								style={{ color: "inherit" }}
							>
								{player.name}
							</Link>
						</Table.Td>
						<Table.Td>{player.position}</Table.Td>
						<Table.Td>
							{player.heightInches !== null
								? `${Math.floor(player.heightInches / 12)}'${player.heightInches % 12}"`
								: "—"}
						</Table.Td>
						<Table.Td>{player.weightPounds ?? "—"}</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}

export function RosterTabSkeleton() {
	return <Skeleton height={300} radius="sm" animate={false} data-testid="roster-tab-skeleton" />;
}
