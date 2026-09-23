import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
const db = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (status:number, body:unknown) =>
  new Response(JSON.stringify(body), {status, headers:{...cors, "Content-Type":"application/json"}});

function localReply(message:string, state:any) {
  const m = message.toLowerCase();
  if (/^(hi|hello|hey)\b/.test(m)) return "I'm here. Nori is online in local mode and I still have the KAGE rules, phases, academic state, recovery and Human Override framework available.";
  if (/\b(assignment|homework|task)\b/.test(m)) {
    const items = Array.isArray(state?.assignments) ? state.assignments : [];
    return items.length ? `I found ${items.length} saved assignment/task record(s). I can work from those records without inventing missing details.` : "I don't have saved assignment records in the context I received yet. Add the assignment and I'll work from the actual record.";
  }
  if (/\b(exam|assessment|test|grade|score|result)\b/.test(m)) return "I can work from your saved assessment/result records and the KAGE exam rules. Give me the specific result or ask for the current academic status.";
  if (/\b(status|progress|phase|merit|recovery|kage|new era)\b/.test(m)) return "I have the KAGE/New Era context supplied by the app. I will treat recorded state as evidence, keep Human Override above automation, and separate facts from recommendations.";
  if (/\b(what now|next move|study now|start)\b/.test(m)) return "I'll choose the next useful action from the recorded priorities, deadlines, available time and current academic state rather than inventing a schedule.";
  return "Nori's reasoning service is reachable, but no hosted AI provider is configured. I can still use the local KAGE rules and recorded state safely; once a provider secret is configured, this same endpoint will use hosted reasoning without changing the app's records.";
}

async function verifyUser(req:Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  if (!db) return null;
  const {data:{user}} = await db.auth.getUser(auth.slice(7));
  return user ?? null;
}

async function gemini(message:string, system:string, history:any[]) {
  if (!geminiKey) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  const contents = [...(Array.isArray(history)?history.slice(-10):[]).map((x:any)=>({
    role: x?.role === "assistant" ? "model" : "user",
    parts: [{text:String(x?.content ?? "").slice(0,5000)}]
  })), {role:"user",parts:[{text:message}]}];
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+encodeURIComponent(geminiKey), {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:0.35,maxOutputTokens:1400}})
  });
  const j = await r.json();
  if (!r.ok) throw new Error("GEMINI_HTTP_"+r.status);
  const text = j?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("").trim();
  if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

async function openai(message:string, system:string, history:any[]) {
  if (!openaiKey) throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");
  const input = [
    {role:"system",content:system},
    ...(Array.isArray(history)?history.slice(-10):[]).map((x:any)=>({role:x?.role==="assistant"?"assistant":"user",content:String(x?.content??"").slice(0,5000)})),
    {role:"user",content:message}
  ];
  const r = await fetch("https://api.openai.com/v1/responses", {
    method:"POST", headers:{"Content-Type":"application/json",Authorization:"Bearer "+openaiKey},
    body:JSON.stringify({model:"gpt-5-mini",input,temperature:0.35,max_output_tokens:1400})
  });
  const j = await r.json();
  if (!r.ok) throw new Error("OPENAI_HTTP_"+r.status);
  const text = j?.output?.flatMap((x:any)=>x?.content||[]).map((x:any)=>x?.text||"").join("").trim();
  if (!text) throw new Error("OPENAI_EMPTY_RESPONSE");
  return text;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:cors});
  if (req.method !== "POST") return json(405,{ok:false,error:"POST_REQUIRED"});
  const user = await verifyUser(req);
  if (!user) return json(401,{ok:false,error:"AUTH_REQUIRED"});

  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();
    if (!message) return json(400,{ok:false,error:"MESSAGE_REQUIRED"});

    const state = body?.stateSummary ?? {};
    const system = `You are Nori, the user's calm, direct academic command assistant. You understand the KAGE/New Era framework supplied by the app. Academic performance is the priority, followed by discipline and long-term improvement. Human Override is the highest authority. Do not invent records, silently execute side effects, or pretend provider output is verified state. Distinguish recorded facts from suggestions. Protect privacy and avoid unnecessary questions. Use the supplied state as evidence, not as unquestionable truth. Keep answers practical and concise. Current app context: ${JSON.stringify({state,brainContext:body?.brainContext??{},nextMove:body?.nextMove??null}).slice(0,18000)}`;

    let reply = "";
    let provider = "local";
    const attempted:string[] = [];
    try { if (geminiKey) { attempted.push("gemini"); reply = await gemini(message,system,body?.history); provider="gemini"; } } catch (_) {}
    if (!reply) try { if (openaiKey) { attempted.push("openai"); reply = await openai(message,system,body?.history); provider="openai"; } } catch (_) {}
    if (!reply) reply = localReply(message,state);

    return json(200,{reply,provider,model:provider==="gemini"?"gemini-2.5-flash":provider==="openai"?"gpt-5-mini":"nori-local-engine",attempted,systemFamiliarity:true,brainVersion:"edge-1",localFallback:provider==="local"});
  } catch (e) {
    return json(500,{ok:false,error:"BRAIN_ERROR",detail:String((e as any)?.message||e)});
  }
});