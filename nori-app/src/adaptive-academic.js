// Adaptive academic planning layer: converts academic evidence into concrete queues.
import {analyzeState} from "./academic-engine.js";
const now=()=>Date.now(), id=()=>crypto.randomUUID();
export function priorityQueue(S={}){
  const a=analyzeState(S), errors=(S.errors||[]).filter(x=>!x.resolved), items=[];
  for(const w of a.weak) items.push({kind:"weak_subject",subject:w.subject,score:w.score,priority:w.score<60?"high":"medium",reason:"Recorded assessment average is below the academic floor."});
  for(const e of errors) items.push({kind:"error_repair",subject:e.subject,topic:e.topic,priority:"high",reason:"Unresolved recorded error."});
  for(const t of (S.tasks||[]).filter(x=>!x.done)) items.push({kind:"task",...t,priority:t.priority||"normal"});
  const rank={high:0,medium:1,normal:2,low:3};
  return items.sort((x,y)=>(rank[x.priority]??2)-(rank[y.priority]??2));
}
export function buildAdaptivePlan(S={},opts={}){
  const q=priorityQueue(S).slice(0,opts.limit||5);
  return {id:id(),createdAt:now(),title:q.length?"Adaptive academic plan":"Maintain mastery",steps:q.length?q.map(x=>x.kind==="error_repair"?"Repair "+x.subject+" · "+x.topic:x.kind==="weak_subject"?"Practice "+x.subject:"Complete "+(x.title||x.topic||"priority task")):["Review a recently learned topic","Attempt retrieval practice","Verify mastery"],source:"adaptive",evidence:q};
}
export function readiness(S={}){const a=analyzeState(S);return {score:a.readiness,weak:a.weak,unresolvedErrors:a.unresolvedErrors,nextAssessment:a.nextAssessment};}
export function reviewQueue(S={}){return Object.values(S.mastery||{}).filter(x=>["Weak","Developing","Proficient"].includes(x.state)).sort((a,b)=>(a.lastChecked||0)-(b.lastChecked||0));}
export function examRisk(S={}){const a=analyzeState(S);return {risk:a.unresolvedErrors+(a.weak.length*2),readiness:a.readiness,nextAssessment:a.nextAssessment};}
export function assessmentTrend(S={},subject=null){return (S.assessments||[]).filter(x=>!subject||x.subject===subject).slice(-10).map((x,i)=>({i:i+1,score:Number(x.score)||0,date:x.date,subject:x.subject,topic:x.topic}));}
export function learningEvidence(S={},subject=null,topic=null){return (S.sessions||[]).filter(x=>(!subject||x.subject===subject)&&(!topic||x.topic===topic)).map(x=>({subject:x.subject,topic:x.topic,date:x.ended||x.started,evidence:!!x.evidence}));}
export function generateRepair(S={},error){return {id:id(),type:"error-repair",subject:error?.subject,topic:error?.topic,steps:["Explain the root cause","Attempt a targeted problem","Compare the attempt with the correction","Verify with a fresh problem"],createdAt:now()};}
export function nextAcademicAction(S={}){const q=priorityQueue(S)[0];return q?{type:q.kind,payload:q}:{type:"review",payload:buildAdaptivePlan(S)};}
