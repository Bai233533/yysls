---
name: Wuxia Noir
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#0f0f0f'
  on-primary-container: '#7d7b7b'
  inverse-primary: '#5f5e5e'
  secondary: '#e9c176'
  on-secondary: '#412d00'
  secondary-container: '#604403'
  on-secondary-container: '#dab36a'
  tertiary: '#ffb4a9'
  on-tertiary: '#690001'
  tertiary-container: '#290000'
  on-tertiary-container: '#d35041'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#8a1b13'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  headline-xl:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

The design system is rooted in the "Wuxia Noir" aesthetic—a cinematic blend of traditional Chinese martial arts philosophy and a dark, gritty, contemporary edge. It targets a high-end gaming audience, evoking a sense of mystery, historical gravity, and technical precision. 

The visual direction combines **Minimalism** with **Tactile** elements. High-contrast ink-wash textures and atmospheric "light rays" break through deep, charcoal voids to create depth. Surfaces are treated with subtle paper grain and metallic leafing to balance the ancient setting with modern digital functionality. The emotional goal is to make the user feel like they are navigating a sacred, historical archive or a high-stakes tactical command center.

## Colors

The palette is dominated by **Ink Black** (#0F0F0F) and **Deep Charcoal** (#1A1A1A), creating a light-absorbing canvas that allows highlights to pop with cinematic intensity. 

- **Muted Gold (#C5A059):** Reserved for high-value information, primary buttons, and ornamental flourishes. It represents the "wind" and the prestige of the martial arts world.
- **Cinnabar Red (#A93226):** Used sparingly for critical alerts, notifications, and secondary interaction highlights. It evokes traditional stamps and blood.
- **Off-White (#E0E0E0):** The primary text color, chosen to reduce eye strain against the black background while maintaining a parchment-like warmth.

## Typography

This design system utilizes a dual-font strategy to balance theme with utility. 

**Noto Serif** is used for headlines to echo the elegance of traditional Chinese calligraphy and brushwork. It provides a literary, authoritative feel. For Chinese language implementation, a high-quality calligraphic typeface (similar to the game logo) should be swapped in for display sizes.

**Hanken Grotesk** serves as the functional workhorse. Its sharp, contemporary grotesque letterforms ensure that management tools and complex game stats remain legible and professional. 

**Mobile Scaling:** Headlines above 32px should scale down by 25% on mobile devices, while body text remains consistent for accessibility.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to maintain a cinematic composition, transitioning to a fluid layout on smaller breakpoints. 

- **Grid:** A 12-column grid with generous 24px gutters. 
- **Rhythm:** An 8px base unit drives all spacing (padding, margins).
- **Negative Space:** Use "aggressive" whitespace around headline elements to create focus, mimicking the composition of traditional ink paintings where the "emptiness" is as important as the "ink."
- **Reflow:** On mobile, side margins shrink to 16px, and multi-column card layouts stack vertically into a single-column scroll.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Atmospheric Lighting** rather than standard shadows.

1.  **Base Layer:** Solid Ink Black (#0F0F0F).
2.  **Surface Layer:** Translucent Charcoal (#1A1A1A at 80% opacity) with a 16px backdrop blur for management panels.
3.  **Accent Depth:** Gold and Red elements use an "inner glow" effect rather than a drop shadow to simulate a metallic or lacquered finish catching the light.
4.  **Fog/Ink Effects:** Subtle radial gradients (from #252525 to transparent) should be used behind primary content blocks to create a "spotlight" effect, drawing the eye to specific UI modules.

## Shapes

The design system utilizes **Sharp (0)** edges to reflect the precision of a blade and the architectural rigidity of traditional Chinese structures. 

Corners should remain 90 degrees for buttons, input fields, and containers. The only exceptions are purely ornamental elements (like circular ink-stamp icons) or specific decorative borders that use hand-drawn brush stroke masks. This sharpness reinforces the "Noir" aesthetic—serious, cold, and disciplined.

## Components

### Buttons
- **Primary:** Solid Muted Gold background with a subtle linear gradient to simulate metallic sheen. Text is Ink Black for maximum contrast.
- **Secondary:** Transparent with a 1px Gold border. Text is Gold.
- **Hover State:** Add a faint "ink splatter" or glow effect behind the button.

### Input Fields & Selects
- Sharp, 1px Off-White borders at 20% opacity. 
- On focus, the border transitions to Muted Gold and the background becomes slightly more opaque.

### Cards & Panels
- Use the Translucent Dark Panel style with a "paper grain" texture overlay (low opacity).
- Headers within panels should be separated by a thin, Gold-to-Transparent horizontal rule.

### Chips & Tags
- Used for game categories or status. Small, Sharp boxes with Cinnabar Red backgrounds for high-priority items and Charcoal backgrounds for neutral metadata.

### Atmospheric Elements
- **Scrollbar:** Minimalist Gold line on a transparent track.
- **Dividers:** Use a "fading ink" stroke—a line that tapers off at the ends rather than a solid geometric line.