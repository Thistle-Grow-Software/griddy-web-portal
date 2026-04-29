import { ThemePreviewPage } from "@/pages/ThemePreview.page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/theme-preview")({
	component: ThemePreviewPage,
});
