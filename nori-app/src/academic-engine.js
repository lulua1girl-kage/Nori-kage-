// Operational academic state engine. This is the layer that turns Nori's feature map into
// real state transitions instead of a list of capabilities.
export const MASTERY_STATES=["Not Started","Introduced","Studying","Practicing","Weak","Developing","Proficient","Mastered","Verified"];
export const ERROR_TYPES=["knowledge_gap","concept","formula","calculation","careless","interpretation","application","procedure","retrieval","time","reading","strategy"];

const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export function gradeAverage(assessments=[]){
  if(!assessments.length)return null;
  return Math.round(assessments.reduce((a,x)=>a+num(x.score),0)/assessments.length*10)/10;
}
export function weightedGrade(state={}){
  const a=state.assessments||[], by=t=>a.filter(x=>String(x.type||"").toLowerCase().includes(t));
  const avg=x=>{const z=by(x);return z.length?z.reduce((s,v)=>s+num(v.score),0)/z.length:null};
  const continuous=avg("continuous"), mid=avg("mid"), final=avg("final");
  if(continuous==null&&mid==null&&final==null)return null;
  const parts=[[continuous,.30],[mid,.20],[final,.50]].filter(x=>x[0]!=null);
  const totalWeight=parts.reduce((s,x)=>s+x[1],0);
  return Math.round(parts.reduce((s,x)=>s+x[0]*x[1],0)/totalWeight*10)/10;
}
export function recordAssessment(state,input){
  const score=Math.max(0,Math.min(100,num(input.score)));
  const item={id:input.id||crypto.randomUUID(),subject:input.subject||"Unknown",topic:input.topic||null,type:input.type||"Weekly",score,date:input.date||Date.now()};
  return {...state,assessments:[...(state.assessments||[]),item]};
}
export function recordError(state,input){
  const item={id:input.id||crypto.randomUUID(),subject:input.subject||"Unknown",topic:input.topic||"Unknown",type:input.type||"concept",cause:input.cause||"Not yet diagnosed",resolved:false,date:Date.now()};
  return {...state,errors:[...(state.errors||[]),item]};
}
export function resolveError(state,id){
  return {...state,errors:(state.errors||[]).map(x=>x.id===id?{...x,resolved:true,resolvedAt:Date.now()}:x)};
}
export function weakSubjects(state={}){
  const scores={};
  for(const x of state.assessments||[]){if(!x.subject)continue;(scores[x.subject]??=[]).push(num(x.score));}
  return Object.entries(scores).map(([subject,v])=>({subject,score:Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10})).filter(x=>x.score<80).sort((a,b)=>a.score-b.score);
}
export function updateMastery(state,input){
  const key=String(input.subject||"")+"::"+String(input.topic||"");
  const old=(state.mastery||{})[key]||{state:"Not Started",evidence:0};
  const evidence=Math.max(old.evidence,num(input.evidence,1));
  let level=input.correct===true?Math.min(8,old.level==null?1:old.level+1):Math.max(0,(old.level||0)-1);
  const labels=["Not Started","Introduced","Studying","Practicing","Developing","Developing","Proficient","Mastered","Verified"];
  return {...state,mastery:{...(state.mastery||{}),[key]:{...old,subject:input.subject,topic:input.topic,level,state:labels[level],evidence,lastChecked:Date.now()}}};
}
export function analyzeState(state={}){
  const weak=weakSubjects(state);
  const unresolved=(state.errors||[]).filter(x=>!x.resolved);
  const next=(state.assessments||[]).filter(x=>x.date>=Date.now()).sort((a,b)=>a.date-b.date)[0]||null;
  return {average:gradeAverage(state.assessments||[]),weighted:weightedGrade(state),weak,unresolvedErrors:unresolved.length,nextAssessment:next,readiness:Math.max(0,Math.min(100,Math.round((gradeAverage(state.assessments||[])||0)*.7+(weak.length?20:30))))};
}
export function meritFromEvidence(state={}){
  const a=state.assessments||[], s=state.sessions||[], resolved=(state.errors||[]).filter(x=>x.resolved).length;
  let earned=0;
  earned+=a.filter(x=>num(x.score)>=80).length*2;
  earned+=s.length;
  earned+=resolved;
  return {earned,reason:{assessments:a.filter(x=>num(x.score)>=80).length,sessions:s.length,resolvedErrors:resolved}};
}
export function recoveryPlan(state={}){
  const analysis=analyzeState(state);
  return {reason:analysis.unresolvedErrors?"Repair unresolved academic errors":"Restore missed work",tasks:analysis.unresolvedErrors?["Diagnose oldest unresolved error","Repair the concept","Attempt a new problem","Verify correction"]:["Identify missed responsibility","Complete smallest recovery task","Verify completion"],verification:"Evidence required before restoration"};
}
export function academicSnapshot(state={}){
  const a=analyzeState(state), m=meritFromEvidence(state);
  return {...a,meritEarned:m.earned,masteryCount:Object.values(state.mastery||{}).length,activeRecovery:!!state.recovery};
}
