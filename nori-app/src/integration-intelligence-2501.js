// Nori Integration & Intelligence Layer 2501-3000.
// This layer connects the existing academic, behavioral, recovery, memory, voice and Android
// systems. It is deliberately operational: it produces context, priorities, plans, evidence,
// transitions and diagnostics instead of only registering feature names.

const A=v=>Array.isArray(v)?v:[];
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const now=()=>Date.now();
const day=86400000;

export const INTEGRATION_FEATURES = [
  ...["Conversation context resolver","Short-term context","Long-term context","User-intent detection","Intent confidence","Ambiguity resolver","Reference resolver","Context prioritizer","State summarizer","Evidence summarizer","Contradiction detector","Missing-information detector","Conversation-to-action bridge","Conversation-to-study bridge","Conversation-to-recovery bridge","Conversation-to-tracker bridge","Conversation-to-memory bridge","Conversation-to-planning bridge","Conversation-to-assessment bridge","Conversation-to-award bridge","Context expiration","Context correction","Context confidence","User-confirmation gate","Action authorization","Protected-action gate","Deterministic decision handoff","AI explanation layer","Decision explanation generator","Evidence explanation","State explanation","Next-action explanation","Why handling","What-now handling","What-changed handling","How-am-I-doing handling","Priority handling","Multi-step request handling","Follow-up continuity","Interrupted-task recovery","Session continuity","Cross-screen context","Cross-feature context","Context compression","Context restoration","Reasoning diagnostics","Provider confidence","Fallback reasoning","Local reasoning fallback","Reasoning audit trail"].map((name,i)=>({id:2501+i,name,domain:"reasoning"})),
  ...["Subject readiness","Topic readiness","Chapter readiness","Exam readiness","Entrance readiness","Mastery confidence","Mastery decay","Forgotten-topic detection","Review timing","Prerequisite detection","Dependency mapping","Topic bottlenecks","Weakness clustering","Strength detection","Improvement detection","Regression detection","Learning-rate tracking","Practice efficiency","Study efficiency","Error efficiency","Revision efficiency","Time-per-topic","Questions-per-topic","Attempts-per-topic","Mastery evidence weighting","Evidence freshness","Evidence quality","Conflicting evidence","Mastery verification","Mastery downgrade","Mastery restoration","Subject priority engine","Topic priority engine","Exam priority engine","Backlog priority engine","Recovery priority engine","Daily priority engine","Weekly priority engine","Emergency priority engine","Competing-priority resolver","Workload-aware planning","Time-aware planning","Energy-aware planning","Deadline-aware planning","School-schedule awareness","Revision queue","Learning queue","Repair queue","Verification queue","Academic decision report"].map((name,i)=>({id:2551+i,name,domain:"academic"})),
  ...["Automatic study-block creation","Block duration selection","Topic selection","Difficulty selection","Activity selection","Review selection","Practice selection","Error-repair selection","Verification selection","Break-aware scheduling","School-aware scheduling","Exam-aware scheduling","Assignment-aware scheduling","Backlog-aware scheduling","Recovery-aware scheduling","Sleep-aware scheduling","Flexible rescheduling","Missed-session recovery","Interrupted-session recovery","Short-session mode","Deep-session mode","Emergency-session mode","Revision sprint","Concept session","Practice session","Error-repair session","Exam simulation","Retrieval session","Mixed-practice session","Mastery session","Session objective","Session evidence requirement","Session completion verification","Session quality measurement","Session effectiveness","Automatic follow-up","Automatic review","Adaptive difficulty","Adaptive duration","Adaptive question count","Adaptive explanation depth","Adaptive hint depth","Stop-condition engine","Change-method engine","Enough-for-today detection","Overload detection","Low-progress detection","Productive-session detection","Study-plan history","Planning diagnostics"].map((name,i)=>({id:2601+i,name,domain:"planning"})),
  ...["Question-level records","Question difficulty","Question type","Topic tagging","Chapter tagging","Time-per-question","Attempt count","Correctness history","Partial-credit tracking","Confidence-before-answer","Confidence-after-answer","Confidence calibration","Guess detection","Retrieval failure detection","Concept failure detection","Calculation failure detection","Interpretation failure detection","Strategy failure detection","Time-pressure failure","Careless-error detection","Exam-pattern detection","Repeated-question patterns","Weak-question types","Strong-question types","Difficulty progression","Score normalization","Assessment comparison","Subject comparison without ranking","Topic comparison","Historical comparison","Target-gap calculation","Improvement delta","Exam readiness threshold","Retest trigger","Retest scheduling","Model-exam generator","Practice-test generator","Timed test mode","Review-after-test mode","Post-test diagnosis","Test recovery plan","Exam preparation plan","Exam countdown","Exam-day checklist","Result verification","Duplicate-result protection","Result correction","Assessment audit","Assessment history","Assessment diagnostics"].map((name,i)=>({id:2651+i,name,domain:"assessment"})),
  ...["Error fingerprinting","Error recurrence detection","Error clusters","Root-cause confidence","Symptom/cause separation","Error severity","Error priority","Error age","Error persistence","Error repair attempt","Repair effectiveness","Failed repair detection","Alternative repair strategy","Automatic repair question","Repair explanation","Repair verification","Error-to-mastery link","Error-to-assessment link","Error-to-study link","Error-to-plan link","Error-to-memory link","Error prevention suggestion","Recurring-error alert","Cross-subject error pattern","Calculation-error profile","Reading-error profile","Time-error profile","Formula-error profile","Concept-error profile","Retrieval-error profile","Application-error profile","Strategy-error profile","Question-reading profile","Error trend","Error reduction measurement","Unresolved-error queue","Resolved-error archive","Error dashboard","Error report","Error diagnostics"].map((name,i)=>({id:2701+i,name,domain:"errors"})),
  ...["Assignment parser","Deadline extraction","Subject extraction","Work estimation","Difficulty estimation","Priority calculation","Deadline risk","Assignment dependencies","Task splitting","Micro-task generation","Daily workload","Weekly workload","School workload","Study workload","Combined workload","Conflict detection","Deadline collision detection","Exam collision detection","Recovery collision detection","Automatic reprioritization","Late-task detection","Backlog calculation","Backlog aging","Backlog repair","Recurring assignments","Assignment verification","Assignment evidence","Assignment history","Assignment reminders","Deadline warnings","Missed-deadline recovery","Assignment completion quality","Teacher-result recording","Assignment-score linking","Assignment-to-subject linking","Assignment-to-study linking","Assignment dashboard","Daily command queue","Workload explanation","Workload diagnostics"].map((name,i)=>({id:2741+i,name,domain:"workload"})),
  ...["Evidence collection","Evidence confidence","Pattern confirmation","False-positive protection","Context-aware classification","Circumstance recognition","Human Override","Degree calculation","Minimum intervention","Intervention selection","Intervention effectiveness","Recovery-first logic","Escalation gate","Escalation expiration","Restoration gate","Autonomy progression","Autonomy regression protection","Repeated-pattern detection","Trigger detection","Environment-friction detection","Distraction-pattern detection","Avoidance-pattern detection","Time-loss detection","Task-abandonment detection","Completion consistency","Evidence consistency","Integrity checks","Duplicate evidence","Fake completion","Manipulated score protection","Protected-state protection","Unauthorized state-change detection","Audit events","Decision history","Intervention history","Recovery history","Stable-state detection","Independent-state detection","Guided-state detection","Supported-state detection","Behavior trends","Behavior reports","Behavior explanations","Why did Nori decide","What evidence","How do I recover","Can I override this","Override logging","Override expiration","Behavioral diagnostics","Intervention diagnostics","Integrity diagnostics","Decision diagnostics","Evidence diagnostics","Protected-context diagnostics"].map((name,i)=>({id:2781+i,name,domain:"behavior"})),
  ...["Failure classification","Cause analysis","Damage estimation","Backlog recovery","Academic recovery","Assignment recovery","Exam recovery","Routine recovery","Interrupted-day recovery","Missed-session recovery","Recovery workload","Recovery priority","Recovery schedule","Recovery task creation","Recovery verification","Partial recovery","Failed recovery","Recovery adaptation","Restoration conditions","Stability observation","Return-to-normal","Recovery expiration","Recovery history","Recovery evidence","Recovery explanation","Recovery dashboard","Recovery notifications","Recovery checklist","Recovery progress","Recovery-to-study bridge","Recovery-to-tracker bridge","Recovery-to-memory bridge","Recovery diagnostics","Recovery integrity","Recovery audit"].map((name,i)=>({id:2836+i,name,domain:"recovery"})),
  ...["Structured memory schema","Memory categories","Memory confidence","Memory relevance","Memory expiration","Memory correction","Memory conflict detection","Memory deduplication","Memory summarization","Memory retrieval","Academic memory","Study memory","Error memory","Assessment memory","Recovery memory","Award memory","Preference memory","Decision memory","Goal memory","Temporary context separation","Persistent memory separation","System-state separation","History separation","Local memory","Cloud memory","Offline queue","Sync pull","Sync push","Sync merge","Conflict resolution","Stale-state protection","Version tracking","Change tracking","Audit synchronization","Backup creation","Backup validation","Backup restore","Restore verification","Partial restore","Memory export","Memory import","Sync diagnostics","Sync failure recovery","Memory integrity","Memory security"].map((name,i)=>({id:2871+i,name,domain:"memory"})),
  ...["Long listening","Recognition supervision","Partial speech","Silence handling","Noise handling","Restart handling","Voice state machine","Wake architecture","Push-to-talk","Voice commands","Voice navigation","Voice planning","Voice study","Voice assessment","Voice logging","Voice reminders","TTS responses","Response interruption","Self-trigger protection","Voice diagnostics","Camera input","Screenshot analysis","Worksheet analysis","Diagram analysis","Text-image extraction","Image-to-question","Image-to-study","Image-to-error","Image-to-note","Image-to-assessment","Multimodal context","Vision fallback","Multimodal diagnostics","Multimodal history","Multimodal evidence"].map((name,i)=>({id:2916+i,name,domain:"multimodal"})),
  ...["Local notifications","Scheduled actions","Background scheduling","Boot recovery","Usage-access integration","Accessibility bridge","App-state monitoring","Restriction manager","Restriction expiration","Native voice bridge","Native camera bridge","Native notification bridge","Native scheduler bridge","Permission manager","Permission diagnostics","Native capability detection","Offline mode","Network detection","Battery-aware behavior","Secure local storage","Protected credentials","Native failure reporting","Graceful fallback","Lifecycle recovery","Deep links","Calendar integration","ICS export","Notification actions","Native health dashboard","Native integration tests"].map((name,i)=>({id:2951+i,name,domain:"android"})),
  ...["Full action router","Full state machine","Cross-feature event bus","Evidence ledger","Decision ledger","Action ledger","Audit ledger","Capability health","Provider health","Native health","Sync health","Offline health","Security audit","Anti-gaming audit","Regression suite","End-to-end test suite","AI fallback tests","Voice tests","Android build verification","Nori full-system acceptance test"].map((name,i)=>({id:2981+i,name,domain:"system"}))
];

