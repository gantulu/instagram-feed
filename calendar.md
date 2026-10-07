# INSTAGRAM FEED CONTENT CALENDAR

## Version
V1.0

## Purpose

This file is the **Content Planning Engine** for `daily_image.md`.

It determines what content direction should be used for the current date.

It does **not** generate image prompts.

## Brand

Apple The Exchange TRX

## Platform

Instagram Feed

## Default Format

4:5 Portrait

## Date Engine

Always evaluate rules against the actual current execution date.

Use ISO date format:

YYYY-MM-DD

Use ISO month format:

YYYY-MM

A rule is active only when its date conditions are satisfied.

## Content Categories

### C01 — Product
Apple product focused content.

### C02 — Product in Use
Apple products being used in real-life situations.

### C03 — Store
Apple The Exchange TRX store and architectural experience.

### C04 — People
Customers, Apple Specialists, creators, and people.

### C05 — Lifestyle
Apple integrated into everyday lifestyle.

### C06 — Today at Apple
Creative sessions, learning, and activities.

### C07 — Community
People gathering and sharing experiences.

### C08 — TRX & Kuala Lumpur
The Exchange TRX and Kuala Lumpur context.

### C09 — Detail
Product, architecture, material, light, and texture details.

### C10 — Story
Visual storytelling around Apple and its experience.

### C11 — Seasonal
Seasonal and cultural moments.

### C12 — Creative
Conceptual and artistic Apple-related content.

## Weekly Rotation

Use this as the fallback weekly schedule.

| Day | Category |
|---|---|
| Monday | C01 |
| Tuesday | C05 |
| Wednesday | C04 |
| Thursday | C03 |
| Friday | C02 |
| Saturday | C07 |
| Sunday | C12 |

## Monthly Direction

### 2026-10

Theme:
Urban Creativity

Focus:
Apple × The Exchange TRX × Kuala Lumpur

Preferred Categories:
C01, C02, C03, C04, C05, C08

## Seasonal Events

Add date-bounded seasonal rules here.

Format:

### S01 — Event Name

Start:
YYYY-MM-DD

End:
YYYY-MM-DD

Category:
C11

Theme:
Event theme

Creative Direction:
Visual creative direction

Priority:
HIGH

## Special Dates

Add date-specific rules here.

Format:

### D01 — Date Name

Date:
YYYY-MM-DD

Category:
C11

Theme:
Date theme

Creative Direction:
Visual creative direction

Priority:
HIGH

## Campaigns

Add date-bounded campaign rules here.

Format:

### CAM01 — Campaign Name

Start:
YYYY-MM-DD

End:
YYYY-MM-DD

Categories:
C01, C02

Theme:
Campaign theme

Creative Direction:
Campaign visual direction

Priority:
HIGH

## Priority Rules

When multiple rules apply to the current date, use this order:

1. Special Date
2. Active Campaign
3. Seasonal Event
4. Monthly Direction
5. Weekly Rotation
6. Default Category

Only the highest applicable priority determines the primary content direction.

## Default Category

If no dated rule, campaign, seasonal event, monthly direction, or weekly rotation applies:

Category:
C01

Theme:
Apple product

Creative Direction:
Premium editorial product photography

Priority:
DEFAULT

## Creative Direction Rules

The selected category, theme, and creative direction should guide `daily_image.md`.

Do not place final image-generation prompts in this file.

Do not store content history in this file.

Do not require a separate content-history file for V1.

## Output Contract

The planning engine should resolve internally to:

DATE:
YYYY-MM-DD

CATEGORY:
Cxx — Category Name

THEME:
Resolved theme

CREATIVE_DIRECTION:
Resolved creative direction

PRIORITY:
SPECIAL_DATE | CAMPAIGN | SEASONAL | MONTHLY | WEEKLY | DEFAULT

This output is internal planning data for `daily_image.md`.
