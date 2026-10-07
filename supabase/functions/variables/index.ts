import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tableMap = {
  subjects: "variable_subjects",
  actions: "variable_actions",
  backgrounds: "variable_backgrounds",
  subject_actions: "variable_subject_actions",
  action_backgrounds: "variable_action_backgrounds",
  calendars: "variable_calendars",
} as const;

type Resource = keyof typeof tableMap;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

async function readResource(resource: Resource, date?: string) {
  const table = tableMap[resource];
  let query = supabase.from(table).select("*");

  if (resource === "calendars" && date) {
    query = query.eq("date", date);
  }

  if (resource !== "subject_actions" && resource !== "action_backgrounds") {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") as Resource | null;
    const date = url.searchParams.get("date");

    if (!resource || !(resource in tableMap)) {
      return json({
        function: "variables",
        status: "ok",
        resources: Object.keys(tableMap),
        usage: {
          subjects: "?resource=subjects",
          actions: "?resource=actions",
          backgrounds: "?resource=backgrounds",
          subject_actions: "?resource=subject_actions",
          action_backgrounds: "?resource=action_backgrounds",
          calendars: "?resource=calendars&date=YYYY-MM-DD",
        },
      });
    }

    const data = await readResource(resource, date ?? undefined);

    return json({
      resource,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return json({
      error: "Failed to read variable data",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
