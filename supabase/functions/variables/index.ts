import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const tableMap = {
  subjects: "variable_subjects",
  actions: "variable_actions",
  backgrounds: "variable_backgrounds",
  subject_actions: "variable_subject_actions",
  action_backgrounds: "variable_action_backgrounds",
  calendars: "variable_calendars",
} as const;

type Resource = keyof typeof tableMap;
type Variable = {
  id: string;
  name: string;
  category: string[];
  content_intent: string[];
  visual_role: string;
  subject_scale?: string;
  focal_priority: string;
  composition_role: string;
  visual_complexity: string;
  active: boolean;
};
type Calendar = {
  date: string;
  category: string;
  content_intent: string;
  active: boolean;
};
type SubjectAction = { subject_id: string; action_id: string };
type ActionBackground = { action_id: string; background_id: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const has = (list: string[] | undefined, value: string) =>
  Array.isArray(list) && list.includes(value);

const isISODate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value);

const scoreSubject = (x: Variable) =>
  (x.visual_role === "primary_subject" ? 20 : 0) +
  (x.subject_scale === "medium" ? 10 : x.subject_scale === "wide" ? 5 : 0) +
  (x.focal_priority === "primary" ? 20 : 0) +
  (x.composition_role === "center" ? 15 : 0) +
  (x.visual_complexity === "low" ? 10 : x.visual_complexity === "medium" ? 5 : 0);

const scoreAction = (x: Variable) =>
  (x.visual_role === "subject_action" ? 20 : 0) +
  (x.focal_priority === "primary" ? 20 : 0) +
  (x.composition_role === "center" ? 15 : 0) +
  (x.visual_complexity === "low" ? 10 : x.visual_complexity === "medium" ? 5 : 0);

const scoreBackground = (x: Variable) =>
  (x.visual_role === "supporting_background" ? 15 : 0) +
  (x.focal_priority === "tertiary" ? 15 : 0) +
  (x.composition_role === "background" ? 15 : 0) +
  (x.visual_complexity === "low" ? 10 : x.visual_complexity === "medium" ? 5 : 0);

function compareCandidates(
  a: { subject: Variable; action: Variable; background: Variable; score: number },
  b: { subject: Variable; action: Variable; background: Variable; score: number },
) {
  return b.score - a.score ||
    a.subject.id.localeCompare(b.subject.id) ||
    a.action.id.localeCompare(b.action.id) ||
    a.background.id.localeCompare(b.background.id);
}

async function selectVariables(date: string) {
  if (!isISODate(date)) {
    return { status: "stopped", reason: "INVALID_DATE", date };
  }

  const [c, s, a, b, sa, ab] = await Promise.all([
    supabase.from("variable_calendars").select("*").eq("date", date).eq("active", true).limit(1),
    supabase.from("variable_subjects").select("*").eq("active", true),
    supabase.from("variable_actions").select("*").eq("active", true),
    supabase.from("variable_backgrounds").select("*").eq("active", true),
    supabase.from("variable_subject_actions").select("*"),
    supabase.from("variable_action_backgrounds").select("*"),
  ]);

  const error = [c.error, s.error, a.error, b.error, sa.error, ab.error].find(Boolean);
  if (error) throw error;

  const calendar = (c.data ?? [])[0] as Calendar | undefined;

  if (!calendar) {
    return {
      status: "stopped",
      reason: "NO_ACTIVE_CALENDAR",
      date,
      candidates: [],
    };
  }

  const subjects = s.data as Variable[];
  const actions = a.data as Variable[];
  const backgrounds = b.data as Variable[];
  const subjectActions = sa.data as SubjectAction[];
  const actionBackgrounds = ab.data as ActionBackground[];

  const candidates: {
    subject: Variable;
    action: Variable;
    background: Variable;
    score: number;
  }[] = [];

  for (const subject of subjects) {
    if (!has(subject.category, calendar.category) ||
        !has(subject.content_intent, calendar.content_intent)) continue;

    for (const link of subjectActions) {
      if (link.subject_id !== subject.id) continue;

      const action = actions.find((x) => x.id === link.action_id);
      if (!action ||
          !has(action.category, calendar.category) ||
          !has(action.content_intent, calendar.content_intent)) continue;

      for (const bgLink of actionBackgrounds) {
        if (bgLink.action_id !== action.id) continue;

        const background = backgrounds.find((x) => x.id === bgLink.background_id);
        if (!background ||
            !has(background.category, calendar.category) ||
            !has(background.content_intent, calendar.content_intent)) continue;

        candidates.push({
          subject,
          action,
          background,
          score: scoreSubject(subject) +
            scoreAction(action) +
            scoreBackground(background),
        });
      }
    }
  }

  if (!candidates.length) {
    return {
      status: "stopped",
      reason: "NO_VALID_COMBINATION",
      date,
      calendar,
      candidates: [],
    };
  }

  candidates.sort(compareCandidates);

  return {
    engine_version: "1.1",
    status: "selected",
    date,
    calendar,
    selected: candidates[0],
    candidates,
    scoring: {
      principle: "Hard constraints first; visual-fit score second; stable IDs break ties.",
      subject: {
        primary_subject: 20,
        medium_scale: 10,
        wide_scale: 5,
        primary_focal: 20,
        centered: 15,
        low_complexity: 10,
        medium_complexity: 5,
      },
      action: {
        subject_action: 20,
        primary_focal: 20,
        centered: 15,
        low_complexity: 10,
        medium_complexity: 5,
      },
      background: {
        supporting_background: 15,
        tertiary_focal: 15,
        background_role: 15,
        low_complexity: 10,
        medium_complexity: 5,
      },
      tie_break: "subject.id ASC, action.id ASC, background.id ASC",
    },
  };
}

