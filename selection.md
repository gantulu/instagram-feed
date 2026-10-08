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

Supabase is the source of truth for variable data and calendar records.

GitHub is the source of truth for:
- selection logic
- selection rules
- scoring contract
- `prompt.md`

Use these tables as the only variable data source:

```text
variable_subjects
variable_actions
variable_backgrounds
variable_subject_actions
variable_action_backgrounds
variable_calendars
```

Do not read or use these legacy files as operational variable data:
- `variables/subject.md`
- `variables/action.md`
- `variables/background-element.md`
- `calendar.md`

## Edge Function

All variable data and selection results are read through the public Supabase Edge Function:

```text
https://oszqantvugvbvydlizix.supabase.co/functions/v1/variables
```

JWT is not required.

Selection endpoint:

```text
?resource=selection
?resource=selection&date=YYYY-MM-DD
```

The consumer must not access the `variable_*` tables directly.

## Selection Flow

```text
DATE NOW
 ↓
variable_calendars
 ↓
CATEGORY + CONTENT INTENT
 ↓
ACTIVE SUBJECTS
 ↓
SUBJECT ↔ ACTION COMPATIBILITY
 ↓
ACTIVE ACTIONS
 ↓
ACTION ↔ BACKGROUND COMPATIBILITY
 ↓
ACTIVE BACKGROUNDS
 ↓
VISUAL FIT
 ↓
DETERMINISTIC SCORE
 ↓
ONE SELECTED COMBINATION
```

## Hard Constraints

A valid combination must satisfy all of these:

1. Active calendar exists for the requested date.
2. Subject matches calendar `category`.
3. Subject matches calendar `content_intent`.
4. Subject is active.
5. Subject ↔ Action exists in `variable_subject_actions`.
6. Action matches calendar `category`.
7. Action matches calendar `content_intent`.
8. Action is active.
9. Action ↔ Background exists in `variable_action_backgrounds`.
10. Background matches calendar `category`.
11. Background matches calendar `content_intent`.
12. Background is active.

Compatibility must never be relaxed.

If any required stage has no valid candidate:

```text
STOP
```

## Deterministic Scoring

After all hard constraints are satisfied, score every valid combination.

### Subject

- `primary_subject`: +20
- `medium` scale: +10
- `wide` scale: +5
- `primary` focal: +20
- `center` composition: +15
- `low` complexity: +10
- `medium` complexity: +5

### Action

- `subject_action`: +20
- `primary` focal: +20
- `center` composition: +15
- `low` complexity: +10
- `medium` complexity: +5

### Background

- `supporting_background`: +15
- `tertiary` focal: +15
- `background` composition: +15
- `low` complexity: +10
- `medium` complexity: +5

Select the highest-scoring valid combination.

Tie-break:

```text
subject.id ASC
→ action.id ASC
→ background.id ASC
```

The tie-break exists only for determinism. It is not a priority system.

## Selection Response Contract

A successful selection returns:

```text
{
  engine_version,
  status: "selected",
  date,
  calendar,
  selected,
  candidates,
  scoring
}
```

`selected` contains exactly one:

```text
subject
action
background
score
```

`candidates` contains every valid combination and its score so the result can be verified.

When no active calendar exists:

```text
{
  status: "stopped",
  reason: "NO_ACTIVE_CALENDAR"
}
```

When the calendar exists but no valid combination exists:

```text
{
  status: "stopped",
  reason: "NO_VALID_COMBINATION"
}
```

An invalid date is rejected with HTTP 400.

## Current Date

When no date is provided, the Edge Function determines the date using the canonical timezone:

```text
Asia/Kuala_Lumpur
```

A caller may provide an explicit date for deterministic testing.

## No Priority

There is no priority system.

Do not use:
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

## No Previous Usage

Do not use history or previous usage as a selection input.

## Final Prompt

Prompt rendering is intentionally a separate stage.

The Selection Engine returns the selected variables.
It does not render `prompt.md` yet.

The next stage will consume:

```text
selected.subject
selected.action
selected.background
```

and substitute them into `prompt.md`.

No unresolved dynamic variable may remain in the final prompt.

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
