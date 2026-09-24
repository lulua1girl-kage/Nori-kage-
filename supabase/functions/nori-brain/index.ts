import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
const db = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const OPENAI_FAST = Deno.env.get("OPENAI_FAST_MODEL") || "gpt-5.6-luna";
const OPENAI_REASONING = Deno.env.get("OPENAI_REASONING_MODEL") || "gpt-5.6-sol";
const OPENAI_BALANCED = Deno.env.get("OPENAI_BALANCED_MODEL") || "gpt-5.6-terra";
const OPENAI_REASONING_EFFORT = Deno.env.get("OPENAI_REASONING_EFFORT") || "high";
const GEMINI_FAST = Deno.env.get("GEMINI_FAST_MODEL") || "gemini-2.5-flash";
const GEMINI_REASONING = Deno.env.get("GEMINI_REASONING_MODEL") || "gemini-2.5-pro";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (status:number, body:unknown) =>
  new Response(JSON.stringify(body), { status, headers:{...cors, "Content-Type":"application/json"} });

function clampText(value:unknown, max:number) { return String(value ?? "").slice(0, max); }
function safeJson(value:unknown, max=22000) {
  try { return JSON.stringify(value ?? {}).slice(0, max); } catch { return "{}"; }
}

function detectSubject(m:string) {
  const map:[string,string[]][] = [
    ["mathematics",["math","mathematics","algebra","calculus","geometry","trigonometry","probability","statistics"]],
    ["physics",["physics","mechanics","electricity","magnetism","optics","thermodynamics"]],
    ["chemistry",["chemistry","organic chemistry","stoichiometry","mole","reaction","periodic"]],
    ["biology",["biology","cell","genetics","ecology","physiology","anatomy"]],
    ["agriculture",["agriculture","crop","soil","livestock","farm"]],
    ["english",["english","grammar","essay","literature","vocabulary","reading"]],
    ["computer_science",["computer","programming","coding","algorithm","software","ict","it"]],
    ["web_design",["web design","html","css","javascript","website"]],
    ["history",["history","historical"]], ["geography",["geography","climate","map"]],
    ["economics",["economics","market","supply","demand","inflation"]]
  ];
  for (const [subject, terms] of map) if (terms.some(t=>m.includes(t))) return subject;
  return null;
}

function classifyRequest(message:string, body:any) {
  const m=message.toLowerCase();
  const hasImage=!!body?.imageUrl || !!body?.imageDataUrl || !!body?.image;
  const current=/\b(latest|today|current|recent|news|updated|now)\b/.test(m);
  const deep=/\b(why|prove|derive|analy[sz]e|compare|evaluate|strategy|plan|root cause|deep|hard|complex|ambiguous|step[- ]by[- ]step)\b/.test(m);
  const academic=/\b(math|mathematics|algebra|calculus|geometry|statistics|probability|physics|chemistry|biology|agriculture|english|grammar|literature|history|geography|economics|computer|programming|web design|ict|it|exam|homework|assignment|question|chapter|topic|study|learn|equation|formula)\b/.test(m);
  const state=/\b(status|progress|phase|merit|award|recovery|restriction|discipline|mastery|weak|backlog|score|grade|result|assessment)\b/.test(m);
  const action=/\b(start|stop|record|add|create|schedule|remind|show|open|begin|finish|complete|log|update)\b/.test(m);
  let mode="fast";
  if(deep || academic || state) mode="reasoning";
  if(current) mode="research";
  if(action && !deep && !academic) mode="fast";
  if(hasImage) mode=deep || academic ? "vision-reasoning" : "vision-fast";
  return {
    mode, academic, current, deep, state, action,
    ambiguity:m.length<8 || /\b(it|that|this|there|same|again|what now)\b/.test(m),
    multimodal:hasImage, subjectHint:detectSubject(m)
  };
}

function actionCandidate(message:string, classification:any) {
  if(!classification.action) return null;
  const m=message.toLowerCase();
  if(/\b(start|begin)\b.*\b(study|session)\b/.test(m)) return {type:"START_STUDY_SESSION",requiresDeterministicValidation:true};
  if(/\b(record|add|log)\b.*\b(score|grade|result|mark)\b/.test(m)) return {type:"RECORD_ASSESSMENT_RESULT",requiresDeterministicValidation:true};
  if(/\b(record|add|log)\b.*\b(assignment|homework)\b/.test(m)) return {type:"RECORD_ASSIGNMENT",requiresDeterministicValidation:true};
  if(/\b(show|find)\b.*\b(weak|weakest)\b/.test(m)) return {type:"SHOW_WEAK_SUBJECTS",requiresDeterministicValidation:true};
  if(/\b(show|find)\b.*\b(error|mistake)\b/.test(m)) return {type:"SHOW_UNRESOLVED_ERRORS",requiresDeterministicValidation:true};
  if(/\bwhat should i study now\b|\bnext move\b/.test(m)) return {type:"GET_NEXT_STUDY_ACTION",requiresDeterministicValidation:true};
  return {type:"CONVERSATIONAL_ACTION_REQUEST",requiresDeterministicValidation:true};
}

