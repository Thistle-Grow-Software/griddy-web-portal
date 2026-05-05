import { Badge, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { PlayerKeyStats, PlayerSummary } from "../types";

const ROW_HEIGHT = 48;
const TABLE_HEIGHT = 600;

function formatStat(value: number | undefined): string {
	if (value === undefined || value === null) return "—";
	return value.toLocaleString();
}

/**
 * Picks the most relevant 1–2 stats for the row's position so the column
 * stays scannable instead of dumping every key/value.
 */
function statSummary(stats: PlayerKeyStats): string {
	if (stats.passYards !== undefined) {
		return `${formatStat(stats.passYards)} pass yds · ${formatStat(stats.passTds)} TD`;
	}
	if (stats.rushYards !== undefined && stats.recYards === undefined) {
		return `${formatStat(stats.rushYards)} rush yds · ${formatStat(stats.rushTds)} TD`;
	}
	if (stats.recYards !== undefined) {
		return `${formatStat(stats.receptions)} rec · ${formatStat(stats.recYards)} yds`;
	}
	if (stats.tackles !== undefined) {
		return `${formatStat(stats.tackles)} tkl · ${formatStat(stats.sacks)} sacks`;
	}
	return "—";
}

export function VirtualPlayerTable({ players }: { players: PlayerSummary[] }) {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: players.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 8,
	});

	return (
		<div aria-label="Players" data-testid="player-table">
			<div
				style={{
					display: "grid",
					gridTemplateColumns:
						"minmax(180px, 2fr) 60px minmax(160px, 1.5fr) minmax(180px, 2fr) 80px",
					gap: 12,
					padding: "8px 12px",
					borderBottom: "1px solid var(--mantine-color-default-border)",
					fontWeight: 600,
					fontSize: "0.85rem",
				}}
			>
				<div>Name</div>
				<div>Pos</div>
				<div>Team</div>
				<div>2025 stats</div>
				<div>Status</div>
			</div>
			<div
				ref={parentRef}
				style={{
					height: TABLE_HEIGHT,
					overflow: "auto",
					contain: "strict",
				}}
				data-testid="player-table-scroll"
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: "100%",
						position: "relative",
					}}
				>
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const player = players[virtualRow.index];
						return (
							<div
								key={player.id}
								data-testid={`player-row-${player.id}`}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start}px)`,
									display: "grid",
									gridTemplateColumns:
										"minmax(180px, 2fr) 60px minmax(160px, 1.5fr) minmax(180px, 2fr) 80px",
									gap: 12,
									padding: "8px 12px",
									alignItems: "center",
									borderBottom: "1px solid var(--mantine-color-default-border)",
								}}
							>
								<div>
									<Link
										to="/players/$playerId"
										params={{ playerId: player.id }}
										style={{ color: "inherit", fontWeight: 500 }}
									>
										{player.name}
									</Link>
								</div>
								<div>
									<Badge size="sm" variant="light">
										{player.position}
									</Badge>
								</div>
								<div>
									<Group gap={6} wrap="nowrap">
										<Badge size="xs" variant="outline">
											{player.league}
										</Badge>
										<Text size="sm" truncate>
											{player.teamName}
										</Text>
									</Group>
								</div>
								<div>
									<Text size="sm" c="dimmed">
										{statSummary(player.keyStats)}
									</Text>
								</div>
								<div>
									{player.active ? (
										<Badge size="xs" color="green" variant="light">
											Active
										</Badge>
									) : (
										<Badge size="xs" color="gray" variant="light">
											Inactive
										</Badge>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
