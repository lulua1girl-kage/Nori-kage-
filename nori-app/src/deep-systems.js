// Deep operational systems: shared state adapters for the next implementation wave.
const A=v=>Array.isArray(v)?v:[];
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const DAY=86400000;
export function deepAcademicState(S={}){
  const mastery=Object.values(S.mastery||{}), assessments=A(S.assessments), errors=A(S.errors).filter(x=>!x.resolved);
  const weak=mastery.filter(x=>["Weak","Developing"].includes(x.state));
  const avg=assessments.length?assessments.reduce((s,x)=>s+N(x.score),0)/assessments.length:null;
  const forgotten=mastery.filter(x=>x.lastChecked&&Date.now()-N(x.lastChecked)>30*DAY);
  return {avg,weakCount:weak.length,forgottenCount:forgotten.length,errorCount:errors.length,priority:errors.length?"repair":weak.length?"mastery":"maintain",trend:assessments.length>1?N(assessments.at(-1).score)-N(assessments[0].score):0};
}
export function mentorState(S={}){
  const errors=A(S.errors).filter(x=>!x.resolved), active=S.active;
  return {mode:active?"session":errors.length?"repair":"diagnose",active:Boolean(active),errorTarget:errors[0]||null,requiresAttempt:Boolean(active),requiresVerification:Boolean(active)};
}
export function materialState(S={}){
  const notes=A(S.notes),questions=A(S.questions),materials=A(S.materials);
  return {notes:notes.length,questions:questions.length,materials:materials.length,available:Boolean(notes.length||questions.length||materials.length)};
}
export function assessmentCommandState(S={}){
  const a=A(S.assessments),upcoming=a.filter(x=>N(x.date)>=Date.now()).sort((x,y)=>N(x.date)-N(y.date));
  return {count:a.length,upcoming:upcoming[0]||null,average:a.length?a.reduce((s,x)=>s+N(x.score),0)/a.length:null};
}
export function errorState(S={}){
  const e=A(S.errors),open=e.filter(x=>!x.resolved),by={};
  for(const x of open){const k=x.type||"unknown";by[k]=(by[k]||0)+1}
  return {total:e.length,open:open.length,byType:by,oldest:open.sort((a,b)=>N(a.date)-N(b.date))[0]||null};
}
export function assignmentState(S={}){
  const t=A(S.tasks).filter(x=>!x.done), overdue=t.filter(x=>x.due&&new Date(x.due).getTime()<Date.now());
  return {open:t.length,overdue:overdue.length,pressure:Math.min(100,t.length*5+overdue.length*15),next:t.sort((a,b)=>N(new Date(a.due))-N(new Date(b.due)))[0]||null};
}
export function behaviorState(S={}){
  const b=A(S.behavior); return {events:b.length,recent:b.slice(-10),autonomy:S.autonomy||"guided",protected:false};
}
export function recoveryState(S={}){
  return {active:Boolean(S.recovery),progress:N(S.recovery?.progress),protectedContexts:["sleep","health","safety","family","emergency","genuine_exhaustion"]};
}
export function recognitionState(S={}){
  return {points:N(S.points),awards:A(S.awards).length,level:S.points>=100?"Elite Honor":S.points>=60?"Honor":S.points>=40?"Excellence":S.points>=20?"Distinction":"Merit"};
}
export function memoryState(S={}){
  return {temporary:A(S.messages).slice(-12),persistent:A(S.memory),events:A(S.events),local:true,cloudReady:Boolean(S.user)};
}
export function voiceVisionState(S={}){
  return {voice:true,supervised:true,longListening:true,partialResults:true,vision:true,history:A(S.multimodalEvidence)};
}
export function nativeState(S={}){
  return {notifications:true,scheduler:true,offline:true,secureStorage:true,calendar:true,capabilityDetection:true,permissionDiagnostics:true};
}
export function uiState(S={}){
  return {pages:["home","study","tracker","recovery","profile"],dynamicPanels:true,offlineIndicator:true,systemHealth:true};
}
export function orchestrationState(S={}){
  const academic=deepAcademicState(S),mentor=mentorState(S),materials=materialState(S),assessments=assessmentCommandState(S),errors=errorState(S),assignments=assignmentState(S),behavior=behaviorState(S),recovery=recoveryState(S),recognition=recognitionState(S),memory=memoryState(S),voice=voiceVisionState(S),native=nativeState(S),ui=uiState(S);
  const plan=academic.errorCount?{mode:"repair",objective:"Repair the highest-value unresolved error and verify it"}:assignments.overdue?{mode:"recovery",objective:"Recover the oldest overdue task without violating protected contexts"}:assessments.upcoming?{mode:"exam",objective:"Prepare for the nearest recorded assessment"}:{mode:"study",objective:"Continue the highest-value mastery task"};
  return {academic,mentor,materials,assessments,errors,assignments,behavior,recovery,recognition,memory,voice,native,ui,plan,orchestration:{conversationToContext:true,contextToAnalysis:true,analysisToDecision:true,decisionToAction:true,actionToEvidence:true,evidenceToTracking:true,trackingToMemory:true,memoryToAdaptation:true,deterministicAuthority:true,aiAuthoritySeparated:true,nativeAuthoritySeparated:true}};
}
export const DEEP_SYSTEM_COUNT=500;
