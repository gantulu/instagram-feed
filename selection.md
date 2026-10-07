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
DATE NOW
 ↓
CALENDAR
 ↓
CATEGORY + CONTENT INTENT
 ↓
SUBJECT
 ↓
ACTION
 ↓
BACKGROUND_ELEMENT
 ↓
COMPATIBILITY FILTER
 ↓
PRIORITY CONSTRAINT
 ↓
EDITORIAL RELEVANCE
 ↓
FINAL PROMPT
```

## Rule 1 — DATE NOW

`DATE NOW` means the current date on the day the workflow is executed.

Use ISO date format:

```text
YYYY-MM-DD
```

Do not ask the user to provide today's date unless the execution environment cannot determine the current date.

## Rule 2 — Calendar

Read `calendar.md` and find the entry matching `DATE NOW`.

Each calendar entry must provide only:

```text
date
category
content_intent
```

Example:

```markdown
## 2026-10-08
category: store
content_intent: customer_experience
```

If today's date is not present in `calendar.md`:

```text
STOP
```

Do not use a nearby date, invent a category, invent a content intent, or create a fallback editorial plan.

## Rule 3 — Subject Selection

Select exactly one subject.

Selection context:

```text
CATEGORY
+
CONTENT INTENT
↓
SUBJECT CANDIDATES
```

Filter candidates by compatibility first.

Then apply the priority constraint.

Priority values are shared by all variable types:

```text
1 = Highest
2 = Medium
3 = Lower
```

Priority is a constraint, not the final decision.

If compatible candidates exist at Priority 1, evaluate only Priority 1 candidates.
If none exist, evaluate Priority 2 candidates.
If none exist, evaluate Priority 3 candidates.
If no compatible candidate exists, STOP.

Among the remaining candidates, select the one with the strongest editorial relevance to the category and content intent.

## Rule 4 — Action Selection

Select exactly one action.

Selection context:

```text
CATEGORY
+
CONTENT INTENT
+
SELECTED SUBJECT
↓
ACTION CANDIDATES
```

The action must:
- be compatible with the selected subject
- be compatible with the category
- express the content intent
- create a visually understandable moment
- support the subject as the primary focal point

Apply the same compatibility → priority constraint → editorial relevance process defined for Subject.

Never select an incompatible action.

## Rule 5 — Background Element Selection

Select exactly one background element.

Selection context:

```text
CATEGORY
+
CONTENT INTENT
+
SELECTED SUBJECT
+
SELECTED ACTION
↓
BACKGROUND CANDIDATES
```

The background element must:
- be compatible with the selected subject
- be compatible with the selected action
- be compatible with the category
- reinforce the content intent
- preserve visual hierarchy
- remain secondary to the subject
- avoid unnecessary clutter

Apply the same compatibility → priority constraint → editorial relevance process defined for Subject.

Never select an incompatible background element.

## Rule 6 — Compatibility

Compatibility is mandatory.

The final combination must satisfy:

```text
SUBJECT
  ↕
ACTION
  ↕
BACKGROUND_ELEMENT
```

Do not relax compatibility to obtain a result.

If no compatible candidate remains after Priority 1 → 2 → 3, STOP.

## Rule 7 — Editorial Relevance

Editorial relevance is the final decision layer after compatibility and priority filtering.

Evaluate candidates against:
1. category relevance
2. content intent relevance
3. visual clarity
4. coherence with previously selected variables
5. support of the subject as the primary focal point

Do not select randomly.

## Rule 8 — No Previous Usage

Do not use history, previous usage, or a history file as a selection input in V1.

Selection is based only on:
- current date
- calendar category
- calendar content intent
- compatibility
- priority
- editorial relevance
- selected upstream variables

## Rule 9 — Fixed Requirements

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

## Rule 10 — Final Prompt

After all three variables are selected, substitute them into `prompt.md`.

The final prompt must contain:
- exactly one subject
- exactly one action
- exactly one background element

No unresolved dynamic variable may remain.

## Selection Principle

```text
CALENDAR CONTEXT
+
COMPATIBILITY
+
PRIORITY CONSTRAINT
+
EDITORIAL RELEVANCE
=
BEST VALID VARIABLE COMBINATION
```

The system must prefer the most relevant valid combination, never an arbitrary or incompatible combination.
