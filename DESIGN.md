---
name: The Inference
description: A precise editorial system for AI reporting, evidence, and historical intelligence.
colors:
  paper: "#f8f8f5"
  ink: "#20211f"
  muted: "#62645e"
  line: "#d2d3cc"
  soft: "#eeeee9"
  publication-red: "#aa3028"
  inverse-paper: "#f7f7f2"
  panel: "#232520"
  dark-paper: "#191b18"
  dark-ink: "#eceee5"
  dark-muted: "#a9ada1"
  dark-line: "#41463d"
  dark-soft: "#252923"
  dark-publication-red: "#f08c7c"
  dark-inverse: "#191b18"
  dark-panel: "#e6e9df"
  brief-accent: "#de8a74"
  dark-brief-accent: "#a02c20"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "55px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Source Sans 3 Variable, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Source Sans 3 Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  square: "0"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "9px 16px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "9px 16px"
    height: "42px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "10px 12px"
  status:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "3px 6px"
---

# Design System: The Inference

## Overview

**Creative North Star: "The Editor’s Running Order"**

The Inference is a newspaper desk sharpened by the discipline of a financial terminal. Neutral paper, charcoal type, fine rules, and compact editorial modules make the reporting feel authoritative without becoming ceremonial. The system is dense but not cramped: hierarchy comes from typography, alignment, and evidence-led ordering rather than decorative containers.

The public reading surfaces and private newsroom share one visual grammar. Serif headlines carry editorial weight; sans-serif copy carries navigation, metadata, controls, and operational state. Light and dark themes reverse the material while preserving contrast, hierarchy, and the sparing signal role of publication red.

**Key Characteristics:**

- Editorial serif headlines paired with compact sans-serif interface copy.
- Square, flat surfaces separated by one-pixel rules and occasional three-pixel section rules.
- Publication red used only for urgency, review state, focus, and active wayfinding.
- Information-dense grids that collapse into a deliberate reading order on small screens.
- Light and dark themes built from parallel paper, ink, muted, line, soft, accent, inverse, and panel roles.

## Colors

The palette is warm-neutral and ink-led, with publication red acting as a scarce editorial signal rather than a decorative brand wash.

### Primary

- **Publication Red:** Marks breaking labels, active front-page navigation, focus outlines, review states, and the masthead stop.

### Secondary

- **Brief Coral:** Highlights the title accent inside the dark Daily Brief panel; its darker counterpart maintains the role in dark mode.

### Neutral

- **Paper:** The default page and field surface in the light theme.
- **Ink:** Primary copy, strong rules, filled actions, and inverted reading panels.
- **Muted Ink:** Secondary copy, timestamps, captions, and supporting metadata.
- **Hairline:** Fine separators, input strokes, and quiet structural borders.
- **Soft Paper:** Low-contrast callouts, notices, status labels, and secondary-action hover states.
- **Inverse Paper:** Text on the dark panel and other inverted surfaces.
- **Panel Charcoal:** The Daily Brief and other emphatic inverted editorial modules.
- **Dark Theme Roles:** Dark paper, light ink, softened supporting copy, restrained olive-charcoal rules, and a lighter red preserve the same semantic hierarchy after inversion.

### Named Rules

**The Red Is Signal Rule.** Publication red is reserved for urgency, editorial state, keyboard focus, and active wayfinding; it does not fill ordinary containers.

**The Paper-and-Ink Rule.** Default surfaces remain paper and ink; soft fills and inverse panels clarify hierarchy without creating a multicolor card system.

## Typography

**Display Font:** Source Serif 4 (with Georgia and serif fallbacks)  
**Body Font:** Source Sans 3 Variable (with sans-serif fallback)  
**Label/Mono Font:** Source Sans 3 Variable; tabular numerals are enabled for time and data where alignment matters.

**Character:** Source Serif 4 supplies the gravity and readable texture of a serious publication. Source Sans 3 keeps dense navigation, metadata, forms, and newsroom operations compact and legible.

### Hierarchy

- **Display** (700, masthead scale, 1 line-height): Reserved for the publication masthead, with tight tracking and a smaller prefix.
- **Headline** (600, lead-story scale, 1.14 line-height): Dominant story and article headlines; article pages rise to a larger 52px expression while mobile headlines remain in the high 30s.
- **Title** (600, section-story scale, 1.25 line-height): Story rows, directory entries, secondary leads, and compact wire headlines.
- **Body** (400, base reading scale, 1.5 line-height): Interface copy and summaries; long-form report text switches to Source Serif 4 at 19px with a 1.8 line-height and a 760px reading column.
- **Label** (600, metadata scale, 0.05em letter-spacing): Section metadata, desk names, states, timestamps, and uppercase operational labels.

### Named Rules

**The Serif Carries Reporting Rule.** Use Source Serif 4 for mastheads, story headlines, and long-form report copy; use Source Sans 3 for navigation, metadata, summaries, controls, and newsroom operations.