const PROMPT_TEMPLATE_URL = "https://raw.githubusercontent.com/gantulu/instagram-feed/main/prompt.md";

function renderPrompt(template: string, selected: { subject: Variable; action: Variable; background: Variable }) {
  const replacements: Record<string, string> = {
    "{{subject}}": selected.subject.name,
    "{{action}}": selected.action.name,
    "{{background_element}}": selected.background.name,
  };

  let finalPrompt = template;
  for (const [token, value] of Object.entries(replacements)) {
    finalPrompt = finalPrompt.split(token).join(value);
  }

  const unresolved = [...finalPrompt.matchAll(/{{[^}]+}}/g)].map((match) => match[0]);
  if (unresolved.length) {
    throw new Error(`Unresolved dynamic variables: ${[...new Set(unresolved)].join(", ")}`);
  }

  return { final_prompt: finalPrompt, replacements };
}

async function buildFinalPrompt(date: string) {
  const selection = await selectVariables(date);

  if (selection.status !== "selected") return selection;

  const response = await fetch(PROMPT_TEMPLATE_URL, {
    headers: { "Accept": "text/plain" },
  });

  if (!response.ok) {
    throw new Error(`Failed to read prompt.md: HTTP ${response.status}`);
  }

  const template = await response.text();
  const rendered = renderPrompt(template, selection.selected);

  return {
    engine_version: selection.engine_version,
    prompt_engine_version: "1.0",
    status: "selected",
    date: selection.date,
    calendar: selection.calendar,
    selected: selection.selected,
    final_prompt: rendered.final_prompt,
    prompt_source: PROMPT_TEMPLATE_URL,
    prompt_variables: rendered.replacements,
  };
}

async function readResource(resource: Resource, date?: string) {
  let query = supabase.from(tableMap[resource]).select("*");

  if (resource === "calendars" && date) query = query.eq("date", date);
  if (resource !== "subject_actions" && resource !== "action_backgrounds") {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");
    const requestedDate = url.searchParams.get("date");

    if (requestedDate && !isISODate(requestedDate)) {
      return json({ error: "Invalid date. Use YYYY-MM-DD." }, 400);
    }

    const date = requestedDate || todayISO();

    if (resource === "selection") return json(await selectVariables(date));
    if (resource === "prompt") return json(await buildFinalPrompt(date));

    if (!resource || !(resource in tableMap)) {
      return json({
        function: "variables",
        status: "ok",
        resources: [...Object.keys(tableMap), "selection", "prompt"],
        default_date: date,
      });
    }

    const data = await readResource(resource as Resource, date);
    return json({ resource, count: data.length, data });
  } catch (error) {
    console.error(error);
    return json({
      error: "Failed to execute variables engine",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
