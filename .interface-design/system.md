# Atlas Terminal design system

## Direction

Dark **market observatory** for personal equity research: controlled, dense, and calm. The active security’s price and chart are the focal point; supporting analysis remains peripheral until needed.

## Domain and signature

- Vocabulary: observatory, signal, wire, focus group, research stream, market session.
- Signature: a mint link-dot marks panels that share an active ticker. Selecting a symbol makes the workspace feel like a coordinated research instrument rather than a dashboard.
- Avoid: Bloomberg visual imitation, generic metric-card grids, decorative gradients, and more than one non-semantic accent.

## Tokens and hierarchy

- Ink palette: `--ink` / `--night` / `--slate` / `--slate-raised` create quiet elevation; depth comes from low-opacity borders, not shadows.
- Meaningful color only: mint for positive/linked/active, coral for negative, amber for caution/research signals, blue reserved for informational data.
- Type: dense 10–13px metadata and panels; 20–28px company heading; 30–46px tabular active price.
- Base spacing: 4px; panels use 12–16px inner density; terminal rail is 64px (54px at tablet).

## Reusable patterns

- Panel: 10px radius, `--rule` border, uppercase 10px/700 header with 0.12em tracking, quiet footer action.
- Focus group: mint dot and linked label, plus clear data-delay status in the terminal chrome.
- Table row: compact, tabular figures; current symbol gets a 2px mint left rail and subtle mint wash.
- States: controls need hover, focus-visible mint outline, and source/delay provenance wherever live-looking market data appears.
