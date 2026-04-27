# ADR-0004: UI kit — Mantine

## Status

Accepted, with a known evaluation gap. See "Consequences" below.

## Context

The portal needs a UI kit. The product is a stats-and-film tool
for working professionals — dense tables, filter forms, modals,
date pickers, charts. The hard parts are accessible, internally
consistent components that look reasonable out of the box; the
team has neither the appetite nor the head-count to maintain a
hand-rolled design system in v1.

Several mature React UI kits exist: Mantine, Material UI (MUI),
Chakra UI, Ant Design, and the (rapidly-growing) shadcn/ui +
Tailwind pattern.

## Decision

Use **Mantine** as the primary UI kit.

## Consequences

* **Components are well-stocked for the v1 surface.** Mantine
  ships data-grid-adjacent tables, comprehensive form primitives
  (Select, MultiSelect, DatePicker, etc.), and modal/notification
  hooks. The query-builder and stats-export flows that anchor v1
  fall well within its component coverage.
* **Theming and dark mode are built in.** The product audience
  (coaches and scouts working long hours) will appreciate a
  first-class dark theme without us having to engineer one.
* **Hooks ecosystem is genuinely useful.** `@mantine/hooks` covers
  enough cases that we'll likely avoid pulling in a separate
  helpers library for things like `useLocalStorage`,
  `useViewportSize`, etc.
* **Documentation is thorough.** Component API docs are
  comprehensive enough that contributors don't need to read the
  source.
* **Bundle size is non-trivial.** Mantine pulls more weight than
  shadcn/ui's copy-into-your-repo approach. Acceptable for an
  authenticated app where users sign in once and stay; revisit if
  load-time metrics suggest otherwise.

### Known evaluation gap (recommend follow-up)

**`shadcn/ui` + Tailwind was not formally evaluated** before this
decision was made. It's the most actively-discussed alternative
in the React ecosystem right now and has materially different
trade-offs (copy-paste into your repo, owned components, Tailwind
styling instead of CSS-in-JS). This ADR is being authored after
the choice was made; we should run a short re-evaluation early in
v1 to validate that Mantine remains the right call.

If the re-evaluation produces a different answer, supersede this
ADR with one referencing the evaluation. The cost of switching
**before** real component code is written is low; the cost
**after** is much higher — so the re-evaluation should happen
before the first feature story lands UI code.

## Alternatives considered

**Material UI (MUI).** Most-deployed React UI kit; very mature.
Rejected on aesthetic grounds (Material Design is a poor fit for
a tool aimed at coaches/scouts; the visual language carries
"Google product" connotations) and a heavier learning curve for
its `sx` prop / styling system.

**Chakra UI.** Rejected on community-momentum grounds — Chakra's
maintainer activity has slowed visibly relative to Mantine, and
the v3 transition has been protracted. We don't want to bet on a
kit whose long-term direction is uncertain.

**Ant Design.** Rejected on aesthetic + i18n grounds. Ant's
visual language is targeted at Chinese-market enterprise tools;
the defaults read as visually heavy for a Western, more-modern
product surface.

**shadcn/ui + Tailwind.** Not formally evaluated — see the
"Known evaluation gap" note above.

**Hand-rolled / no kit.** Rejected on capacity grounds.
Building accessible primitives from scratch in v1 would consume
all our capacity for actual product features.

## Reference

* TGF-321 stack table.