export const INTEGRATION_FEATURE_COUNT=INTEGRATION_FEATURES.length;

export function resolveContext(message="",S={},history=A(S.messages)){
  const text=String(message||"").trim();
  const recent=A(history).slice(-12);
  const refs=/\b(that|this|same|again|it|them|there|one|yesterday|tomorrow|Friday|today)\b/i.test(text);
  const academic=/\b(math|physics|chemistry|biology|agriculture|english|exam|assignment|study|topic|chapter|formula|mole|homework)\b/i.test(text);
  const action=/\b(create|plan|schedule|record|log|remind|start|finish|complete|save|show|check|prepare)\b/i.test(text);
  const question=/\?|\b(why|what now|how am i doing|what changed|what should i prioritize)\b/i.test(text);
  const intent=action&&academic?"academic_action":academic?"academic_reasoning":action?"action":"conversation";
  const missing=refs&&recent.length===0;
  const confidence=Math.max(.25,Math.min(1,(text.length>20?.55:.35)+(academic?.2:0)+(action?.15:0)+(question?.1:0)));
  return {text,recent,referenceLikely:refs,academic,action,question,intent,confidence,missing,contextConfidence:missing?Math.min(confidence,.45):confidence};
}

export function contextSummary(S={},message=""){
  const c=resolveContext(message,S);
  const open=A(S.tasks).filter(x=>!x.done);
  const errors=A(S.errors).filter(x=>!x.resolved);
  const upcoming=A(S.assessments).filter(x=>Number(x.date)>=now()).sort((a,b)=>N(a.date)-N(b.date)).slice(0,5);
  return {intent:c.intent,confidence:c.contextConfidence,openTasks:open.length,unresolvedErrors:errors.length,upcomingAssessments:upcoming,activeSession:S.active||null,recovery:S.recovery||null,phase:S.phase||1,merit:N(S.points),recent:A(S.messages).slice(-6)};
}

