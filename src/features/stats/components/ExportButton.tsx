import { Button, Menu } from "@mantine/core";
import { IconChevronDown, IconDownload } from "@tabler/icons-react";
import { useState } from "react";

export function ExportButton({
	disabled,
	onExport,
}: {
	disabled?: boolean;
	onExport: (format: "csv" | "xlsx") => Promise<void> | void;
}) {
	const [busy, setBusy] = useState(false);

	const run = async (format: "csv" | "xlsx") => {
		setBusy(true);
		try {
			await onExport(format);
		} finally {
			setBusy(false);
		}
	};

	return (
		<Menu shadow="md" position="bottom-end" withinPortal>
			<Menu.Target>
				<Button
					variant="default"
					leftSection={<IconDownload size={14} />}
					rightSection={<IconChevronDown size={14} />}
					disabled={disabled || busy}
					data-testid="export-button"
				>
					{busy ? "Exporting…" : "Export"}
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item onClick={() => run("csv")}>Download CSV</Menu.Item>
				<Menu.Item onClick={() => run("xlsx")}>Download Excel (.xlsx)</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