**The Metadata Stays Small Rule.** Labels and timestamps sit between 10px and 13px, gaining distinction through weight, tracking, case, and tabular numerals rather than size.

## Layout

Public pages sit in a centered 1424px shell with 40px side padding, reducing to 28px below 1200px and 18px below 640px. The front page uses a three-column editorial grid with weighted lead, wire, and intelligence columns; it becomes two columns below 980px and a single running order below 640px. Column boundaries are fine vertical rules, and major desk boundaries use stronger three-pixel horizontal rules.

The system uses a compact rhythm drawn repeatedly from 4px, 8px, 12px, 16px, 20px, 28px, and 40px intervals. Article pages use a rail, a reading column capped at 760px, and remaining context space; below 980px the rail becomes a horizontal in-flow index. Directory, change, and form grids reduce from multi-column arrangements to one column on small screens. Navigation remains horizontally scrollable instead of hiding core desks.

**The Running Order Rule.** Responsive layouts preserve editorial priority: the lead and its change summary precede the wire, supporting intelligence, and archive material.

## Elevation & Depth

The system uses no box shadows. Depth comes from tonal inversion, soft paper fills, one-pixel separators, three-pixel section rules, and sticky positioning for article rails and form actions.

### Named Rules

**The Flat-by-Default Rule.** Surfaces remain flat; hierarchy is expressed through rules, contrast, spacing, and type rather than simulated elevation.

## Shapes

Controls, fields, notices, cards, panels, and status labels use square corners. One-pixel borders define interactive and informational boundaries; three-pixel rules mark publication-scale transitions. The only recurring rounded shape is the six-pixel live-status dot, where circular geometry communicates a signal rather than a container.

**The Square Instrument Rule.** Keep containers and controls rectilinear; reserve circles for compact status indicators.

## Components

### Buttons

- **Shape:** Square with a one-pixel border and a 42px minimum height.
- **Primary:** Ink fill on paper with 9px by 16px padding, 14px semibold text, and a 14px internal gap.
- **Hover / Focus:** Hover shifts the fill to muted ink; keyboard focus uses the global two-pixel publication-red outline with a four-pixel offset.
- **Secondary:** Transparent on paper with a hairline border; hover introduces the soft-paper fill.

### Chips

- **Style:** Editorial status labels use a soft-paper field, square corners, 3px by 6px padding, and compact uppercase sans-serif text.
- **State:** Published adds an ink underline; review and pending states switch the label text to publication red.

### Cards / Containers

- **Corner Style:** Square throughout.
- **Background:** Most content remains on the page surface; change panels and notices use soft paper, while the Daily Brief uses the inverse panel.
- **Shadow Strategy:** None; see Elevation & Depth.
- **Border:** Fine hairlines divide rows and columns; strong top rules introduce important sections.
- **Internal Padding:** Compact modules typically use 16px to 22px; the larger briefing feature uses 30px on wide screens.

### Inputs / Fields

- **Style:** Paper background, hairline border, square corners, 10px by 12px padding, and 15px regular sans-serif input text.
- **Focus:** The global publication-red outline appears outside the field; the caret also uses publication red.
- **Error / Disabled:** Error notices use publication-red text and border. Disabled actions retain their form but fall to 55% opacity and show a waiting cursor.

### Navigation

The main navigation is compact 13px semibold sans-serif between a three-pixel ink top rule and a one-pixel ink bottom rule. The active front-page route is publication red; ordinary links use underline on hover. On mobile the desk list scrolls horizontally, the search label collapses to its icon, and the navigation remains available.

### What Changed

The signature change panel uses a soft-paper fill, an ink top rule, compact uppercase heading, serif delta mark, and an unbulleted list of concise changes. It appears immediately beside or below the report entry point so readers understand the concrete change before opening the full story.

### Story Rows

Story rows are border-separated editorial records: tabular date/time at left, metadata and a serif title in the center, and a directional link at right. The optional change line uses the serif delta mark but remains ink-colored rather than becoming another accent treatment.

## Do's and Don'ts

### Do:

- **Do** lead with the reporting hierarchy: serif headline, concise deck or summary, metadata, and the concrete change.
- **Do** use fine ink and hairline rules to organize dense material, with three-pixel rules reserved for major publication boundaries.
- **Do** preserve the semantic light/dark role mapping instead of treating dark mode as a separate visual identity.
- **Do** keep interactive fields and buttons square, legible, and visibly keyboard-focused.

### Don't:

- **Don't** use publication red as a broad decorative fill or routine section color.
- **Don't** introduce rounded-card grids, floating containers, or drop shadows into the flat newsroom grammar.
- **Don't** replace the serif/sans role split with a single undifferentiated type treatment.
- **Don't** hide core desk navigation on small screens; preserve it as a reachable horizontal strip.
