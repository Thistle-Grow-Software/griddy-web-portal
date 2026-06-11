/**
 * Holding page for griddy.win (TGF-340).
 *
 * The ticket allowed "holding page or 302 redirect to
 * portal.thistlegrow.software"; that hostname doesn't exist yet, so this
 * serves a minimal holding page instead. Replace with a Cloudflare Pages
 * custom-domain binding once the portal is ready to live on the apex.
 *
 * `www` is canonicalized to the apex with a 301, preserving path and query.
 */

const APEX_HOST = "griddy.win";

const HOLDING_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Griddy — coming soon</title>
<style>
	body {
		margin: 0;
		min-height: 100vh;
		display: grid;
		place-items: center;
		font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
		background: #101113;
		color: #f1f3f5;
	}
	main { text-align: center; padding: 2rem; }
	h1 { font-size: 3rem; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
	p { color: #909296; font-size: 1.125rem; margin: 0; }
</style>
</head>
<body>
<main>
	<h1>Griddy</h1>
	<p>Football stats and game film for coaches, scouts, and media.</p>
	<p>Coming soon.</p>
</main>
</body>
</html>
`;

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.hostname !== APEX_HOST) {
			url.hostname = APEX_HOST;
			return Response.redirect(url.toString(), 301);
		}

		return new Response(HOLDING_PAGE, {
			headers: {
				"content-type": "text/html; charset=utf-8",
				"cache-control": "public, max-age=300",
			},
		});
	},
};
