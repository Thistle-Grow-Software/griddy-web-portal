import { Alert, Skeleton, Stack, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useGameBoxScore } from "../hooks";
import type { BoxScorePlayerLine, BoxScoreSide } from "../types";

function formatStat(v: number | undefined): string {
	if (v === undefined || v === null) return "—";
	return v.toLocaleString();
}

function StatLine({ label, home, away }: { label: string; home: string; away: string }) {
	return (
		<Table.Tr>
			<Table.Td>{away}</Table.Td>
			<Table.Td fw={600}>{label}</Table.Td>
			<Table.Td ta="right">{home}</Table.Td>
		</Table.Tr>
	);
}

function PlayerStatsTable({ players, label }: { players: BoxScorePlayerLine[]; label: string }) {
	const passers = players.filter((p) => p.stats.passYards !== undefined);
	const rushers = players.filter((p) => p.stats.rushYards !== undefined && !p.stats.passYards);
	const receivers = players.filter((p) => p.stats.recYards !== undefined);
	const defenders = players.filter((p) => p.stats.tackles !== undefined);

	return (
		<Stack gap="md">
			<Title order={5}>{label}</Title>
			{passers.length > 0 ? (
				<div>
					<Text size="sm" fw={600} mb={4}>
						Passing
					</Text>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Player</Table.Th>
								<Table.Th ta="right">Yds</Table.Th>
								<Table.Th ta="right">TD</Table.Th>
								<Table.Th ta="right">Int</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{passers.map((p) => (
								<Table.Tr key={p.playerId}>
									<Table.Td>{p.name}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.passYards)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.passTds)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.passInts)}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</div>
			) : null}
			{rushers.length > 0 ? (
				<div>
					<Text size="sm" fw={600} mb={4}>
						Rushing
					</Text>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Player</Table.Th>
								<Table.Th ta="right">Yds</Table.Th>
								<Table.Th ta="right">TD</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{rushers.map((p) => (
								<Table.Tr key={p.playerId}>
									<Table.Td>{p.name}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.rushYards)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.rushTds)}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</div>
			) : null}
			{receivers.length > 0 ? (
				<div>
					<Text size="sm" fw={600} mb={4}>
						Receiving
					</Text>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Player</Table.Th>
								<Table.Th ta="right">Rec</Table.Th>
								<Table.Th ta="right">Yds</Table.Th>
								<Table.Th ta="right">TD</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{receivers.map((p) => (
								<Table.Tr key={p.playerId}>
									<Table.Td>{p.name}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.receptions)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.recYards)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.recTds)}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</div>
			) : null}
			{defenders.length > 0 ? (
				<div>
					<Text size="sm" fw={600} mb={4}>
						Defense
					</Text>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Player</Table.Th>
								<Table.Th ta="right">Tkl</Table.Th>
								<Table.Th ta="right">Sacks</Table.Th>
								<Table.Th ta="right">Int</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{defenders.map((p) => (
								<Table.Tr key={p.playerId}>
									<Table.Td>{p.name}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.tackles)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.sacks)}</Table.Td>
									<Table.Td ta="right">{formatStat(p.stats.interceptions)}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</div>
			) : null}
		</Stack>
	);
}

export function BoxScoreTab({ gameId, active }: { gameId: string; active: boolean }) {
	const query = useGameBoxScore(gameId, active);

	if (query.isLoading) {
		return <Skeleton height={400} radius="sm" data-testid="box-score-skeleton" />;
	}
	if (query.isError) {
		return (
			<Alert color="yellow" icon={<IconAlertCircle size={16} />} title="No box score available">
				This game hasn't started, or the box score isn't ready yet.
			</Alert>
		);
	}
	if (!query.data) return null;

	const { home, away } = query.data;

	return (
		<Stack gap="xl" data-testid="box-score">
			<div>
				<Title order={4} mb="xs">
					Team totals
				</Title>
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>{away.totals.teamName}</Table.Th>
							<Table.Th ta="center">Stat</Table.Th>
							<Table.Th ta="right">{home.totals.teamName}</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						<TotalsRows away={away} home={home} />
					</Table.Tbody>
				</Table>
			</div>
			<PlayerStatsTable players={away.players} label={`${away.totals.teamName} player stats`} />
			<PlayerStatsTable players={home.players} label={`${home.totals.teamName} player stats`} />
		</Stack>
	);
}

function TotalsRows({ home, away }: { home: BoxScoreSide; away: BoxScoreSide }) {
	return (
		<>
			<StatLine
				label="Points"
				away={String(away.totals.points)}
				home={String(home.totals.points)}
			/>
			<StatLine
				label="Total yards"
				away={formatStat(away.totals.totalYards)}
				home={formatStat(home.totals.totalYards)}
			/>
			<StatLine
				label="Passing yards"
				away={formatStat(away.totals.passingYards)}
				home={formatStat(home.totals.passingYards)}
			/>
			<StatLine
				label="Rushing yards"
				away={formatStat(away.totals.rushingYards)}
				home={formatStat(home.totals.rushingYards)}
			/>
			<StatLine
				label="First downs"
				away={String(away.totals.firstDowns)}
				home={String(home.totals.firstDowns)}
			/>
			<StatLine
				label="3rd-down conv"
				away={away.totals.thirdDownConversions}
				home={home.totals.thirdDownConversions}
			/>
			<StatLine
				label="Turnovers"
				away={String(away.totals.turnovers)}
				home={String(home.totals.turnovers)}
			/>
			<StatLine
				label="Time of possession"
				away={away.totals.timeOfPossession}
				home={home.totals.timeOfPossession}
			/>
		</>
	);
}
