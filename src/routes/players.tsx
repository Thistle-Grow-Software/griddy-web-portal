import { requireAuth } from "@/lib/auth-guard";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/players")({
	beforeLoad: requireAuth,
	component: () => <Outlet />,
});
