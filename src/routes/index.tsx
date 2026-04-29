import { Container, Text } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<Container strategy="grid">
			<Text>Hello World</Text>
			<Link to="/theme-preview">Theme Preview</Link>
		</Container>
	);
}
