# Pattern variable rubric

Used with `pnpm audit:sheets` and `/audit-review`.

## Current scope: remove variables that do nothing
Only remove (inline the default of) a numeric variable whose whole range barely changes
the pattern, e.g. `thick_wavy.fill`, `two_color_circles.gap`, `optical_illusion.fill`.
AI-added `gap`, `fill`, `fillStop`, `arm*`-style names are often this.

Do **not** narrow ranges, remove variables that do something (even if it looks chaotic
or broken), or add variables: those are taste calls the owner makes.

When picking a range for a new dial, a value that breaks the original shape is fine if it
makes a coherent, different-looking pattern. Only cut range ends that go blank, solid,
hairline-thin or glitchy (slivers, seams).

## Reference
Patterns where every variable is good: `distorted_mesh`, `braided_lines`, `curved_lines`,
`geometric_flowers`, `zigzag`.