function buildSystemPrompt(classification:any, state:any, brainContext:any, nextMove:any) {
  const base = "You are Nori, a capable personal AI command assistant and academic intelligence system.\n\n" +
"ROLE\nYou can reason, teach, explain, plan, analyze ambiguity, work through problems, summarize, compare, brainstorm, interpret images, and help operate the user's Nori workspace. You can work across mathematics, physics, chemistry, biology, agriculture, English, languages, history, geography, economics, computer science, web design and other subjects. Do not assume the subject is limited to the configured list.\n\n" +
"REASONING STYLE\nThink carefully before answering. Resolve ambiguity explicitly when it materially changes the answer. Separate facts from inference. For difficult problems, use: context/givens -> method -> reasoning -> result -> verification. Do not expose private chain-of-thought; provide concise reasoning summaries and useful derivations instead. Prefer a fast direct answer when simple and deeper analysis when needed.\n\n" +
"ACADEMIC MODE\nTeach rather than merely dump answers when the user is learning. If a question is an exercise, explain the method and show enough work to make the result understandable. If the user asks for a hint, give a hint rather than the final answer. Adapt depth to the question.\n\n" +
"NORI SYSTEM AUTHORITY\nThe deterministic Nori engine is authoritative for protected state: degree/severity, consequences, recovery completion, award eligibility, mastery verification, restrictions, integrity state, and other protected transitions. Never invent, grant, complete, escalate, or cancel these. You may explain recorded decisions and propose an action, but a proposal must be validated by the app's deterministic action layer before any state change.\n\n" +
"HUMAN OVERRIDE\nRespect legitimate sleep, health/safety, family responsibilities, emergencies, genuine exhaustion, unavoidable responsibilities and real-world constraints. Do not diagnose mental disorders or act as a therapist. Do not automatically label difficulty as laziness.\n\n" +
"INTEGRITY\nNever claim that an action happened when it did not. Never fabricate scores, records, evidence, mastery, awards, sources, or capabilities. If context is missing, say what is missing and continue with what can be done safely.\n\n" +
"PERSONALITY\nCalm, intelligent, direct, practical, non-childish, non-militaristic. Brief for simple requests, detailed when needed. A useful response often follows: Evidence/context -> finding -> explanation -> next action.\n\n" +
"CURRENT REQUEST CLASSIFICATION\n" + safeJson(classification,8000) + "\n\n" +
"RECORDED APP STATE (evidence, not invention)\n" + safeJson(state,16000) + "\n\n" +
"BRAIN CONTEXT\n" + safeJson(brainContext,10000) + "\n\n" +
"NEXT MOVE FROM DETERMINISTIC LAYER\n" + safeJson(nextMove,6000) + "\n\n" +
"If recorded state conflicts with the user's narrative, do not accuse. State the discrepancy and suggest verification. Do not silently rewrite protected state.";
  return base;
}

function localReply(message:string, state:any, classification:any) {
  const m=message.toLowerCase();
  if(/^(hi|hello|hey)\b/.test(m)) return "Nori is online. I can work in fast mode or use deeper reasoning for complex academic and planning tasks.";
  if(classification.action) return "I understand the requested action. I will treat it as a proposal until the deterministic Nori system validates the required state change.";
  if(classification.academic) return classification.subjectHint
    ? "I can work on " + classification.subjectHint + " from the information available. Send the exact question, topic, notes, or image and I'll work through it."
    : "I can work across your subjects. Send the exact question, topic, notes, or image and I'll determine the appropriate method.";
  if(/\b(status|progress|phase|merit|award|recovery)\b/.test(m)) return "Nori is in local mode. I can use recorded local state, but I will not invent missing records or protected decisions.";
  return "Nori is reachable in local mode, but no hosted AI provider is currently available. Local records and deterministic functions remain usable.";
}

async function verifyUser(req:Request) {
  const auth=req.headers.get("authorization") ?? "";
  if(!auth.startsWith("Bearer ") || !db) return null;
  try {
    const {data:{user}}=await db.auth.getUser(auth.slice(7));
    return user ?? null;
  } catch { return null; }
}

function extractOpenAIText(j:any) {
  if(typeof j?.output_text==="string" && j.output_text.trim()) return j.output_text.trim();
  return (j?.output||[]).flatMap((item:any)=>item?.content||[]).map((p:any)=>p?.text||p?.refusal||"").join("").trim();
}

