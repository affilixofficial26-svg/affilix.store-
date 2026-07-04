---
name: Affilix Digital Hub
colors:
  surface: '#10131c'
  surface-dim: '#10131c'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181b24'
  surface-container: '#1c1f28'
  surface-container-high: '#272a33'
  surface-container-highest: '#31353e'
  on-surface: '#e0e2ee'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e0e2ee'
  inverse-on-surface: '#2d3039'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#bec2ff'
  on-tertiary: '#000ba6'
  tertiary-container: '#7a85ff'
  on-tertiary-container: '#000993'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bec2ff'
  on-tertiary-fixed: '#00046a'
  on-tertiary-fixed-variant: '#1e2bca'
  background: '#10131c'
  on-background: '#e0e2ee'
  surface-variant: '#31353e'
  surface-card: '#0F172A'
  border-glass: rgba(255, 255, 255, 0.1)
  success-emerald: '#10B981'
  text-muted: '#94A3B8'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
The brand personality is high-tech, intelligent, and authoritative, positioning itself as a central nervous system for AI-driven commerce. It targets tech-savvy entrepreneurs and data analysts who require high density and rapid insight.

The design system utilizes a **Glassmorphic / Modern Corporate** hybrid style. This approach pairs deep, immersive backgrounds with translucent UI layers to create a sense of infinite digital space. The aesthetic evokes "The Command Center"—a place where complex AI operations are visualized with clarity and futuristic elegance.

Visual principles include:
- **Depth through Transparency:** Layers use backdrop blurs rather than solid fills to maintain a cohesive environment.
- **Luminescent Accents:** High-vibrancy purples and cyans are used sparingly to guide attention and signify active AI processing.
- **Precision:** Fine lines and geometric rigor reflect the underlying algorithmic accuracy of the platform.

## Colors
The palette is rooted in a "Midnight" foundation, utilizing `#070A12` for deep backgrounds to allow vibrant accents to "glow" off the screen. 

- **Primary (Vivid Violet):** Used for primary actions, active navigation states, and high-level AI status indicators.
- **Secondary (Cyan Pulse):** Used for data visualizations, secondary highlights, and interactive elements that require a distinct "tech" feel.
- **Tertiary (Electric Indigo):** Bridges the gap between primary and secondary, used for specific category badges or secondary buttons.
- **Functional Gradients:** Use linear gradients (e.g., Primary to Secondary) only for high-impact hero sections or primary call-to-action buttons to maintain a professional, rather than recreational, tone.

## Typography
The system uses **Plus Jakarta Sans** for headlines to provide a modern, slightly rounded, and welcoming technological feel. For body text and data-rich interfaces, **Inter** is the workhorse, chosen for its exceptional legibility at small sizes in high-density dashboard layouts.

- **Scale:** High contrast between display types and body text helps establish a clear hierarchy in the storefront.
- **Data Display:** For numeric values in the dashboard, use `Inter` with tabular numbers enabled to ensure columns of data align perfectly.
- **Case:** Labels for metadata or small UI badges should use uppercase with slight letter spacing to improve scannability against dark backgrounds.

## Layout & Spacing
This design system utilizes a **12-column fixed-width grid** for desktop storefront views and a **fluid dashboard layout** for the admin interface.

- **Storefront:** Centered container with a 1440px max-width. Sections are separated by large vertical "stacks" (`stack-lg`) to give the product room to breathe.
- **Dashboard:** Side-navigation remains fixed (240px). The main content area uses fluid percentage widths with a minimum gutter of `1.5rem` between cards. 
- **Density:** The dashboard uses a "Compact" density model where padding inside cards is kept to `1rem` to maximize the amount of visible data above the fold. Storefront cards use `1.5rem` to `2rem` padding for a more premium, consumer-focused feel.

## Elevation & Depth
Depth is not communicated through traditional shadows, but through **Tonal Layering and Backdrop Blurs**.

- **Level 0 (Background):** Solid `#070A12`.
- **Level 1 (Cards/Containers):** Background `rgba(15, 23, 42, 0.6)` with a `20px` backdrop-blur. A `1px` border of `rgba(255, 255, 255, 0.08)` defines the edge.
- **Level 2 (Modals/Popovers):** Background `rgba(30, 41, 59, 0.8)` with a `40px` backdrop-blur. Use a subtle outer glow of the primary color (`rgba(139, 92, 246, 0.15)`) instead of a black shadow.
- **Interaction:** Hovering over a Level 1 card should increase the border opacity to `rgba(255, 255, 255, 0.2)` and slightly brighten the background fill.

## Shapes
A **Rounded** (`0.5rem`) language is used throughout to soften the "industrial" feel of the high-tech aesthetic, making the AI platform feel accessible.

- **Standard Elements:** Buttons, input fields, and small cards use the base `0.5rem`.
- **Large Containers:** Dashboard widgets and storefront sections use `1rem` (`rounded-lg`).
- **Feature Elements:** Promotional banners or "Hero" cards may use `1.5rem` (`rounded-xl`) to stand out from the systematic grid.
- **Icons:** Use icons with a `1.5px` stroke and rounded terminals to match the font geometry.

## Components
- **Buttons:**
    - *Primary:* Gradient fill (Primary to Tertiary), white text, no border.
    - *Secondary:* Glass background, `1px` border using Secondary color, Secondary color text.
    - *Ghost:* No background, white text, visible only on hover with a subtle gray tint.
- **Input Fields:** Dark background (`#020617`), `1px` border, placeholder text in `text-muted`. On focus, the border changes to Primary color with a subtle outer glow.
- **Chips/Badges:** Small, caps-case text. Success states use Emerald green backgrounds at 10% opacity with solid Emerald text. 
- **Cards:** The cornerstone of the dashboard. Must include a `1px` top-light highlight (linear gradient border: white at 10% to transparent) to simulate light hitting the top edge.
- **Lists:** Table rows in the dashboard use a subtle hover state (`rgba(255, 255, 255, 0.03)`). Vertical separators should be avoided; use whitespace and horizontal lines only.
- **Charts:** Use the Primary and Secondary colors for data lines. Area charts should use a vertical gradient fill from the line color to transparent.