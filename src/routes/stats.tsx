import { ColumnPicker } from "@/features/stats/components/ColumnPicker";
import { EntitySelector } from "@/features/stats/components/EntitySelector";
import { ExportButton } from "@/features/stats/components/ExportButton";
import { FilterPanel } from "@/features/stats/components/FilterPanel";
import { ResultsTable } from "@/features/stats/components/ResultsTable";
import { SortControl } from "@/features/stats/components/SortControl";
import { downloadCsv, downloadXlsx } from "@/features/stats/export";
import { useStatsQuery } from "@/features/stats/hooks";
import { REGISTRY } from "@/features/stats/registry";
import { ENTITIES, type Entity, type FilterValues } from "@/features/stats/types";
import { EmptyState } from "@/features/teams/components/EmptyState";
import { requireAuth } from "@/lib/auth-guard";
import { track } from "@/observability/analytics";
import { Alert, Badge, Button, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconBolt } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 500;

function isEntity(value: unknown): value is Entity {
	return typeof value === "string" && (ENTITIES as readonly string[]).includes(value);
}

export const Route = createFileRoute("/stats")({
	beforeLoad: requireAuth,
	component: StatsRoute,
	// `entity` is the only thing we keep in the URL — the rest of the staged
	// query lives in component state until the user hits "Apply", at which
	// point the React Query cache key carries it forward. Saving every chip
	// to the URL would re-trigger validation on each keystroke for no gain.
	validateSearch: (search: Record<string, unknown>) => ({
		entity: isEntity(search.entity) ? search.entity : ("plays" as Entity),
	}),
});

function StatsRoute() {
	const { entity } = Route.useSearch();
	const navigate = Route.useNavigate();
	const reg = REGISTRY[entity];

	// Staged (in-progress) query — what the controls drive. Applied query
	// gets copied here on entity change and on every "Apply" click.
	const [staged, setStaged] = useState<{
		filters: FilterValues;
		sort: { id: string; direction: "asc" | "desc" };
		columns: string[];
	}>(() => ({
		filters: {},
		sort: reg.defaultSort,
		columns: reg.defaultColumns,
	}));

	const [applied, setApplied] = useState(staged);

	// When the entity changes via URL, reset both staged + applied to the new
	// entity's defaults — column ids etc. don't transfer across entities.
	const entityRef = useRef(entity);
	useEffect(() => {
		if (entityRef.current === entity) return;
		entityRef.current = entity;
		const next = {
			filters: {} as FilterValues,
			sort: REGISTRY[entity].defaultSort,
			columns: REGISTRY[entity].defaultColumns,
		};
		setStaged(next);
		setApplied(next);
	}, [entity]);

	const queryParams = useMemo(
		() => ({
			entity,
			filters: applied.filters,
			sort: applied.sort,
			page: 1,
			pageSize: PAGE_SIZE,
		}),
		[entity, applied.filters, applied.sort],
	);

	const query = useStatsQuery(queryParams);

	const rows = query.data?.results ?? [];
	const visibleColumns = useMemo(
		() => reg.columns.filter((c) => applied.columns.includes(c.id)),
		[reg.columns, applied.columns],
	);

	const apply = () => {
		setApplied(staged);
		track("stats.filter_applied", {
			entity,
			filter_count: Object.keys(staged.filters).filter((k) => stagedHasValue(staged.filters[k]))
				.length,
			sort: staged.sort.id,
			direction: staged.sort.direction,
			column_count: staged.columns.length,
		});
	};

	const handleExport = async (format: "csv" | "xlsx") => {
		if (format === "csv") {
			downloadCsv(entity, rows, visibleColumns);
		} else {
			await downloadXlsx(entity, rows, visibleColumns);
		}
		track("stats.exported", {
			entity,
			format,
			row_count: rows.length,
			column_count: visibleColumns.length,
		});
	};

	return (
		<Stack gap="lg">
			<Stack gap={4}>
				<Title order={2}>Stats query builder</Title>
				<Text c="dimmed">
					Build a filter on plays, players, teams, or games. Run it, scan results, export.
				</Text>
			</Stack>

			<EntitySelector value={entity} onChange={(next) => navigate({ search: { entity: next } })} />

			<Text size="sm" c="dimmed">
				{reg.description}
			</Text>

			<FilterPanel
				defs={reg.filters}
				values={staged.filters}
				onChange={(next) => setStaged((s) => ({ ...s, filters: next }))}
			/>

			<Group align="end" wrap="wrap" gap="md">
				<SortControl
					columns={reg.columns}
					sortId={staged.sort.id}
					direction={staged.sort.direction}
					onChange={(next) => setStaged((s) => ({ ...s, sort: next }))}
				/>
				<ColumnPicker
					columns={reg.columns}
					selected={staged.columns}
					onChange={(next) => setStaged((s) => ({ ...s, columns: next }))}
				/>
				<Button
					leftSection={<IconBolt size={14} />}
					onClick={apply}
					data-testid="apply-button"
					loading={query.isFetching && !query.isPlaceholderData}
				>
					Apply
				</Button>
				<ExportButton disabled={query.isLoading || rows.length === 0} onExport={handleExport} />
			</Group>

			<Group gap="xs">
				<Badge variant="light" color="blue" data-testid="result-count">
					{(query.data?.count ?? 0).toLocaleString()} rows
				</Badge>
				{query.data ? (
					<Badge variant="light" color="gray">
						{query.data.queryMs} ms
					</Badge>
				) : null}
				{query.isFetching && query.isPlaceholderData ? (
					<Badge variant="light" color="yellow">
						Refreshing…
					</Badge>
				) : null}
			</Group>

			{query.isError ? (
				<Alert color="red" icon={<IconAlertCircle size={16} />} title="Query failed">
					{(query.error as Error).message}
				</Alert>
			) : query.isLoading ? (
				<Skeleton height={600} radius="sm" data-testid="results-skeleton" />
			) : rows.length === 0 ? (
				<EmptyState
					title="No results"
					description="No rows match the current filters. Loosen them and re-apply."
				/>
			) : (
				<ResultsTable rows={rows} columns={visibleColumns} />
			)}
		</Stack>
	);
}

function stagedHasValue(value: FilterValues[string] | undefined): boolean {
	if (!value) return false;
	switch (value.kind) {
		case "select":
			return value.value !== null;
		case "multiselect":
			return value.values.length > 0;
		case "text":
			return value.value.trim() !== "";
		case "boolean":
			return value.value === true;
		case "number-range":
			return value.min !== null || value.max !== null;
	}
}
