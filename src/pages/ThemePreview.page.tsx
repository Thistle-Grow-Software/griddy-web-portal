import { ThemeToggle } from "@/components/ThemeToggle";
import {
	Alert,
	Anchor,
	Badge,
	Box,
	Button,
	Card,
	Checkbox,
	ColorSwatch,
	Container,
	Divider,
	Group,
	NumberInput,
	PasswordInput,
	Radio,
	SegmentedControl,
	Select,
	SimpleGrid,
	Slider,
	Stack,
	Switch,
	Text,
	TextInput,
	Textarea,
	Title,
	useMantineTheme,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

const BUTTON_VARIANTS = ["filled", "light", "outline", "subtle", "default", "gradient"] as const;

const SHADE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function ThemePreviewPage() {
	const theme = useMantineTheme();
	const colorNames = Object.keys(theme.colors);

	return (
		<Container size="lg" py="xl">
			<Stack gap="xl">
				<Group justify="space-between" align="flex-end">
					<Stack gap={4}>
						<Title order={1}>Theme preview</Title>
						<Text c="dimmed">
							Dev reference for typography, buttons, swatches, and form controls.
						</Text>
					</Stack>
					<ThemeToggle />
				</Group>

				<Divider />

				<section aria-labelledby="typography-heading">
					<Stack gap="sm">
						<Title id="typography-heading" order={2}>
							Typography
						</Title>
						<Title order={1}>Heading 1</Title>
						<Title order={2}>Heading 2</Title>
						<Title order={3}>Heading 3</Title>
						<Title order={4}>Heading 4</Title>
						<Title order={5}>Heading 5</Title>
						<Title order={6}>Heading 6</Title>
						<Text size="xl">Text size xl</Text>
						<Text size="lg">Text size lg</Text>
						<Text>Text size md (default)</Text>
						<Text size="sm">Text size sm</Text>
						<Text size="xs">Text size xs</Text>
						<Text fw={700}>Bold body text</Text>
						<Text fs="italic">Italic body text</Text>
						<Text c="dimmed">Dimmed body text</Text>
						<Anchor href="#typography-heading">Anchor link</Anchor>
					</Stack>
				</section>

				<Divider />

				<section aria-labelledby="buttons-heading">
					<Stack gap="sm">
						<Title id="buttons-heading" order={2}>
							Buttons
						</Title>
						<Group>
							{BUTTON_VARIANTS.map((variant) => (
								<Button
									key={variant}
									variant={variant}
									gradient={
										variant === "gradient" ? { from: "blue", to: "cyan", deg: 45 } : undefined
									}
								>
									{variant}
								</Button>
							))}
						</Group>
						<Group>
							<Button size="xs">xs</Button>
							<Button size="sm">sm</Button>
							<Button size="md">md</Button>
							<Button size="lg">lg</Button>
							<Button size="xl">xl</Button>
						</Group>
						<Group>
							<Button color="red">Red</Button>
							<Button color="green">Green</Button>
							<Button color="grape">Grape</Button>
							<Button disabled>Disabled</Button>
							<Button loading>Loading</Button>
						</Group>
						<Group>
							<Badge>Default badge</Badge>
							<Badge color="red" variant="light">
								Red light
							</Badge>
							<Badge color="green" variant="outline">
								Green outline
							</Badge>
							<Badge color="grape" variant="filled">
								Grape filled
							</Badge>
						</Group>
					</Stack>
				</section>

				<Divider />

				<section aria-labelledby="colors-heading">
					<Stack gap="sm">
						<Title id="colors-heading" order={2}>
							Color swatches
						</Title>
						<Text c="dimmed" size="sm">
							All ten shades for each palette in <code>theme.colors</code>.
						</Text>
						<Stack gap="md">
							{colorNames.map((name) => (
								<Box key={name}>
									<Text size="sm" fw={500} mb={4}>
										{name}
									</Text>
									<Group gap={4}>
										{SHADE_INDICES.map((shade) => (
											<ColorSwatch
												key={shade}
												color={theme.colors[name][shade]}
												size={28}
												title={`${name}.${shade}`}
											/>
										))}
									</Group>
								</Box>
							))}
						</Stack>
					</Stack>
				</section>

				<Divider />

				<section aria-labelledby="forms-heading">
					<Stack gap="sm">
						<Title id="forms-heading" order={2}>
							Form controls
						</Title>
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
							<TextInput
								label="Text input"
								placeholder="Type something"
								description="With a description"
							/>
							<TextInput
								label="With error"
								placeholder="Type something"
								error="This field is required"
							/>
							<PasswordInput label="Password" placeholder="••••••••" />
							<NumberInput label="Number" placeholder="0" />
							<Select
								label="Select"
								placeholder="Pick one"
								data={["NFL", "NCAA FBS", "UFL", "CFL"]}
							/>
							<DatePickerInput label="Date" placeholder="Pick a date" />
							<Textarea label="Textarea" placeholder="Multi-line input" autosize minRows={2} />
							<Stack gap="xs">
								<Text size="sm" fw={500}>
									Slider
								</Text>
								<Slider defaultValue={40} />
							</Stack>
						</SimpleGrid>

						<Group>
							<Checkbox label="Checkbox" defaultChecked />
							<Switch label="Switch" defaultChecked />
						</Group>

						<Radio.Group label="Radio group" defaultValue="film">
							<Group mt="xs">
								<Radio value="stats" label="Stats" />
								<Radio value="film" label="Film" />
								<Radio value="both" label="Both" />
							</Group>
						</Radio.Group>

						<SegmentedControl data={["Day", "Week", "Season"]} defaultValue="Week" />
					</Stack>
				</section>

				<Divider />

				<section aria-labelledby="feedback-heading">
					<Stack gap="sm">
						<Title id="feedback-heading" order={2}>
							Feedback
						</Title>
						<Group>
							<Button
								onClick={() =>
									notifications.show({
										title: "Hello",
										message: "This is a Mantine notification.",
									})
								}
							>
								Show notification
							</Button>
							<Button
								variant="light"
								onClick={() =>
									modals.openConfirmModal({
										title: "Confirm action",
										children: <Text size="sm">Just a preview modal.</Text>,
										labels: { confirm: "Confirm", cancel: "Cancel" },
									})
								}
							>
								Open modal
							</Button>
						</Group>
						<Alert title="Info alert" color="blue">
							Alerts use the active color scheme.
						</Alert>
						<Card withBorder padding="md">
							<Text fw={600}>Card</Text>
							<Text size="sm" c="dimmed">
								Surfaces use theme background and border tokens.
							</Text>
						</Card>
					</Stack>
				</section>
			</Stack>
		</Container>
	);
}
