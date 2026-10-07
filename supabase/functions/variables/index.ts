import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json"};
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {auth:{persistSession:false,autoRefreshToken:false}});

const tableMap = {
  subjects:"variable_subjects", actions:"variable_actions", backgrounds:"variable_backgrounds",
  subject_actions:"variable_subject_actions", action_backgrounds:"variable_action_backgrounds",
  calendars:"variable_calendars"
} as const;
type Resource=keyof typeof tableMap;
type Variable={id:string;name:string;category:string[];content_intent:string[];visual_role:string;subject_scale?:string;focal_priority:string;composition_role:string;visual_complexity:string;active:boolean};
type Calendar={date:string;category:string;content_intent:string;active:boolean};
type SubjectAction={subject_id:string;action_id:string};
type ActionBackground={action_id:string;background_id:string};

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});
const has=(list:string[]|undefined,value:string)=>Array.isArray(list)&&list.includes(value);
const scoreSubject=(x:Variable)=>(x.visual_role==="primary_subject"?20:0)+(x.subject_scale==="medium"?10:x.subject_scale==="wide"?5:0)+(x.focal_priority==="primary"?20:0)+(x.composition_role==="center"?15:0)+(x.visual_complexity==="low"?10:x.visual_complexity==="medium"?5:0);
const scoreAction=(x:Variable)=>(x.visual_role==="subject_action"?20:0)+(x.focal_priority==="primary"?20:0)+(x.composition_role==="center"?15:0)+(x.visual_complexity==="low"?10:x.visual_complexity==="medium"?5:0);
const scoreBackground=(x:Variable)=>(x.visual_role==="supporting_background"?15:0)+(x.focal_priority==="tertiary"?15:0)+(x.composition_role==="background"?15:0)+(x.visual_complexity==="low"?10:x.visual_complexity==="medium"?5:0);

async function selectVariables(date:string){
  const [c,s,a,b,sa,ab]=await Promise.all([
    supabase.from("variable_calendars").select("*").eq("date",date).eq("active",true).limit(1),
    supabase.from("variable_subjects").select("*").eq("active",true),
    supabase.from("variable_actions").select("*").eq("active",true),
    supabase.from("variable_backgrounds").select("*").eq("active",true),
    supabase.from("variable_subject_actions").select("*"),
    supabase.from("variable_action_backgrounds").select("*")
  ]);
  const error=[c.error,s.error,a.error,b.error,sa.error,ab.error].find(Boolean); if(error) throw error;
  const calendar=(c.data??[])[0] as Calendar|undefined;
  if(!calendar) return {status:"stopped",reason:"NO_ACTIVE_CALENDAR",date};
  const subjects=s.data as Variable[], actions=a.data as Variable[], backgrounds=b.data as Variable[];
  const subjectActions=sa.data as SubjectAction[], actionBackgrounds=ab.data as ActionBackground[];
  const candidates:{subject:Variable;action:Variable;background:Variable;score:number}[]=[];
  for(const subject of subjects){
    if(!has(subject.category,calendar.category)||!has(subject.content_intent,calendar.content_intent)) continue;
    for(const link of subjectActions.filter(x=>x.subject_id===subject.id)){
      const action=actions.find(x=>x.id===link.action_id);
      if(!action||!has(action.category,calendar.category)||!has(action.content_intent,calendar.content_intent)) continue;
      for(const bgLink of actionBackgrounds.filter(x=>x.action_id===action.id)){
        const background=backgrounds.find(x=>x.id===bgLink.background_id);
        if(!background||!has(background.category,calendar.category)||!has(background.content_intent,calendar.content_intent)) continue;
        candidates.push({subject,action,background,score:scoreSubject(subject)+scoreAction(action)+scoreBackground(background)});
      }
    }
  }
  if(!candidates.length) return {status:"stopped",reason:"NO_VALID_COMBINATION",date,calendar,candidates:[]};
  candidates.sort((x,y)=>y.score-x.score||x.subject.id.localeCompare(y.subject.id)||x.action.id.localeCompare(y.action.id)||x.background.id.localeCompare(y.background.id));
  return {
    status:"selected",date,calendar,selected:candidates[0],candidates,
    scoring:{
      principle:"Hard constraints first; visual-fit score second; stable IDs break ties.",
      subject:{primary_subject:20,medium_scale:10,wide_scale:5,primary_focal:20,centered:15,low_complexity:10,medium_complexity:5},
      action:{subject_action:20,primary_focal:20,centered:15,low_complexity:10,medium_complexity:5},
      background:{supporting_background:15,tertiary_focal:15,background_role:15,low_complexity:10,medium_complexity:5},
      tie_break:"subject.id ASC, action.id ASC, background.id ASC"
    }
  };
}

async function readResource(resource:Resource,date?:string){
  let query=supabase.from(tableMap[resource]).select("*");
  if(resource==="calendars"&&date) query=query.eq("date",date);
  if(resource!=="subject_actions"&&resource!=="action_backgrounds") query=query.eq("active",true);
  const {data,error}=await query;if(error)throw error;return data??[];
}
function todayISO(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kuala_Lumpur",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="GET")return json({error:"Method not allowed"},405);
  try{
    const url=new URL(req.url),resource=url.searchParams.get("resource"),date=url.searchParams.get("date")||todayISO();
    if(resource==="selection")return json(await selectVariables(date));
    if(!resource||!(resource in tableMap))return json({function:"variables",status:"ok",resources:[...Object.keys(tableMap),"selection"],default_date:date});
    const data=await readResource(resource as Resource,date);return json({resource,count:data.length,data});
  }catch(error){console.error(error);return json({error:"Failed to execute variables engine",message:error instanceof Error?error.message:String(error)},500);}
});
