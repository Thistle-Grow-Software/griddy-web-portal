import { requireAuth } from "@/lib/auth-guard";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/games")({
	beforeLoad: requireAuth,
	component: () => <Outlet />,
});
