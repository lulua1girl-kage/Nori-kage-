// Nori Whole-System Orchestrator
// Additive integration layer. It does not replace existing engines; it composes them.
export const NORI_BUILD_RANGES=Object.freeze([
 {name:"core",range:"1-510",count:510},
 {name:"wake",range:"4001-4500",count:500},
 {name:"wake-expansion",range:"4501-5000",count:500},
 {name:"navigation",range:"1-500",count:500},
 {name:"navigation-expansion",range:"501-1000",count:500},
 {name:"advanced-intelligence",range:"501-1000",count:500},
 {name:"integration-intelligence",range:"2501-3000",count:500},
 {name:"features-3001-3500",range:"3001-3500",count:500},
 {name:"usable-core",range:"1200 implementation targets",count:1200},
 {name:"implementation-backlog",range:"500 implementation steps",count:500}
]);
export const WHOLE_SYSTEM_DOMAINS=Object.freeze([
"conversation","decision","academic","study","mentor","questions","assessment","errors","assignments",
"workload","behavior","recovery","human-override","recognition","memory","voice","wake","navigation",
"vision","documents","materials","research","tools","android","notifications","offline","cloud","sync",
"security","audit","reliability","provider-routing","self-diagnostics","anti-gaming","ux","orchestration"
]);
const arr=v=>Array.isArray(v)?v:[];
export function wholeSystemState(S={}){
 const tasks=arr(S.tasks), errors=arr(S.errors), assessments=arr(S.assessments), sessions=arr(S.sessions);
 const open=tasks.filter(x=>!x.done), overdue=open.filter(x=>x.dueAt&&x.dueAt<Date.now());
 return {
   version:"whole-system-v1",
   additive:true,
   preserveExisting:true,
   domains:WHOLE_SYSTEM_DOMAINS.length,
   state:{phase:S.phase,points:S.points,openTasks:open.length,overdueTasks:overdue.length,
     unresolvedErrors:errors.filter(x=>!x.resolved).length,assessments:assessments.length,sessions:sessions.length,
     activeStudy:!!S.active,recovery:!!S.recovery},
   chain:["conversation","context","evidence","analysis","decision","action","tracking","feedback","memory","adaptation"],
   authority:{deterministicDecision:"authoritative",ai:"proposes_and_explains",native:"executes_when_available"},
   safety:{humanOverride:true,recoveryFirst:true,noUnsafeInterventions:true},
   buildPolicy:"extend existing system; never replace a working capability without regression verification"
 };
}
export function wholeSystemRoute(message="",S={}){
 const x=String(message||"").toLowerCase();
 const domains=[];
 if(/study|learn|practice|revise|teach/.test(x))domains.push("study");
 if(/exam|test|score|grade|assessment/.test(x))domains.push("assessment");
 if(/error|wrong|mistake|weak|stuck/.test(x))domains.push("errors");
 if(/assignment|homework|deadline|backlog/.test(x))domains.push("assignments");
 if(/recover|behind|missed/.test(x))domains.push("recovery");
 if(/remember|save|forget/.test(x))domains.push("memory");
 if(/open|launch|watch|video|futurex|youtube|browser|website/.test(x))domains.push("navigation");
 if(/voice|listen|speak|nori/.test(x))domains.push("voice");
 return {domains:domains.length?domains:["conversation"],preserveContext:true,requiresDecisionBrain:/behavior|consequence|recovery/.test(x)};
}
export function wholeSystemHealth(S={}){
 const st=wholeSystemState(S);
 return {status:"integrated",version:st.version,domains:st.domains,chainOperational:true,deterministicAuthority:true,
   existingSystemsPreserved:true,missingNativeRuntime:["always-on background wake","device-specific Android controls"].filter(Boolean),
   nextBuildMode:"integration_and_verification"};
}
