import { SignUp } from "@clerk/react";
import { Center } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

type SignUpSearch = { redirect_url?: string };

export const Route = createFileRoute("/sign-up/$")({
	validateSearch: (search: Record<string, unknown>): SignUpSearch => ({
		redirect_url: typeof search.redirect_url === "string" ? search.redirect_url : undefined,
	}),
	component: SignUpPage,
});

function SignUpPage() {
	const { redirect_url } = Route.useSearch();
	return (
		<Center mt="xl">
			<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl={redirect_url} />
		</Center>
	);
}
