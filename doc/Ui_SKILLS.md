# UI Design System — Agent Context (Mercor-Inspired, Red Palette)

> This document is a design-system context for AI coding agents (Claude Code, Cursor, etc).
> Read this before generating or editing any UI component. Follow it exactly — do not invent
> colors, spacing, or type sizes outside what is defined here.

## 1. Brand Direction

Structure and layout philosophy follow Mercor's UI conventions: minimal, high-contrast,
generous whitespace, geometric sans-serif type, flat surfaces (no heavy gradients/skeuomorphism),
content-first hierarchy. The color identity is replaced with a **red / white / grey** system
instead of Mercor's original indigo/black.

Design principles:
- Clarity over decoration — every element earns its place.
- One accent color (red) used sparingly for emphasis, not everywhere.
- Neutral greys carry 90% of the UI weight; red highlights actions and status.
- Flat surfaces, subtle borders instead of heavy shadows.
- Consistent 8px spacing rhythm.

## 2. Color Palette

### Primary — Signal Red
```
--color-primary-50:  #fef2f2
--color-primary-100: #fee2e2
--color-primary-200: #fecaca
--color-primary-300: #fca5a5
--color-primary-400: #f87171
--color-primary-500: #ef4444   /* base */
--color-primary-600: #dc2626   /* primary brand red — main CTA color */
--color-primary-700: #b91c1c   /* hover/active state */
--color-primary-800: #991b1b
--color-primary-900: #7f1d1d
```

### Neutrals — Grey / White / Black
```
--color-white:      #ffffff
--color-grey-50:    #f9fafb   /* app background */
--color-grey-100:   #f3f4f6   /* card/section background */
--color-grey-200:   #e5e7eb   /* borders, dividers */
--color-grey-300:   #d1d5db   /* disabled borders */
--color-grey-400:   #9ca3af   /* placeholder text, icons */
--color-grey-500:   #6b7280   /* secondary text */
--color-grey-600:   #4b5563   /* body text (secondary) */
--color-grey-700:   #374151   /* body text (primary) */
--color-grey-800:   #1f2937   /* headings */
--color-grey-900:   #111827   /* max-contrast text */
--color-black:      #020817   /* Mercor-style near-black, dark surfaces only */
```

### Semantic
```
--color-success: #16a34a   /* green-600, use for confirmations, never red */
--color-warning: #d97706   /* amber-600 */
--color-error:   #dc2626   /* same as primary-600 — reuse brand red for errors */
--color-info:    #4b5563   /* grey-600, neutral info messages */
```

### Usage rules
- Background default: `--color-white` or `--color-grey-50`.
- Primary CTA button: `--color-primary-600` bg, `--color-white` text, hover → `--color-primary-700`.
- Never use pure red (`#ff0000`) — always use the defined scale.
- Red is reserved for: primary actions, active nav state, error state, key metrics/highlights.
- Do not use red for large background surfaces (hero sections, full cards) — use it as accent only.

## 3. Typography

Font: **Inter** (same as Mercor), fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

```
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

--text-xs:   12px / 16px   /* line-height */
--text-sm:   14px / 20px
--text-base: 16px / 24px
--text-lg:   18px / 28px
--text-xl:   20px / 28px
--text-2xl:  24px / 32px
--text-3xl:  30px / 38px
--text-4xl:  36px / 44px
--text-5xl:  48px / 56px

--font-weight-regular:  400
--font-weight-medium:   500
--font-weight-semibold: 600
--font-weight-bold:     700
```

Rules:
- Headings: `--color-grey-900`, weight 600–700.
- Body text: `--color-grey-700`, weight 400.
- Secondary/muted text: `--color-grey-500`.
- Never set body text lighter than `--color-grey-500` (contrast/accessibility).

## 4. Spacing & Layout

8px base rhythm:
```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

- Section padding (desktop): `--space-16` vertical, `--space-8` horizontal.
- Card padding: `--space-6`.
- Form field gap: `--space-4`.
- Max content width: `1200px`, centered, side gutters `--space-6` on mobile.

## 5. Radius & Elevation

```
--radius-sm: 6px    /* inputs, small buttons */
--radius-md: 8px    /* cards, buttons */
--radius-lg: 12px   /* modals, large containers */
--radius-full: 9999px  /* pills, avatars */

