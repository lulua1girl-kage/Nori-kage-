// Nori Usable Core Generation — 1,200 implementation targets.
// Additive only: preserve every existing Nori system and state.
const AREAS=["App actually runs","Nori brain","Academic system","Mentor loop","Voice","Study","Tracker","Recovery","Memory","AI connection","Android layer","Full integration"];
const TARGETS={
"App actually runs":["startup","navigation","state","data","errors","UI","diagnostics","reliability","backup","end-to-end"],
"Nori brain":["understanding","state awareness","reasoning","academic reasoning","mentor behavior","conversation","actions","deterministic authority","AI reliability","closed loop"],
"Academic system":["academic structure","mastery","evidence","subject intelligence","study records","questions","evaluation","error notebook","planning","feedback"],
"Mentor loop":["diagnosis","teaching","adaptive teaching","practice","feedback","session control","planning","mentor intelligence","personalization","verification"],
"Voice":["voice input","conversation","wake system","TTS","reliability","voice commands","academic voice","conversation quality","accessibility","testing"],
"Study":["dashboard","session creation","session controls","study modes","materials","adaptive study","evidence","feedback","anti-busywork","completion"],
"Tracker":["academic","assessment","errors","study","assignments","exams","behavior","recognition","automatic updates","intelligence"],
"Recovery":["detection","cause analysis","Human Override","recovery plans","recovery actions","verification","behavioral recovery","safety","history","completion"],
"Memory":["memory types","personalization","academic memory","retrieval","governance","cloud","synchronization","backup","privacy","adaptive memory"],
"AI connection":["Supabase","AI routing","brain requests","context","response handling","action safety","AI quality","intelligence","reliability","end-to-end"],
"Android layer":["native foundation","notifications","scheduling","alarms","microphone","TTS","device integration","future controls","Android UX","testing"],
"Full integration":["core orchestration","cross-system decisions","priority engine","daily operating system","command center","automatic flow","real-world scenarios","anti-fragmentation","verification","final Nori behavior"]};
export const USABLE_CORE_FEATURES=AREAS.flatMap((area,a)=>TARGETS[area].flatMap((domain,d)=>Array.from({length:10},(_,n)=>({id:a*100+d*10+n+1,area,domain,feature:`${domain}: target ${n+1}`,status:"planned",preserveExisting:true}))));
export const USABLE_CORE_FEATURE_COUNT=USABLE_CORE_FEATURES.length;
export function usableCoreSnapshot(state={}){const p=state.usableCoreProgress||{};let verified=0,building=0;for(const f of USABLE_CORE_FEATURES){const s=p[f.id]?.status||f.status;if(s==="verified"||s==="complete")verified++;if(s==="building"||s==="in-progress")building++;}return {total:USABLE_CORE_FEATURE_COUNT,verified,building,planned:USABLE_CORE_FEATURE_COUNT-verified-building,preserveExisting:true,areas:AREAS};}
export function setUsableCoreState(state,id,status="building",evidence=""){const f=USABLE_CORE_FEATURES.find(x=>x.id===Number(id));if(!f)return state;return {...state,usableCoreProgress:{...(state.usableCoreProgress||{}),[f.id]:{status,evidence,updatedAt:new Date().toISOString(),preserveExisting:true}}};}
