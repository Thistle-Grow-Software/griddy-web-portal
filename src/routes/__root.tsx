import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import {
	AppShell,
	Burger,
	Button,
	Group,
	MantineProvider,
	NavLink,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";

import { ThemeToggle } from "@/components/ThemeToggle";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
	return (
		<Stack align="center" gap="md" mt="xl">
			<Title order={1}>404</Title>
			<Text c="dimmed">We couldn't find that page.</Text>
			<Button component={Link} to="/">
				Back to home
			</Button>
		</Stack>
	);
}

function RootComponent() {
	const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
	const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(false);

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

					<AppShell.Navbar p="md">
						<NavLink href="/" label="Home" />
						<NavLink href="/theme-preview" label="Theme Preview" />
						<NavLink href="/players" label="Players" />
						<NavLink href="/games" label="Games" />
						<NavLink href="/stats" label="Stats" />
						<NavLink href="/settings" label="Settings" />
					</AppShell.Navbar>

					<AppShell.Main>
						<Outlet />
						{import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
					</AppShell.Main>
				</AppShell>
			</ModalsProvider>
		</MantineProvider>
	);
}
