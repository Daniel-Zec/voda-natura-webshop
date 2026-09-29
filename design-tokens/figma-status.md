# Figma design system — what is in sync

Figma file: **VodaNatura — Design System** (`yNO0j0lV3YKQCqgksFEETD`, Starter plan).

| Part | In Figma | In code | Status |
| --- | --- | --- | --- |
| Colours | Primitives (54) + Tokens (41) | `src/styles/tokens/colors.css` | In sync (Figma is the source) |
| Typography | Typography (49 variables) + 22 text styles | `src/styles/tokens/typography.css` | In sync (Figma is the source) |
| Spacing, radius, control sizes | Collection **Layout** (24 variables, WEB code syntax `var(--vn-…)`) | `src/styles/tokens/layout.css` | In sync since 29 Sep 2026 (code is the source) |
| Shadows | Effect styles Shadow/sm, Shadow/md | `--vn-shadow-sm/md` | In sync |
| Icons | Page **🔣 Icons**: 20 components `Icon/{name}`, stroke bound to `color/text/primary` | `src/components/ui/Icon` | In sync |
| Components | — | 29 components, documented in Storybook | **Not in Figma yet** |

Gutter, section gap and motion values change with screen width and stay code-only.

## Why the components are missing

The Figma Starter plan allows 20 MCP tool calls a month. The limit was reached on 29 Sep 2026, after the tokens and icons were built. To finish, either wait for the monthly reset or upgrade to Professional (200 a day).

## Next Figma steps (in this order)

1. Screenshot-check the Icons page (not yet visually verified).
2. Page **🧩 Components**. Bind everything to the Tokens, Layout and text styles.
   - Button: Variant (primary, secondary, outline, outlineBrand, ghost) × Size (md, lg), with icon instance swap.
   - Badge (info, natura, sand, success, warning, neutral).
   - StockStatus (inStock, outOfStock, madeToOrder).
   - Price (sm, md, lg).
   - Chip (sand, neutral).
   - Overline, SearchBar, QuantityStepper, Breadcrumbs, ArrowLink, IconTile, SectionHeader.
3. Shop components:
   - Cards: ProductCard (vertical, horizontal), CategoryCard, CartridgeCard.
   - TrustBar, StepList, InfoCard, FaqList item, SpecsTable, BuyBox.
4. Layout components: AnnouncementBar, SiteHeader (desktop, phone) and SiteFooter.
5. One review frame showing the variants as instances, then a screenshot check.