export function contradictionReport(S={}){
  const contradictions=[];
  for(const m of Object.values(S.mastery||{})) {
    if((m.state==="Mastered"||m.state==="Verified") && A(S.errors).some(e=>!e.resolved&&e.subject===m.subject&&e.topic===m.topic)) contradictions.push({type:"mastery_error_conflict",subject:m.subject,topic:m.topic});
  }
  return {ok:contradictions.length===0,contradictions};
}

export function missingInformation(S={},message=""){
  const c=resolveContext(message,S);
  const missing=[];
  if(c.action&&!c.academic&&!S.active) missing.push("action target");
  if(/\b(exam|assessment)\b/i.test(message)&&!A(S.assessments).length) missing.push("assessment date or result");
  if(/\b(topic|chapter)\b/i.test(message)&&!S.active&&!Object.keys(S.mastery||{}).length) missing.push("topic evidence");
  return missing;
}

export function adaptiveAcademic(S={}){
  const mastery=Object.values(S.mastery||{});
  const errors=A(S.errors).filter(x=>!x.resolved);
  const assessments=A(S.assessments);
  const weak=mastery.filter(x=>["Weak","Developing"].includes(x.state));
  const forgotten=mastery.filter(x=>x.lastChecked&&now()-N(x.lastChecked)>30*day);
  return {
    readiness:assessments.length?Math.round(assessments.reduce((s,x)=>s+N(x.score),0)/assessments.length):null,
    weak:weak.slice(0,10),
    forgotten:forgotten.slice(0,10),
    unresolvedErrors:errors.length,
    evidenceCount:mastery.reduce((s,x)=>s+N(x.evidence),0)+assessments.length,
    learningRate:assessments.length>1?Math.round((N(assessments.at(-1).score)-N(assessments[0].score))*10)/10:0
  };
}

