import { SandboxErrorPage } from "@/pages/SandboxError.page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sandbox/error")({
	component: SandboxErrorPage,
});
