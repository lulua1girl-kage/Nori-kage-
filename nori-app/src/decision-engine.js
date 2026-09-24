// Deterministic Nori decision layer. AI may explain this state but cannot override it.
export const DEGREE={NONE:0,LOW:1,MODERATE:2,SIGNIFICANT:3,HIGH:4,CRITICAL:5};
export const PROTECTED=["sleep","health","safety","family","emergency","genuine_exhaustion","unavoidable_responsibility"];
export function evidenceScore(S){
  const tasks=(S.tasks||[]), open=tasks.filter(x=>!x.done);
  const overdue=open.filter(x=>x.due&&new Date(x.due)<new Date()).length;
  const repeated=(S.behavior||[]).filter(x=>x.supported!==false).length;
  return {open:open.length,overdue,behaviorEvidence:repeated,unresolvedErrors:(S.errors||[]).filter(x=>!x.resolved).length};
}
export function classifyBehavior(S,event={}){
  if(event.protectedContext || PROTECTED.includes(String(event.context||"").toLowerCase())) return {degree:DEGREE.NONE,protected:true,reason:"Protected human circumstance",intervention:"override"};
  const e=evidenceScore(S); const recurrence=Number(event.recurrence||0);
  const pressure=(event.impact==="high"?2:event.impact==="medium"?1:0)+Math.min(2,recurrence);
  const degree=Math.min(5,pressure + (e.overdue>=3?1:0));
  return {degree,protected:false,reason:degree?"Evidence indicates a supportable performance issue":"Insufficient evidence",intervention:degree?minimumIntervention(degree):"observe"};
}
function minimumIntervention(d){return d<=1?"clarify_and_restart":d===2?"repair_and_replan":d===3?"structured_recovery":"review_with_evidence";}
export function decision(S,event={}){
  const behavior=classifyBehavior(S,event);
  if(behavior.protected)return {type:"human_override",behavior,next:"protect normal responsibilities and reassess later"};
  if(behavior.degree===0)return {type:"observe",behavior,next:"continue normal plan"};
  return {type:"support",behavior,next:behavior.intervention};
}
export function integrityCheck(S){
  const ids=new Set(), duplicateAwards=(S.awards||[]).filter(a=>{if(ids.has(a.key))return true;ids.add(a.key);return false}).length;
  const duplicateAssessments=(S.assessments||[]).length-new Set((S.assessments||[]).map(a=>a.id)).size;
  return {ok:duplicateAwards===0&&duplicateAssessments===0,duplicateAwards,duplicateAssessments};
}
export function recoveryGate(S){
  const e=evidenceScore(S),i=integrityCheck(S);
  return {eligible:!!S.recovery || e.overdue>0 || e.unresolvedErrors>0,integrity:i,reason:e.overdue||e.unresolvedErrors?"Repair outstanding evidence":"No recovery gate required"};
}
export function decisionSnapshot(S){
  return {decision:decision(S),evidence:evidenceScore(S),recovery:recoveryGate(S),integrity:integrityCheck(S)};
}
