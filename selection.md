# VARIABLE SELECTION

## Purpose

Define how the dynamic variables used by `prompt.md` are selected.

Dynamic variables:
- `{{subject}}`
- `{{action}}`
- `{{background_element}}`

This file is the selection and decision layer.
It does not replace `prompt.md` and does not modify fixed prompt requirements.

## Selection Flow

```text
DATE
 ↓
CALENDAR
 ↓
CATEGORY
 ↓
CONTENT INTENT
 ↓
SUBJECT
 ↓
ACTION
 ↓
BACKGROUND_ELEMENT
 ↓
COMPATIBILITY CHECK
 ↓
FINAL PROMPT
```

## Rule 1 — Calendar and Category

When a calendar entry is available:

1. Read the applicable calendar entry.
2. Identify the selected `category`.
3. Identify the intended editorial direction or theme.
4. Use these as the primary context for variable selection.

If no calendar entry is available, use the user's explicit content intent as the primary context.

Do not invent a calendar category when one is not provided.

## Rule 2 — Content Intent

Determine the visual intent before selecting variables.

Examples of intent:
- product discovery
- store exploration
- customer experience
- architecture
- lifestyle
- technology
- community
- brand environment

The content intent must be consistent with the selected category.

## Rule 3 — Subject

Select exactly one subject.

Selection priority:
1. category compatibility
2. content intent compatibility
3. editorial relevance
4. visual clarity

The subject must be suitable for the intended scene.

Do not select a subject solely because it is available.

## Rule 4 — Action

Select exactly one action.

The action must:
- be compatible with the selected subject
- express the content intent
- create a visually understandable moment
- support the subject as the primary focal point

Never select an action that is incompatible with the subject.

## Rule 5 — Background Element

Select exactly one background element.

The background element must:
- support the selected subject
- support the selected action
- reinforce the content intent
- preserve visual hierarchy
- remain secondary to the subject

Do not select a background element that creates unnecessary clutter or competes with the subject.

## Rule 6 — Compatibility

Before finalizing the variables, verify:

```text
SUBJECT
  ↕
ACTION
  ↕
BACKGROUND_ELEMENT
```

All three variables must form one coherent visual concept.

Reject and reselect any incompatible variable.

## Rule 7 — Fixed Requirements

Variable selection must never modify the fixed requirements defined in `prompt.md`.

Fixed requirements include:
- premium visual direction
- clean white background
- minimal composition
- photorealistic editorial style
- portrait 4:5 format
- 1080 × 1350 px minimum
- footer requirements
- brand handle requirements
- readability and visual-balance constraints

## Rule 8 — Output

After selection and validation, substitute the selected values into `prompt.md`.

The final prompt must contain:
- one subject
- one action
- one background element

No unresolved dynamic variable should remain in the final prompt.

## Selection Principle

Prefer the **most relevant and visually coherent combination**, not random selection.

The goal is:

```text
CATEGORY
+
CONTENT INTENT
+
SUBJECT
+
ACTION
+
BACKGROUND
=
ONE COHERENT VISUAL CONCEPT
```
