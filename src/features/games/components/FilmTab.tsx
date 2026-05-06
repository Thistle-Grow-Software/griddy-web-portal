import { Center, Stack, Text, Title } from "@mantine/core";
import { IconVideo } from "@tabler/icons-react";

// Placeholder until TGF-335 (video delivery spike) lands. Kept as a real tab
// rather than a hidden one so the URL/UI structure doesn't shift when video
// becomes available — only the contents of this panel will change.
export function FilmTab() {
	return (
		<Center mih={240} p="md" data-testid="film-tab-placeholder">
			<Stack align="center" gap="xs" maw={420}>
				<IconVideo size={36} />
				<Title order={4}>Film coming soon</Title>
				<Text c="dimmed" ta="center" size="sm">
					Game film playback is being worked on under TGF-335. Check back once that ships.
				</Text>
			</Stack>
		</Center>
	);
}
