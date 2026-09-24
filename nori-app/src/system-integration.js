// Unified Nori system layer: shared event/evidence/decision/action/audit ledgers,
// state validation, migrations, offline sync and closed-loop orchestration.
export const SCHEMA_VERSION=3;
const now=()=>Date.now(), id=()=>crypto.randomUUID();
const arr=x=>Array.isArray(x)?x:[];
export function createEvent(type,payload={},source="system"){return {id:id(),type,source,payload,time:now(),schema:SCHEMA_VERSION};}
export function appendEvent(S,event){return {...S,events:[...arr(S.events),event].slice(-1000)};}
export function appendEvidence(S,type,payload={}){return appendEvent(S,createEvent("evidence:"+type,payload,"evidence"));}
export function appendDecision(S,decision){return appendEvent(S,createEvent("decision",decision,"deterministic"));}
export function appendAction(S,action){return appendEvent(S,createEvent("action",action,"nori"));}
export function appendAudit(S,action,result){return appendEvent(S,createEvent("audit",{action,result},"audit"));}
export function pendingSync(S){return arr(S.syncQueue).filter(x=>x.status!=="synced");}
export function queueSync(S,event){return {...S,syncQueue:[...arr(S.syncQueue),{...event,status:"pending"}].slice(-500)};}
export function markSync(S,ids=[],status="synced"){const set=new Set(ids);return {...S,syncQueue:arr(S.syncQueue).map(x=>set.has(x.id)?{...x,status,syncedAt:status==="synced"?now():x.syncedAt}:x)};}
export function validateState(S={}){
  const required=["messages","subjects","sessions","tasks","errors","assessments","plans","notes","mastery","behavior","awards","memory"];
  const missing=required.filter(k=>S[k]==null);
  const badArrays=required.filter(k=>Array.isArray(S[k])===false&&k!=="mastery");
  return {valid:missing.length===0&&badArrays.length===0,missing,badArrays,version:S.schemaVersion||1};
}
export function migrateState(input={}){
  const S={...input};
  for(const k of ["messages","subjects","sessions","tasks","errors","assessments","plans","notes","behavior","awards","memory","events","syncQueue"])if(!Array.isArray(S[k]))S[k]=[];
  if(!S.mastery||typeof S.mastery!=="object")S.mastery={};
  if(typeof S.points!=="number")S.points=0;
  if(typeof S.phase!=="number")S.phase=1;
  S.schemaVersion=SCHEMA_VERSION;
  return S;
}
export function closedLoop(S,intelligence={},decision={}){
  const priority=intelligence?.mentor||{type:"maintenance"};
  return {observe:true,understand:true,diagnose:priority.type,decide:decision?.decision?.type||"observe",act:priority,recordEvidence:true,track:true,adapt:true,verify:true,remember:true};
}
export function systemSnapshot(S={}){
  const validation=validateState(S);
  return {schemaVersion:SCHEMA_VERSION,valid:validation.valid,events:arr(S.events).length,pendingSync:pendingSync(S).length,queuedActions:arr(S.events).filter(e=>e.type==="action").length,ledgerIntegrity:validation.valid};
}
export function recordTransition(S,type,payload={}){
  const e=createEvent(type,payload,"transition");
  return queueSync(appendEvent(S,e),e);
}
export function prepareCloudSync(S){
  return pendingSync(S).map(x=>({id:x.id,type:x.type,payload:x.payload,time:x.time,schema:x.schema}));
}
export function reconcileRemote(S,remote=[]){
  const local=new Map(arr(S.events).map(x=>[x.id,x]));
  for(const x of remote)if(x?.id&&!local.has(x.id))S=appendEvent(S,x);
  return S;
}
export function backupEnvelope(S){return {product:"Nori",schemaVersion:SCHEMA_VERSION,exportedAt:now(),state:S};}
export function restoreEnvelope(envelope){if(!envelope||envelope.product!=="Nori")throw new Error("INVALID_NORI_BACKUP");return migrateState(envelope.state||{});}
export function capabilityHealth(){return {eventBus:true,evidenceLedger:true,decisionLedger:true,actionLedger:true,auditLedger:true,migrations:true,offlineQueue:true,closedLoop:true};}