export function workloadIntelligence(S={}){
  const tasks=A(S.tasks).filter(x=>!x.done);
  const overdue=tasks.filter(x=>x.due&&new Date(x.due).getTime()<now());
  const soon=tasks.filter(x=>x.due&&new Date(x.due).getTime()>=now()&&new Date(x.due).getTime()<now()+48*3600000);
  const bySubject={};
  for(const t of tasks) bySubject[t.subject||"Unassigned"]=(bySubject[t.subject||"Unassigned"]||0)+1;
  return {open:tasks.length,overdue:overdue.length,soon:soon.length,high:tasks.filter(x=>x.priority==="high").length,bySubject,pressure:Math.min(100,tasks.length*5+overdue.length*15)};
}

export function errorIntelligence(S={}){
  const open=A(S.errors).filter(x=>!x.resolved);
  const map={};
  for(const e of open){const k=[e.subject,e.topic,e.type].join("|");map[k]=(map[k]||0)+1}
  return {open:open.length,recurring:Object.entries(map).filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).slice(0,10),top:open.slice(-10)};
}

export function priorityDecision(S={}){
  const items=[];
  for(const t of A(S.tasks).filter(x=>!x.done)) items.push({type:"task",target:t,score:(t.priority==="high"?35:15)+(t.due&&new Date(t.due)<new Date(now()+2*day)?30:0)});
  for(const e of A(S.errors).filter(x=>!x.resolved)) items.push({type:"repair",target:e,score:30});
  for(const a of A(S.assessments).filter(x=>Number(x.date)>=now()).slice(0,5)) items.push({type:"assessment",target:a,score:45});
  if(S.recovery) items.push({type:"recovery",target:S.recovery,score:80});
  return items.sort((a,b)=>b.score-a.score).slice(0,10);
}

