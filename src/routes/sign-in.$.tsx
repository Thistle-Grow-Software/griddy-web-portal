import { SignIn } from "@clerk/react";
import { Center } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

type SignInSearch = { redirect_url?: string };

export const Route = createFileRoute("/sign-in/$")({
	validateSearch: (search: Record<string, unknown>): SignInSearch => ({
		redirect_url: typeof search.redirect_url === "string" ? search.redirect_url : undefined,
	}),
	component: SignInPage,
});

function SignInPage() {
	const { redirect_url } = Route.useSearch();
	return (
		<Center mt="xl">
			<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl={redirect_url} />
		</Center>
	);
}
