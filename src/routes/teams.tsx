import { requireAuth } from "@/lib/auth-guard";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teams")({
	beforeLoad: requireAuth,
	component: () => <Outlet />,
});