--shadow-sm: 0 1px 2px rgba(2, 8, 23, 0.05);
--shadow-md: 0 2px 8px rgba(2, 8, 23, 0.08);
--shadow-lg: 0 8px 24px rgba(2, 8, 23, 0.12);
```

Use borders (`1px solid var(--color-grey-200)`) as the default separator instead of shadows.
Reserve `--shadow-md`/`--shadow-lg` for floating elements only (modals, dropdowns, tooltips).

## 6. Components

### Buttons
| Variant   | Background            | Text                | Border                     | Hover                  |
|-----------|------------------------|----------------------|-----------------------------|------------------------|
| Primary   | `--color-primary-600`  | `--color-white`      | none                        | bg `--color-primary-700` |
| Secondary | `--color-white`        | `--color-grey-800`   | `1px solid --color-grey-300` | bg `--color-grey-50`    |
| Ghost     | transparent            | `--color-grey-700`   | none                        | bg `--color-grey-100`   |
| Danger    | `--color-primary-600`  | `--color-white`      | none                        | bg `--color-primary-700` |
| Disabled  | `--color-grey-200`     | `--color-grey-400`   | none                        | no interaction         |

- Height: 40px (default), 32px (small), 48px (large).
- Radius: `--radius-md`. Padding: `0 --space-4`.
- Font weight: 500.

### Inputs
- Background `--color-white`, border `1px solid --color-grey-300`, radius `--radius-sm`.
- Focus: border `--color-primary-600`, ring `0 0 0 3px` of `--color-primary-100`.
- Error: border `--color-error`, helper text `--color-error`.
- Placeholder text: `--color-grey-400`.

### Cards
- Background `--color-white`, border `1px solid --color-grey-200`, radius `--radius-md`.
- Shadow: `--shadow-sm` at rest, `--shadow-md` on hover if clickable.

### Navigation
- Background `--color-white`, bottom border `1px solid --color-grey-200`.
- Active link: text `--color-primary-600`, optional 2px bottom border in `--color-primary-600`.
- Inactive link: `--color-grey-600`, hover → `--color-grey-900`.

### Badges / Tags
- Neutral: bg `--color-grey-100`, text `--color-grey-700`.
- Highlight/status: bg `--color-primary-50`, text `--color-primary-700`.
- Radius: `--radius-full`, padding `2px 10px`, `--text-xs`, weight 500.

### Tables
- Header row: bg `--color-grey-50`, text `--color-grey-600`, weight 600, `--text-sm`.
- Row divider: `1px solid --color-grey-200`.
- Row hover: bg `--color-grey-50`.

## 7. States

- **Hover**: darken by one step on the color scale (e.g. 600 → 700).
- **Active/pressed**: darken by two steps.
- **Focus-visible**: always show a visible ring using `--color-primary-100` regardless of component.
- **Disabled**: `--color-grey-200` bg / `--color-grey-400` text, `cursor: not-allowed`, no shadow.
- **Loading**: replace label with spinner, keep button width fixed (no layout shift).

## 8. Accessibility

- Minimum text contrast: 4.5:1 for body text, 3:1 for large text (≥18px bold or ≥24px regular).
- `--color-primary-600` on white passes AA for text and icons; do not use `--color-primary-400`
  or lighter for text on white backgrounds.
- Every interactive element must have a visible focus state — never remove `outline` without
  replacing it with `--shadow` ring above.
- Do not rely on red alone to convey meaning (errors, required fields) — pair with an icon or label.

## 9. Do / Don't

**Do**
- Keep one primary red action per screen/section.
- Use grey scale for all structural UI (backgrounds, borders, secondary text).
- Keep spacing on the 8px scale — no arbitrary values like `13px` or `22px`.

**Don't**
- Don't use multiple saturated reds of different hues — stick to the defined scale.
- Don't apply red backgrounds to large content areas.
- Don't mix border-radius values across similar components (e.g. 8px card next to 4px card).
- Don't introduce a second accent color without explicit request.