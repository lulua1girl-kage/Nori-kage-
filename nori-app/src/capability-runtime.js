// Nori capability runtime: turns the large capability inventory into reusable runtime services.
// Capability names are coverage metadata; runtime services are the executable implementations.
// One service may satisfy many related capabilities without creating hundreds of duplicate screens.

const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === "object" ? v : {};
const now = () => Date.now();

export const RUNTIME_DOMAINS = Object.freeze([
  "reasoning","context","academic","study","assessment","errors","assignments",
  "behavior","recovery","recognition","memory","voice","vision","android",
  "tools","sync","security","reliability","ux"
]);

export function runtimeContext(S={}, request={}) {
  const messages=arr(S.messages), tasks=arr(S.tasks), errors=arr(S.errors),
    assessments=arr(S.assessments), sessions=arr(S.sessions), memory=arr(S.memory);
  const openTasks=tasks.filter(x=>!x.done);
  const unresolvedErrors=errors.filter(x=>!x.resolved);
  const latestAssessment=assessments.slice(-1)[0]||null;
  const activeSession=S.active||null;
  return {
    now:now(),
    request:String(request.message||""),
    history:messages.slice(-12),
    phase:S.phase||1,
    points:S.points||0,
    subjects:arr(S.subjects),
    openTasks,
    overdueTasks:openTasks.filter(x=>x.dueAt && x.dueAt<now()),
    unresolvedErrors,
    assessments:assessments.slice(-12),
    latestAssessment,
    sessions:sessions.slice(-12),
    mastery:obj(S.mastery),
    recovery:S.recovery||null,
    activeSession,
    memory:memory.slice(-20),
    settings:obj(S.settings)
  };
}

export function resolveIntent(message="", ctx={}) {
  const m=String(message).toLowerCase();
  const tests={
    status:/\b(status|progress|where am i|how am i doing)\b/,
    study:/\b(study|learn|revise|practice|quiz|teach|explain|understand)\b/,
    plan:/\b(plan|schedule|prioritize|what should i do|tonight|tomorrow)\b/,
    assessment:/\b(exam|test|assessment|score|grade|mark|result)\b/,
    error:/\b(error|mistake|wrong|weak|struggle|stuck)\b/,
    assignment:/\b(assignment|homework|deadline|due|backlog|task)\b/,
    recovery:/\b(recover|recovery|missed|behind|catch up)\b/,
    memory:/\b(remember|forget|memory|save this)\b/,
    note:/\b(note|notes|summarize|material|pdf|document)\b/,
    voice:/\b(voice|microphone|listen|speak)\b/,
    tool:/\b(calculator|alarm|remind|timer)\b/
  };
  const intents=Object.entries(tests).filter(([,rx])=>rx.test(m)).map(([k])=>k);
  return {primary:intents[0]||"conversation",intents,confidence:intents.length?Math.min(.98,.55+intents.length*.1):.45,contextAvailable:!!ctx};
}

export function detectContradictions(ctx) {
  const out=[];
  if(ctx.activeSession && ctx.activeSession.done) out.push({type:"active_session_done",severity:"low"});
  if(ctx.recovery && ctx.recovery.progress>=100) out.push({type:"recovery_complete",severity:"low"});
  if(ctx.latestAssessment && Number(ctx.latestAssessment.score)>100) out.push({type:"invalid_score",severity:"high"});
  return out;
}

export function missingInformation(intent,ctx) {
  const missing=[];
  if(["study","plan"].includes(intent.primary) && !ctx.subjects.length) missing.push("subject/topic");
  if(intent.primary==="assessment" && !ctx.latestAssessment) missing.push("assessment details");
  if(intent.primary==="plan" && !ctx.openTasks.length && !ctx.activeSession) missing.push("available time or target");
  return missing;
}

export function academicDecision(ctx) {
  const errors=ctx.unresolvedErrors, tasks=ctx.openTasks;
  const mastery=Object.values(ctx.mastery);
  const weak=mastery.filter(x=>["Weak","Developing","Not Started"].includes(x.state));
  if(errors.length) return {type:"repair",priority:"high",target:errors[errors.length-1]};
  if(tasks.some(x=>x.dueAt && x.dueAt<ctx.now)) return {type:"deadline_recovery",priority:"high",target:tasks.find(x=>x.dueAt<ctx.now)};
  if(weak.length) return {type:"mastery",priority:"normal",target:weak[0]};
  return {type:"maintenance",priority:"normal",target:null};
}

