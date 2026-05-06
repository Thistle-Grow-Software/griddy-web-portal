import { Alert, Badge, Skeleton, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import { useGamePlayByPlay } from "../hooks";
import type { Drive, Play } from "../types";

const PLAY_HEIGHT = 60;
const DRIVE_HEADER_HEIGHT = 56;
const VIEWPORT = 600;

type Row = { kind: "drive-header"; drive: Drive } | { kind: "play"; play: Play; driveId: string };

function flatten(drives: Drive[]): Row[] {
	const rows: Row[] = [];
	for (const drive of drives) {
		rows.push({ kind: "drive-header", drive });
		for (const play of drive.plays) {
			rows.push({ kind: "play", play, driveId: drive.id });
		}
	}
	return rows;
}

function PlayRow({ play }: { play: Play }) {
	return (
		<div
			data-testid={`play-${play.id}`}
			style={{
				display: "grid",
				gridTemplateColumns: "70px 90px 1fr 60px",
				gap: 12,
				alignItems: "center",
				padding: "8px 12px",
				borderBottom: "1px solid var(--mantine-color-default-border)",
				background: play.scoringPlay ? "var(--mantine-color-yellow-light)" : undefined,
			}}
		>
			<Text size="xs" c="dimmed">
				Q{play.quarter} {play.gameClock}
			</Text>
			<Text size="xs">
				{play.down !== null && play.distance !== null ? `${play.down} & ${play.distance}` : "—"}
			</Text>
			<Text size="sm">{play.description}</Text>
			<Text
				size="sm"
				ta="right"
				c={play.yards && play.yards > 0 ? "teal" : play.yards && play.yards < 0 ? "red" : undefined}
			>
				{play.yards !== null ? `${play.yards > 0 ? "+" : ""}${play.yards}` : "—"}
			</Text>
		</div>
	);
}

function DriveHeader({ drive }: { drive: Drive }) {
	return (
		<div
			data-testid={`drive-header-${drive.id}`}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 12,
				padding: "12px",
				background: "var(--mantine-color-default-hover)",
				borderTop: "2px solid var(--mantine-color-default-border)",
				borderBottom: "1px solid var(--mantine-color-default-border)",
			}}
		>
			<Badge variant="filled" size="sm">
				Q{drive.quarter}
			</Badge>
			<Text size="sm" fw={600}>
				{drive.possessionTeamName}
			</Text>
			<Text size="xs" c="dimmed">
				started {drive.startClock}
			</Text>
			<Text size="xs" ml="auto" fw={600}>
				{drive.outcome}
			</Text>
		</div>
	);
}

export function PlayByPlayTab({ gameId, active }: { gameId: string; active: boolean }) {
	const query = useGamePlayByPlay(gameId, active);
	const parentRef = useRef<HTMLDivElement>(null);

	const rows = useMemo(() => (query.data ? flatten(query.data.drives) : []), [query.data]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: (index) =>
			rows[index]?.kind === "drive-header" ? DRIVE_HEADER_HEIGHT : PLAY_HEIGHT,
		overscan: 8,
	});

	if (query.isLoading) {
		return <Skeleton height={VIEWPORT} radius="sm" data-testid="pbp-skeleton" />;
	}
	if (query.isError) {
		return (
			<Alert color="yellow" icon={<IconAlertCircle size={16} />} title="No play-by-play available">
				This game hasn't started, or play-by-play isn't ready yet.
			</Alert>
		);
	}
	if (!query.data || rows.length === 0) return null;

	const totalPlays = query.data.drives.reduce((sum, d) => sum + d.plays.length, 0);

	return (
		<Stack gap="sm" data-testid="play-by-play">
			<Text size="sm" c="dimmed">
				{query.data.drives.length} drives · {totalPlays} plays
			</Text>
			<div
				ref={parentRef}
				style={{
					height: VIEWPORT,
					overflow: "auto",
					contain: "strict",
					border: "1px solid var(--mantine-color-default-border)",
					borderRadius: 4,
				}}
				data-testid="pbp-scroll"
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
								data-index={vRow.index}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									height: `${vRow.size}px`,
									transform: `translateY(${vRow.start}px)`,
								}}
							>
								{row.kind === "drive-header" ? (
									<DriveHeader drive={row.drive} />
								) : (
									<PlayRow play={row.play} />
								)}
							</div>
						);
					})}
				</div>
			</div>
		</Stack>
	);
}
