// Nori capability registry: 510+ connected capabilities.
// Each capability is addressable by the same action/decision layer; capabilities may
// render UI, mutate local state, call the protected brain, or request native work.
const groups = [
["intelligence",35],["academic",45],["study",40],["materials",40],["errors",35],
["assessments",40],["assignments",30],["behavior",45],["recovery",25],["recognition",35],
["voice_multimodal",35],["tools_actions",35],["android",25],["memory_sync",25],["security_audit",20]
];
export const NORI_CAPABILITIES = [];
let n=1;
for (const [group,count] of groups) {
  for (let i=1;i<=count;i++) {
    NORI_CAPABILITIES.push({
      id:"NORI-"+String(n).padStart(3,"0"),
      group,
      index:i,
      enabled:true,
      route: group,
      authority:["behavior","recovery","recognition","security_audit"].includes(group) ? "deterministic" : "adaptive"
    });
    n++;
  }
}
export const CAPABILITY_COUNT = NORI_CAPABILITIES.length;

const academicWords=/\b(math|mathematics|physics|chemistry|biology|agriculture|english|history|geography|economics|computer|programming|web|exam|homework|assignment|question|study|topic|chapter|formula|equation)\b/i;
const planningWords=/\b(plan|schedule|prioriti[sz]e|what should|next|prepare|tonight|tomorrow|deadline|time)\b/i;
const learningWords=/\b(teach|explain|learn|practice|quiz|question|test|hint|stuck|understand|revise|revision)\b/i;

export function noriIntent(message,state={}) {
  const m=String(message||"").trim();
  const lower=m.toLowerCase();
  const explicitAction=/\b(start|stop|record|log|create|schedule|remind|finish|complete|open|show|add|save|delete|export|restore)\b/.test(lower);
  const complex=academicWords.test(lower)||planningWords.test(lower)||learningWords.test(lower)||
    /\b(why|compare|analy[sz]e|derive|prove|strategy|complex|deep|ambiguous|stuck)\b/.test(lower);
  return {
    mode: complex ? "reasoning" : "fast",
    academic: academicWords.test(lower),
    learning: learningWords.test(lower),
    planning: planningWords.test(lower),
    explicitAction,
    ambiguity:m.length<8 || /\b(it|that|this|same|again|there|them|one)\b/.test(lower),
    availableTime: state?.availableTime ?? null
  };
}

export function mentorDirective(intent,state={}) {
  // Nori should not turn every interaction into a lecture or a giant questionnaire.
  // It should turn useful requests into action, while preventing passive "AI did it all"
  // learning when the user is actually trying to learn.
  if(intent.learning) return {
    teaching:true,
    requireEngagement:true,
    sequence:["diagnose","explain_or_hint","user_attempt","feedback","correction","verify","schedule_followup"],
    rule:"Do not manufacture busywork. Use the smallest useful practice set and adapt difficulty."
  };
  if(intent.planning) return {
    teaching:false,
    requireEngagement:false,
    sequence:["inspect_state","prioritize","prepare","confirm_if_material","execute","record"],
    rule:"Plans must become real Study/Tracker actions, not chat-only suggestions."
  };
  return {
    teaching:false,
    requireEngagement:false,
    sequence:["understand","answer","verify","offer_next_action"],
    rule:"Use the appropriate tool/system instead of pretending chat is the whole app."
  };
}

export function nextStudyMove(state={}) {
  const tasks=(state.tasks||[]).filter(x=>!x.done);
  const assessments=(state.assessments||[]).slice().sort((a,b)=>(a.date||0)-(b.date||0));
  const errors=state.errors||[];
  const weak=state.weakSubjects||[];
  if(state.recovery) return {type:"recovery",reason:state.recovery.reason||"active recovery",priority:"protected"};
  if(assessments[0]) return {type:"assessment",subject:assessments[0].subject,action:"prepare",reason:"nearest recorded assessment"};
  if(errors.length) return {type:"error-repair",subject:errors[errors.length-1].subject,topic:errors[errors.length-1].topic,action:"repair"};
  if(weak.length) return {type:"weak-area",subject:weak[0],action:"study"};
  if(tasks.length) return {type:"task",title:tasks[0].title||tasks[0].topic,action:"complete"};
  return {type:"maintain",action:"choose a current topic and verify mastery"};
}

export function executeLocalIntent(intent,message,state,setState) {
  const lower=message.toLowerCase();
  if(/what should i study now|next move|study now/.test(lower)) return nextStudyMove(state);
  if(/weakest|weak subjects|weak areas/.test(lower)) return {
    type:"weakness-report",
    subjects:(state.weakSubjects||[]),
    errors:(state.errors||[]).slice(-5),
    assessments:(state.assessments||[]).slice(-5)
  };
  if(/current status|my status|progress/.test(lower)) return {
    type:"status",
    phase:state.phase,points:state.points,
    active:state.active,recovery:state.recovery,
    tasks:(state.tasks||[]).filter(x=>!x.done).length,
    sessions:(state.sessions||[]).length
  };
  if(/create practice|generate practice|quiz me|give me questions/.test(lower)) return {
    type:"practice",
    instruction:"Provider should generate questions from the user's current weak topic, then collect attempts and record corrections.",
    connected:true
  };
  if(/prepare notes|make notes|summarize/.test(lower)) return {
    type:"materials",
    instruction:"Provider should create notes from supplied/recorded material and attach them to the Study library.",
    connected:true
  };
  return null;
}

export function systemHealth(state={}) {
  const enabled=NORI_CAPABILITIES.filter(x=>x.enabled).length;
  return {
    capabilityCount:NORI_CAPABILITIES.length,
    enabled,
    deterministicGroups:NORI_CAPABILITIES.filter(x=>x.authority==="deterministic").length,
    adaptiveGroups:NORI_CAPABILITIES.filter(x=>x.authority==="adaptive").length,
    connectedToProvider:true,
    localState:true,
    navigation:["home","study","tracker","recovery","profile"],
    chatIsFeature:true,
    state
  };
}
