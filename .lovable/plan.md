

## Root Cause

The crash happens when you click USD or EUR on the "Toplam Kazanc" hero card. The JSX uses multiple adjacent conditional expressions that render text nodes:

```jsx
{heroCurrency === "TRY" && `₺${fmt(...)}`}
{heroCurrency === "USD" && rates && `$${fmt(...)}`}
{heroCurrency === "EUR" && rates && `€${fmt(...)}`}
{(heroCurrency !== "TRY" && !rates) && `₺${fmt(...)}`}
```

When conditions flip, React tries to remove a text node that the browser has already merged with an adjacent one. This is a well-known React bug with adjacent conditional text nodes -- it causes `removeChild: NotFoundError`.

The same pattern exists for the "Harcanabilir" line below it (lines 325-328).

Additionally, `SoloCopilot` and `ProjectStatusDonut` are plain function components that receive refs (visible in console warnings), which contributes to instability.

## Plan

### 1. Fix hero card conditional text (Dashboard.tsx)
Replace the four adjacent conditional text expressions with a single computed value using a helper or ternary, for both "Toplam Kazanc" and "Harcanabilir":

```tsx
// Before (4 adjacent conditionals):
{heroCurrency === "TRY" && ...}
{heroCurrency === "USD" && rates && ...}
...

// After (single expression):
{heroCurrency === "TRY"
  ? `₺${fmt(toplamKazanc)}`
  : rates
    ? heroCurrency === "USD"
      ? `$${fmt(toplamKazanc / rates.USD)}`
      : `€${fmt(toplamKazanc / rates.EUR)}`
    : `₺${fmt(toplamKazanc)}`}
```

Same fix for the "Harcanabilir" line.

### 2. Fix forwardRef warnings (SoloCopilot.tsx, ProjectStatusDonut.tsx)
Wrap both components with `React.forwardRef` to eliminate the ref warnings that destabilize React's reconciler.

### 3. Files changed
- `src/pages/Dashboard.tsx` -- replace conditional text nodes with single expressions
- `src/components/SoloCopilot.tsx` -- wrap with forwardRef
- `src/components/dashboard/ProjectStatusDonut.tsx` -- wrap with forwardRef

