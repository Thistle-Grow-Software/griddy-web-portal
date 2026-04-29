import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

import { AppShell, Burger, Group, MantineProvider, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";

import { ThemeToggle } from "./components/ThemeToggle";
import { ThemePreviewPage } from "./pages/ThemePreview.page";

export function App() {
	const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
	const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(false);

	const isThemePreview =
		typeof window !== "undefined" && window.location.pathname === "/theme-preview";

	return (
		<MantineProvider defaultColorScheme="auto">
			<Notifications />
			<ModalsProvider>
				<AppShell
					padding="md"
					header={{ height: 48 }}
					navbar={{
						width: 300,
						breakpoint: "sm",
						collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
					}}
				>
					<AppShell.Header>
						<Group h="100%" px="md" justify="space-between">
							<Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
							<Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
							<Group>
								<Title order={3}>Griddy Web Portal</Title>
							</Group>
							<Group>
								<ThemeToggle />
							</Group>
						</Group>
					</AppShell.Header>

					<AppShell.Navbar p="md">Navbar</AppShell.Navbar>

					<AppShell.Main>
						{isThemePreview ? <ThemePreviewPage /> : <Text>Hello world!</Text>}
					</AppShell.Main>
				</AppShell>
			</ModalsProvider>
		</MantineProvider>
	);
}
