import { EmptyState } from "@/features/teams/components/EmptyState";
import { Card, SimpleGrid, Stack, Text } from "@mantine/core";
import type { PlayerBio } from "../types";

function formatDate(iso: string | null): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatDraft(bio: PlayerBio): string {
	if (bio.draftYear === null) return "—";
	if (bio.draftRound === null) return String(bio.draftYear);
	return `${bio.draftYear} · Round ${bio.draftRound}${
		bio.draftPick !== null ? `, Pick ${bio.draftPick}` : ""
	}`;
}

const FIELDS: { label: string; value: (bio: PlayerBio) => string }[] = [
	{ label: "Date of birth", value: (bio) => formatDate(bio.dateOfBirth) },
	{ label: "Birthplace", value: (bio) => bio.birthplace ?? "—" },
	{ label: "College", value: (bio) => bio.college ?? "—" },
	{ label: "Draft", value: formatDraft },
];

/**
 * UFL/CFL records often lack bio info. Rather than rendering "—" five times,
 * collapse to an empty state when *every* field is missing.
 */
function bioIsEmpty(bio: PlayerBio): boolean {
	return (
		bio.dateOfBirth === null &&
		bio.birthplace === null &&
		bio.college === null &&
		bio.draftYear === null
	);
}

export function BioTab({ bio }: { bio: PlayerBio }) {
	if (bioIsEmpty(bio)) {
		return <EmptyState title="No biographical info available for this player" />;
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
			{FIELDS.map((field) => (
				<Card key={field.label} withBorder padding="md" radius="md">
					<Stack gap={2}>
						<Text size="sm" c="dimmed">
							{field.label}
						</Text>
						<Text fw={500}>{field.value(bio)}</Text>
					</Stack>
				</Card>
			))}
		</SimpleGrid>
	);
}
