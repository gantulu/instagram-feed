# VARIABLE SELECTION

## Purpose

Define how the dynamic variables used by `prompt.md` are selected.

Dynamic variables:
- `{{subject}}`
- `{{action}}`
- `{{background_element}}`

This file is the selection and decision layer.
It does not replace `prompt.md` and does not modify fixed prompt requirements.

## Data Source

Variable data is stored in Supabase.

Supabase project:
`oszqantvugvbvydlizix`

Use these tables as the only variable data source:

```text
variable_subjects
variable_actions
variable_backgrounds
variable_subject_actions
variable_action_backgrounds
variable_calendars
```

Do not read or use:
- `variables/subject.md`
- `variables/action.md`
- `variables/background-element.md`
- `calendar.md`

GitHub remains the source of truth for this selection logic and `prompt.md`.
Supabase is the source of truth for variable data and calendar records.

## Edge Function Data Access

All variable data must be read through the public Supabase Edge Function.

Edge Function:

`https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables`

JWT is not required.

Do not access the `variable_*` tables directly from the client or selection consumer.

GET resources:

```text
?resource=subjects
?resource=actions
?resource=backgrounds
?resource=subject_actions
?resource=action_backgrounds
?resource=calendars&date=YYYY-MM-DD
```

Examples:

```text
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables?resource=subjects
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables?resource=actions
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables?resource=backgrounds
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables?resource=subject_actions
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables?resource=action_backgrounds
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables?resource=calendars&date=YYYY-MM-DD
```

The Edge Function is the public gateway to the six `variable_*` tables.

## Selection Flow

```text
DATE NOW
 ↓
variable_calendars
 ↓
CATEGORY + CONTENT INTENT
 ↓
variable_subjects
 ↓
variable_subject_actions
 ↓
variable_actions
 ↓
variable_action_backgrounds
 ↓
variable_backgrounds
 ↓
VISUAL FIT
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

Read `variable_calendars` from Supabase and find the row matching `DATE NOW`.

Required fields:

```text
date
category
content_intent
active
```

Only use rows where:

```text
active = true
```

If today's date is not present as an active row in `variable_calendars`:

```text
STOP
```

Do not use a nearby date, invent a category, invent a content intent, or create a fallback editorial plan.

## Rule 3 — Subject Selection

Select exactly one subject from `variable_subjects`.

Selection context:

```text
CATEGORY
+
CONTENT INTENT
↓
SUBJECT CANDIDATES
```

Filter only active subjects.

A subject is a valid candidate when:
- `category` contains the calendar category
- `content_intent` contains the calendar content intent

Do not use priority.

If no valid subject exists:

```text
STOP
```

Among valid candidates, evaluate visual fit and editorial relevance.

## Rule 4 — Action Selection

Select exactly one action from `variable_actions`.

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
- be active
- match the calendar category
- match the calendar content intent
- be linked to the selected subject in `variable_subject_actions`
- create a visually understandable moment
- support the subject as the primary focal point

If no valid action exists:

```text
STOP
```

Evaluate remaining candidates using visual fit and editorial relevance.

## Rule 5 — Background Element Selection

Select exactly one background element from `variable_backgrounds`.

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
- be active
- match the calendar category
- match the calendar content intent
- be linked to the selected action in `variable_action_backgrounds`
- reinforce the content intent
- preserve visual hierarchy
- remain secondary to the subject
- avoid unnecessary clutter

If no valid background exists:

```text
STOP
```

Evaluate remaining candidates using visual fit and editorial relevance.

## Rule 6 — Compatibility

Compatibility is a mandatory hard constraint.

Subject ↔ Action compatibility is defined by:

```text
variable_subject_actions
```

Action ↔ Background compatibility is defined by:

```text
variable_action_backgrounds
```

The final combination must satisfy:

```text
SUBJECT
  ↕
ACTION
  ↕
BACKGROUND_ELEMENT
```

Do not relax compatibility to obtain a result.

If no compatible candidate remains:

```text
STOP
```

## Rule 7 — Visual Fit

Visual metadata is a soft selection layer after hard constraints.

Evaluate:

- `visual_role`
- `subject_scale` when available
- `focal_priority`
- `composition_role`
- `visual_complexity`

The selected combination should:
- maintain a clear focal hierarchy
- keep the subject primary
- keep supporting elements secondary
- avoid unnecessary visual complexity
- produce a coherent composition

Do not use visual metadata as a substitute for compatibility.

## Rule 8 — Editorial Relevance

Editorial relevance is the final decision layer.

Evaluate:
1. category relevance
2. content intent relevance
3. visual clarity
4. coherence with previously selected variables
5. support of the subject as the primary focal point
6. consistency with the fixed requirements in `prompt.md`

Do not select randomly.

## Rule 9 — No Priority

There is no priority system in V1.1.

Do not use:
- `priority`
- priority ranking
- priority fallback
- priority-based selection

Selection is based on:

```text
Calendar Context
+
Compatibility
+
Visual Fit
+
Editorial Relevance
```

## Rule 10 — No Previous Usage

Do not use history, previous usage, or a history file as a selection input in V1.1.

Selection is based only on:
- current date
- calendar category
- calendar content intent
- active variable records
- compatibility
- visual metadata
- editorial relevance
- selected upstream variables

## Rule 11 — Fixed Requirements

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

## Rule 12 — Final Prompt

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
VISUAL FIT
+
EDITORIAL RELEVANCE
=
BEST VALID VARIABLE COMBINATION
```

The system must prefer the most relevant valid combination, never an arbitrary or incompatible combination.