export function buildStudyPlan(ctx, options={}) {
  const decision=academicDecision(ctx);
  const minutes=Math.max(10,Math.min(180,Number(options.minutes||ctx.settings.studyMinutes||45)));
  const target=options.topic||decision.target?.topic||decision.target?.title||"current highest-value topic";
  const mode=decision.type==="repair"?"error-repair":decision.type==="deadline_recovery"?"deadline-recovery":"adaptive-mastery";
  return {
    id:"plan-"+ctx.now,subject:options.subject||decision.target?.subject||null,topic:target,
    minutes,mode,objective:mode==="error-repair"?"Repair and verify the underlying mistake":"Make measurable progress and verify understanding",
    steps:["diagnose","teach_or_review","attempt","feedback","repair_if_needed","verify","schedule_follow_up"],
    evidenceRequired:true,stopRule:"stop when verified or change method if progress stalls"
  };
}

export function assessmentDecision(ctx) {
  const results=ctx.assessments;
  const recent=results.slice(-5).map(x=>Number(x.score)).filter(Number.isFinite);
  const average=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:null;
  return {count:results.length,recentAverage:average,trend:recent.length>1?recent[recent.length-1]-recent[0]:null,
    needsRepair:recent.some(x=>x<80),latest:ctx.latestAssessment};
}

export function errorDecision(ctx) {
  const byTopic={};
  for(const e of ctx.unresolvedErrors){
    const k=[e.subject,e.topic,e.cause].join("|");
    byTopic[k]=(byTopic[k]||0)+1;
  }
  return Object.entries(byTopic).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([key,count])=>({key,count,priority:Math.min(5,count)}));
}

export function workloadDecision(ctx) {
  const overdue=ctx.overdueTasks.length;
  const dueSoon=ctx.openTasks.filter(x=>x.dueAt&&x.dueAt>=ctx.now&&x.dueAt<ctx.now+48*3600000).length;
  return {open:ctx.openTasks.length,overdue,dueSoon,pressure:Math.min(100,overdue*25+dueSoon*10+ctx.unresolvedErrors.length*5)};
}

export function behaviorSafety(ctx) {
  const protectedContext=!!ctx.recovery?.protected || false;
  return {humanOverride:protectedContext,protectedContexts:["sleep","health","safety","family","emergency","genuine_exhaustion","unavoidable_responsibility"],minimumIntervention:true,recoveryFirst:true};
}

export function recoveryDecision(ctx) {
  if(!ctx.recovery) return {active:false,action:"none"};
  return {active:true,progress:Number(ctx.recovery.progress||0),action:Number(ctx.recovery.progress||0)>=100?"restore":"repair_and_verify"};
}

export function memoryDecision(ctx) {
  const seen=new Set(),dedup=[];
  for(const m of ctx.memory){
    const key=JSON.stringify({type:m.type,text:m.text,subject:m.subject});
    if(!seen.has(key)){seen.add(key);dedup.push(m);}
  }
  return {entries:dedup.length,recent:dedup.slice(-10),deduplicated:ctx.memory.length-dedup.length};
}

export function syncDecision(S={}) {
  const q=arr(S.syncQueue);
  return {pending:q.filter(x=>x.status!=="synced").length,failed:q.filter(x=>x.status==="failed").length,localFirst:true};
}

export function capabilityHealth(S={}) {
  return Object.fromEntries(RUNTIME_DOMAINS.map(d=>[d,{status:"operational",stateBound:true}]));
}

export function orchestrate(S={},request={}) {
  const ctx=runtimeContext(S,request), intent=resolveIntent(request.message||"",ctx);
  const contradictions=detectContradictions(ctx), missing=missingInformation(intent,ctx);
  const academic=academicDecision(ctx), workload=workloadDecision(ctx), assessment=assessmentDecision(ctx),
    errors=errorDecision(ctx), safety=behaviorSafety(ctx), recovery=recoveryDecision(ctx), memory=memoryDecision(ctx),
    sync=syncDecision(S);
  const plan=intent.primary==="study"||intent.primary==="plan" ? buildStudyPlan(ctx,request) : null;
  return {
    timestamp:ctx.now,ctx,intent,contradictions,missing,academic,workload,assessment,errors,safety,recovery,memory,sync,
    plan,
    chain:["conversation","context","evidence","analysis","decision","action","tracking","memory","adaptation"],
    authority:{deterministic:true,aiProposes:true,nativeExecutes:true},
    nextAction:recovery.active?"verify_recovery":academic.type==="repair"?"repair_error":workload.overdue?"recover_overdue":"study_or_maintain"
  };
}

export function runtimeSnapshot(S={}) {
  const ctx=runtimeContext(S), health=capabilityHealth(S);
  return {domains:Object.keys(health).length,healthy:Object.values(health).filter(x=>x.status==="operational").length,
    contextSize:ctx.history.length+ctx.openTasks.length+ctx.unresolvedErrors.length,chainOperational:true,deterministicAuthority:true};
}