async function openai(params:any) {
  if(!openaiKey) throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");
  const {message,system,history,classification,imageUrl,imageDataUrl}=params;
  const historyItems=(Array.isArray(history)?history.slice(-12):[]).map((x:any)=>({
    role:x?.role==="assistant"?"assistant":"user", content:clampText(x?.content??x?.text??"",6000)
  })).filter((x:any)=>x.content);
  const userContent:any[]=[{type:"input_text",text:message}];
  const img=imageUrl||imageDataUrl;
  if(img) userContent.push({type:"input_image",image_url:img});
  const candidates=classification.mode.includes("reasoning")||classification.mode==="research"
    ? [OPENAI_REASONING,OPENAI_BALANCED,OPENAI_FAST] : [OPENAI_FAST,OPENAI_BALANCED];
  const errors:string[]=[];
  for(const model of [...new Set(candidates)]) {
    const reasoningModel=classification.mode.includes("reasoning")||classification.mode==="research";
    const body:any={
      model,instructions:system,
      input:[...historyItems,{role:"user",content:userContent}],
      max_output_tokens:reasoningModel?2600:1600,store:false,
      safety_identifier:"nori-user"
    };
    if(reasoningModel) body.reasoning={effort:OPENAI_REASONING_EFFORT,summary:"concise"};
    if(classification.current) body.tools=[{type:"web_search"}];
    try {
      const r=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+openaiKey},
        body:JSON.stringify(body)
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok){errors.push(model+":"+(j?.error?.message||r.status));continue;}
      const text=extractOpenAIText(j);
      if(text) return {text,model,reasoning:reasoningModel,errors};
      errors.push(model+":EMPTY_RESPONSE");
    } catch(e) { errors.push(model+":"+String((e as any)?.message||e)); }
  }
  throw new Error(errors.join(" | ")||"OPENAI_ALL_MODELS_FAILED");
}

function extractGeminiText(j:any) {
  return j?.candidates?.[0]?.content?.parts?.map((p:any)=>p?.text||"").join("").trim() || "";
}

async function gemini(params:any) {
  if(!geminiKey) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  const {message,system,history,classification,imageUrl,imageDataUrl}=params;
  const candidates=classification.mode.includes("reasoning")
    ? [GEMINI_REASONING,GEMINI_FAST] : [GEMINI_FAST,GEMINI_REASONING];
  const errors:string[]=[];
  for(const model of [...new Set(candidates)]) {
    const parts:any[]=[{text:message}];
    const img=imageUrl||imageDataUrl;
    if(img?.startsWith("data:")) {
      const m=img.match(/^data:([^;]+);base64,(.+)$/);
      if(m) parts.push({inlineData:{mimeType:m[1],data:m[2]}});
    } else if(img) parts.push({text:"Image reference supplied by the app: "+String(img).slice(0,1000)});
    const contents=[...(Array.isArray(history)?history.slice(-10):[]).map((x:any)=>({
      role:x?.role==="assistant"?"model":"user",parts:[{text:clampText(x?.content??x?.text??"",5000)}]
    })),{role:"user",parts}];
    try {
      const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent?key="+encodeURIComponent(geminiKey),{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:0.25,maxOutputTokens:classification.mode.includes("reasoning")?2600:1600}})
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok){errors.push(model+":"+(j?.error?.message||r.status));continue;}
      const text=extractGeminiText(j);
      if(text)return {text,model,reasoning:classification.mode.includes("reasoning"),errors};
      errors.push(model+":EMPTY_RESPONSE");
    }catch(e){errors.push(model+":"+String((e as any)?.message||e));}
  }
  throw new Error(errors.join(" | ")||"GEMINI_ALL_MODELS_FAILED");
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json(405,{ok:false,error:"POST_REQUIRED"});
  const user=await verifyUser(req);
  if(!user) return json(401,{ok:false,error:"AUTH_REQUIRED"});
  try {
    const body=await req.json();
    const message=clampText(body?.message,12000).trim();
    if(!message)return json(400,{ok:false,error:"MESSAGE_REQUIRED"});
    const state=body?.stateSummary ?? {};
    const brainContext=body?.brainContext ?? {};
    const nextMove=body?.nextMove ?? null;
    const classification=classifyRequest(message,body);
    const action=actionCandidate(message,classification);
    const system=buildSystemPrompt(classification,state,brainContext,nextMove);
    const params={message,system,history:Array.isArray(body?.history)?body.history:[],classification,imageUrl:body?.imageUrl,imageDataUrl:body?.imageDataUrl};
    const attempted:string[]=[]; let result:any=null; const failures:any[]=[];
    if(openaiKey) {
      attempted.push("openai");
      try { result=await openai(params); } catch(e){ failures.push({provider:"openai",error:String((e as any)?.message||e)}); }
    }
    if(!result && geminiKey) {
      attempted.push("gemini");
      try { result=await gemini(params); } catch(e){ failures.push({provider:"gemini",error:String((e as any)?.message||e)}); }
    }
    if(!result) return json(200,{
      ok:true,reply:localReply(message,state,classification),provider:"local",model:"nori-local-engine",
      brainVersion:"2.0",classification,actionCandidate:action,attempted,providerFailures:failures,localFallback:true
    });
    return json(200,{
      ok:true,reply:result.text,
      provider:attempted[0]==="openai"&&result.model?"openai":"gemini",
      model:result.model,reasoning:!!result.reasoning,reasoningMode:classification.mode,
      classification,actionCandidate:action,actionAuthority:"deterministic-nori-engine",
      attempted,providerFailures:failures,providerModelFallbacks:result.errors||[],
      localFallback:false,systemFamiliarity:true,brainVersion:"2.0"
    });
  } catch(e) {
    return json(500,{ok:false,error:"BRAIN_ERROR",detail:String((e as any)?.message||e),brainVersion:"2.0"});
  }
});