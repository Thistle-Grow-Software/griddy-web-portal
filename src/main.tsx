import { App } from "@/App";
import { ColorSchemeScript } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found in document.");
}

createRoot(rootElement).render(
	<StrictMode>
		<ColorSchemeScript defaultColorScheme={"auto"} />
		<App />
	</StrictMode>,
);
