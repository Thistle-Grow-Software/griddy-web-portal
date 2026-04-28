import "@mantine/core/styles.css";

import { AppShell, Burger, HoverCard, MantineProvider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { ThemeToggle } from "./components/ThemeToggle";
import Group = HoverCard.Group;

export function App() {
	const [opened, { toggle }] = useDisclosure();

	return (
		<MantineProvider defaultColorScheme="auto">
			<AppShell
				padding="md"
				header={{ height: 60 }}
				navbar={{
					width: 300,
					breakpoint: "sm",
					collapsed: { mobile: !opened },
				}}
			>
				<AppShell.Header>
					<Group h="100%" px="md" justify="space-between">
						<Group>
							<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
							<span>Griddy</span>
						</Group>
						<ThemeToggle />
					</Group>
				</AppShell.Header>

				<AppShell.Navbar p="md">Navbar</AppShell.Navbar>

				<AppShell.Main>Main</AppShell.Main>
			</AppShell>
		</MantineProvider>
	);
}
