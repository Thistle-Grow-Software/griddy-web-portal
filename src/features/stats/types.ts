// Local domain types for the stats query builder. Will be replaced by the
// generated client once the real /api/stats/query/ endpoint lands.

export const ENTITIES = ["plays", "players", "teams", "games"] as const;
export type Entity = (typeof ENTITIES)[number];

export type FilterKind = "select" | "multiselect" | "text" | "boolean" | "number-range";

export type FilterDef = {
	id: string;
	label: string;
	kind: FilterKind;
	/** For select / multiselect: the option list. */
	options?: { value: string; label: string }[];
	/** Optional placeholder for text inputs. */
	placeholder?: string;
};

export type FilterValues = Record<string, FilterValue>;

export type FilterValue =
	| { kind: "select"; value: string | null }
	| { kind: "multiselect"; values: string[] }
	| { kind: "text"; value: string }
	| { kind: "boolean"; value: boolean }
	| { kind: "number-range"; min: number | null; max: number | null };

export type ColumnDef = {
	id: string;
	label: string;
	/** Whether the column can be picked as a sort key. */
	sortable?: boolean;
	/** Optional cell formatter. Receives the raw cell value. */
	format?: (value: unknown) => string;
	/** Right-align numeric columns. */
	numeric?: boolean;
	/** Pixel min-width hint for the table grid. */
	minWidth?: number;
};

export type EntityRegistry = {
	entity: Entity;
	label: string;
	description: string;
	filters: FilterDef[];
	columns: ColumnDef[];
	/** Default columns selected on first load (id list). */
	defaultColumns: string[];
	/** Default sort key id and direction. */
	defaultSort: { id: string; direction: "asc" | "desc" };
};

export type StatsQueryParams = {
	entity: Entity;
	filters: FilterValues;
	sort: { id: string; direction: "asc" | "desc" };
	page?: number;
	pageSize?: number;
};

export type StatsQueryResult = {
	entity: Entity;
	count: number;
	page: number;
	pageSize: number;
	results: Record<string, unknown>[];
	queryMs: number;
};
