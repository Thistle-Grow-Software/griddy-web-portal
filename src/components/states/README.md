# Loading, empty, and error states (TGF-336)

Shared primitives for every feature. Import from `@/components/states` — don't
re-invent these per feature. Each variant is rendered live on `/theme-preview`.

## Loading

| Component | Use for |
| --- | --- |
| `<PageSkeleton />` | Whole-page loads where the final layout isn't known. |
| `<TableSkeleton rows={n} />` | Data tables. Set `rows` to the page size. |
| `<CardSkeleton />` | List/grid card views (one per expected card). |

**Convention:** the skeleton layout must match the loaded layout so the swap to
real data doesn't shift the page. When a page has a known bespoke shape, build
a feature-specific skeleton that mirrors it (e.g. `TeamHeroSkeleton`) instead
of forcing a generic one.

## Empty

`<EmptyState icon title description action />` — standard empty state with an
optional CTA button. Common variants:

- **No results for this filter** — pair with a "Clear filters" action.
- **No data available yet** — plain statement, no action.
- **Not found** — unknown ID on a detail route; pair with a "Back to <list>" action.

**Voice/tone:** direct, not cutesy. Coaches aren't here for jokes.

## Errors

| Component | Use for |
| --- | --- |
| `<ErrorBoundary />` | Wrap routes/the app. Reports to Sentry, renders a fallback with "Try again" and a "Report this issue" link. `fullPage` for the app-level boundary. |
| `<NotFound />` | 404s — unknown routes (router `notFoundComponent`) and unknown IDs. |
| `<InlineError title message onRetry />` | Contained failures: a widget fails while the rest of the page works. |

**Convention:** always show the user something actionable. Never a blank
screen, never a raw error trace.

## Toasts

Use the `notify` helper, never `notifications.show` directly, so timing and
color conventions stay consistent:

- `notify.success(message)` — transient, auto-dismisses after 3s.
- `notify.error(message)` — sticky, must be dismissed by the user.
- `notify.info(message)` — auto-dismisses after 5s.

All three accept an optional second argument for `title` and other
`NotificationData` overrides.
