import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ThemeToggle() {
	const { setColorScheme } = useMantineColorScheme();
	const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });

	const toggle = () => setColorScheme(computed === "dark" ? "light" : "dark");

	return (
		<ActionIcon onClick={toggle} variant="default" size="lg" aria-label="Toggle color scheme">
			{computed === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
		</ActionIcon>
	);
}
