# Ponty Design System v2.0

## 🎨 Visual Direction (North Star)
- **Premium SaaS** — clean, modern, technological
- **Subtle depth** — shadow-sm default, shadow-md on hover
- **Clear typography hierarchy** — H1 `text-2xl lg:text-3xl font-bold` / H2 `text-lg font-semibold` / Body `text-sm` / Muted `text-sm text-muted-foreground`
- **Consistent spacing** — fixed scale, never arbitrary
- **Ponty purple as accent** — not overused, never polluting
- **Identity** — not a generic template

---

## 🏗️ Layout Rules (LOCKED)

### Responsive Breakpoints
| Viewport       | Sidebar | BottomNav | Header |
|----------------|---------|-----------|--------|
| Desktop ≥1024px | `hidden lg:flex` — ON | `lg:hidden` — OFF | `h-14 lg:h-16` |
| Mobile <1024px  | OFF | `fixed bottom-0 lg:hidden` — ON | `h-14` |

### Main Content Padding
- **Desktop**: `pt-16` (header) + `lg:ml-64` (sidebar) + `lg:pb-6`
- **Mobile**: `pt-14` (header) + `pb-mobile-safe` (bottom nav safe area)
- **Page padding**: `px-3 py-4 sm:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto`

---

## 🎯 Spacing Scale (Fixed)

| Token | Value | Usage |
|-------|-------|-------|
| `gap-3` | 12px | Card grid mobile |
| `gap-4` | 16px | Card grid desktop, section items |
| `gap-6` | 24px | Section spacing |
| `space-y-4` | 16px | Default vertical rhythm mobile |
| `space-y-6` | 24px | Default vertical rhythm desktop |
| `p-4` | 16px | Card content mobile |
| `p-6` | 24px | Card content desktop |
| `rounded-xl` | 12px | Cards, buttons, avatars |
| `rounded-lg` | 8px | Inner elements |
| `rounded-md` | 6px | Small elements, badges |

---

## 🌓 Theme System (LOCKED)

### How It Works
- `data-theme` attribute on `document.documentElement`
- Three themes: `light`, `dark`, `neon`
- Legacy `musk` → auto-mapped to `neon`
- Persisted in `localStorage` key `ponty-theme`
- On every page load, `ThemeContext` reads + applies

### Token Classes (USE THESE)
```
bg-background      — page background
bg-card             — card/surface background
bg-popover          — dropdown/popover background
bg-muted            — subtle background (chips, sections)
bg-secondary        — secondary surface
bg-primary          — primary accent (buttons)
bg-primary/10       — accent tint (hover states)
bg-destructive      — error/delete

text-foreground     — primary text
text-card-foreground — card text
text-muted-foreground — secondary/helper text
text-primary        — accent text
text-destructive    — error text

border-border       — default border
border-input        — form input border
ring-ring           — focus ring
```

### ❌ PROHIBITED
- `bg-white`, `bg-black`
- `text-gray-*`, `text-slate-*` for semantic text
- `style={{ color: 'var(--text-primary)' }}` or any inline `style` for theming
- `var(--bg-primary)`, `var(--bg-secondary)` — use shadcn classes instead
- `!important` on theme tokens
- Hardcoded hex colors for text/backgrounds (except brand `#9038fa` for special elements like logo)

### ✅ Exceptions (Allowed)
- `bg-[#9038fa]` for brand-specific elements (CTA banners, logo, premium badge)
- `text-emerald-*`, `text-red-*` for semantic status colors (green=success, red=error)
- `bg-emerald-50`, `bg-red-50` for status tint backgrounds (these are semantic, not theme)

---

## 🧩 Standard Components

### PageHeader
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl lg:text-3xl font-bold">Title</h1>
    <p className="text-sm mt-1 text-muted-foreground">Subtitle</p>
  </div>
  {/* Optional action button */}
</div>
```

### Card (shadcn)
Already themed via CSS variables. Just use:
```jsx
<Card>
  <CardHeader><CardTitle className="text-lg font-semibold">...</CardTitle></CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### EmptyState
```jsx
<EmptyState icon={Megaphone} title="..." description="..." actionLabel="..." onAction={fn} />
```

### LoadingSpinner
```jsx
<LoadingSpinner /> // Full-page centered spinner
```

### Buttons
- **Primary**: `<Button>` — uses `bg-primary text-primary-foreground`
- **Brand CTA**: `<Button className="bg-[#9038fa] hover:bg-[#9038fa]/90">` — for special CTAs
- **Secondary**: `<Button variant="secondary">`
- **Outline**: `<Button variant="outline">`
- **Ghost**: `<Button variant="ghost">`
- **Link button with accent**: `<Button variant="ghost" size="sm" className="text-primary">`

### Form Fields
```jsx
<div className="space-y-2">
  <Label>Field Label</Label>
  <Input placeholder="..." />
</div>
```
- Vertical gap between fields: `space-y-4` or `space-y-6`
- Label to input gap: `mt-2` or use `space-y-2` wrapper

---

## 🔒 Shadow Scale

| Class | Usage |
|-------|-------|
| (none) | Most cards at rest |
| `shadow-sm` | Elevated cards, stat cards |
| `shadow-md` | Hover state cards |
| `shadow-lg` | Floating elements (modals, popovers) |
| `shadow-xl` | Hero/feature banners |

---

## ✅ Checklist Before Shipping Any Page
1. [ ] No `style={{}}` for colors/backgrounds
2. [ ] No `bg-white`, `text-gray-*`
3. [ ] Uses `text-foreground` / `text-muted-foreground` / `text-primary`
4. [ ] Uses `bg-background` / `bg-card` / `bg-muted`
5. [ ] Loading state uses `<LoadingSpinner />`
6. [ ] Empty state uses `<EmptyState />`
7. [ ] PageHeader follows standard pattern
8. [ ] Responsive: works on mobile AND desktop
9. [ ] Theme: switch light/dark/neon and verify visuals