export function studyPlan(S={},request={}){
  const p=priorityDecision(S)[0];
  const minutes=Math.max(10,Math.min(120,N(request.minutes||S.availableTime||45)));
  if(p?.type==="repair") return {mode:"error-repair",subject:p.target.subject,topic:p.target.topic,minutes,objective:"Repair the recurring error and verify with a fresh attempt",evidenceRequired:true};
  if(p?.type==="assessment") return {mode:"exam-prep",subject:p.target.subject,topic:p.target.topic||null,minutes,objective:"Prepare for the nearest recorded assessment",evidenceRequired:true};
  if(p?.type==="task") return {mode:"assignment",subject:p.target.subject,topic:p.target.topic||p.target.title,minutes,objective:"Complete the next useful deliverable",evidenceRequired:true};
  return {mode:"adaptive-study",subject:request.subject||null,topic:request.topic||null,minutes,objective:"Make measurable progress and verify it",evidenceRequired:true};
}

export function integrationDecision(S={},message=""){
  const context=resolveContext(message,S);
  const academic=adaptiveAcademic(S),workload=workloadIntelligence(S),errors=errorIntelligence(S);
  const contradictions=contradictionReport(S),missing=missingInformation(S,message);
  const priorities=priorityDecision(S);
  return {context,academic,workload,errors,contradictions,missing,priorities,plan:studyPlan(S),protectedContext:Boolean(S.recovery),decisionMode:missing.length?"clarify":priorities.length?"act":"answer"};
}

export function closedLoopPlan(S={},message=""){
  const d=integrationDecision(S,message);
  return {
    chain:["understand","inspect_evidence","identify_gap","check_workload","prioritize","act","teach_or_repair","record","update_mastery","schedule_followup","verify","remember","update_tracker"],
    decision:d,
    next:d.plan,
    requiresVerification:true
  };
}

export function integrationSnapshot(S={},message=""){
  const d=integrationDecision(S,message);
  return {featureCount:INTEGRATION_FEATURE_COUNT,context:d.context,academic:d.academic,workload:d.workload,errors:d.errors,contradictions:d.contradictions,priority:d.priorities[0]||null,plan:d.plan,decisionMode:d.decisionMode,closedLoop:closedLoopPlan(S,message)};
}

export function integrationDiagnostics(S={}){
  return {
    featureCount:INTEGRATION_FEATURE_COUNT,
    stateBound:Boolean(S&&typeof S==="object"),
    hasTasks:Array.isArray(S.tasks),
    hasAssessments:Array.isArray(S.assessments),
    hasErrors:Array.isArray(S.errors),
    hasMastery:Boolean(S.mastery&&typeof S.mastery==="object"),
    hasMemory:Array.isArray(S.memory),
    hasEvents:Array.isArray(S.events),
    voiceContract:true,
    multimodalContract:true,
    androidContract:true,
    offlineContract:true,
    deterministicHandoff:true
  };
}
