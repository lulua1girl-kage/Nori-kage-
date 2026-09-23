/* Nori Admission Gate — patched admission/administrator flow. */
(function(){
'use strict';
const Native=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.NoriAuth;
const state={status:'SIGN_UP_REQUIRED',canEnter:false,mode:'signup',profile:null,adminVerified:false};
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function host(){let h=document.querySelector('#nori-auth-gate');if(!h){h=document.createElement('div');h.id='nori-auth-gate';document.body.prepend(h);}return h;}
async function nativeStatus(){if(!Native)return;try{Object.assign(state,await Native.status());}catch(e){}}
async function syncAdmission(){
  const a=window.NoriSyncAuth;if(!a||!a.configured())return;
  try{
    const session=(await a.session()).data.session;
    if(!session){state.status='SIGN_UP_REQUIRED';state.canEnter=false;state.profile=null;state.adminVerified=false;return;}
    const C=window.NORI_PRODUCTION_CONFIG||{};
    let rule=null;
    try{
      const rr=await fetch((C.supabaseUrl||'')+'/functions/v1/admission-control',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'resolve'})});
      rule=await rr.json().catch(()=>null);
    }catch(e){}
    const p=await a.profile();state.profile=p;
    const role=String(p?.role||rule?.role||'STUDENT').toUpperCase();
    const approved=String(p?.admission_status||rule?.admission_status||'').toUpperCase()==='APPROVED';
    const admin=(role==='ADMIN'||role==='OWNER');
    const bypass=rule?.bypassed===true || rule?.verification_required===false;
    if(approved && (!admin || bypass || state.adminVerified===true)){
      await Native.acceptApprovedSession({userId:session.user.id,name:p?.display_name||p?.full_name||session.user.email,email:p?.primary_email||p?.email||session.user.email,backupEmail:p?.backup_email||'',age:p?.age||0,sessionId:session.access_token,role:role});
      await nativeStatus();return;
    }
    state.status=admin&&approved?'ADMIN_VERIFICATION_REQUIRED':(p?(p.admission_status||'PENDING'):'PROFILE_PENDING');state.canEnter=false;
  }catch(e){state.status='PENDING_REVIEW';state.canEnter=false;state.error=e;}
}
async function refresh(){await syncAdmission();await nativeStatus();render();}
function render(){const h=host();if(state.canEnter){h.hidden=true;document.body.classList.remove('nori-auth-locked');return;}h.hidden=false;document.body.classList.add('nori-auth-locked');const signup=state.mode==='signup';h.innerHTML=`<div class="nori-auth-card"><div class="nori-auth-mark">NORI PROGRAM · ADMISSION GATE</div><h1>${signup?'Create your Nori account':'Sign in to Nori'}</h1><p>${signup?'Nori is a registered-user program. Your name, age, identity, library and learning history stay attached to your approved account.':'Authentication alone does not unlock Nori. Your account must also be admitted to the Nori program.'}</p><div class="nori-auth-tabs"><button id="nori-auth-signup-tab" class="${signup?'active':''}">SIGN UP</button><button id="nori-auth-login-tab" class="${!signup?'active':''}">SIGN IN</button></div>${signup?`<div class="nori-auth-grid"><div class="nori-auth-field"><label>NAME</label><input id="nori-auth-name" autocomplete="name"></div><div class="nori-auth-field"><label>AGE <span style="color:#777">(required for student accounts; optional for pre-approved administrators)</span></label><input id="nori-auth-age" type="number" min="13" max="120" inputmode="numeric"></div><div class="nori-auth-field"><label>PRIMARY EMAIL</label><input id="nori-auth-email" type="email" autocomplete="email"></div><div class="nori-auth-field"><label>BACKUP EMAIL</label><input id="nori-auth-backup" type="email" autocomplete="email"></div><div class="nori-auth-field full"><label>PASSWORD</label><input id="nori-auth-password" type="password" autocomplete="new-password"></div></div><div class="nori-auth-actions"><button id="nori-auth-submit">CREATE ACCOUNT / APPLY</button></div>`:`<div class="nori-auth-grid"><div class="nori-auth-field full"><label>EMAIL</label><input id="nori-auth-email" type="email" autocomplete="email"></div><div class="nori-auth-field full"><label>PASSWORD</label><input id="nori-auth-password" type="password" autocomplete="current-password"></div></div><div class="nori-auth-actions"><button id="nori-auth-submit">SIGN IN</button></div>`}<div class="nori-auth-status">${esc(state.status==='PENDING'?'Account created. Student access is awaiting the account setup to finish.':state.status==='REJECTED'?'This account is not currently admitted to the Nori program.':state.status==='PROFILE_PENDING'?'Account exists, but its Nori profile is still being created.':state.status==='ADMIN_VERIFICATION_REQUIRED'?'Administrator verification is required for this account.':'No authenticated Nori session is active.')}</div><div class="nori-auth-note">Pre-approved student accounts do not require a separate Nori admission PIN. Administrator verification is required only for administrators not explicitly exempted by the admission policy.</div></div>`;
h.querySelector('#nori-auth-signup-tab').onclick=()=>{state.mode='signup';render();};h.querySelector('#nori-auth-login-tab').onclick=()=>{state.mode='login';render();};h.querySelector('#nori-auth-submit').onclick=submit;}
async function adminVerification(email){
  try{
    const C=window.NORI_PRODUCTION_CONFIG||{}; if(!C.supabaseUrl||!window.NoriProductionAuth?.session) return false;
    const ss=(await window.NoriProductionAuth.session())?.data?.session; if(!ss) return false;
    const base=C.supabaseUrl+'/functions/v1/admin-verify';
    const startResp=await fetch(base,{method:'POST',headers:{Authorization:'Bearer '+ss.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'start'})});
    const sj=await startResp.json().catch(()=>({}));
    if(!startResp.ok) throw new Error(sj.reason||sj.error||'Administrator verification could not start');
    if(sj.bypassed===true || sj.verified===true){state.adminVerified=true;return true;}
    const pin=prompt('ADMINISTRATOR VERIFICATION\nA verification PIN was sent to '+email+'.\nEnter the 6-digit PIN:');
    if(!pin)return false;
    const vr=await fetch(base,{method:'POST',headers:{Authorization:'Bearer '+ss.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'verify_pin',pin:String(pin).trim()})});
    const vj=await vr.json().catch(()=>({}));
    if(!vr.ok) throw new Error(vj.reason||vj.error||'PIN rejected');
    state.adminVerified=true;
    return true;
  }catch(e){alert('Administrator verification could not start: '+(e?.message||String(e)));return false;}
}
async function submit(){const v=id=>document.getElementById(id)?.value.trim();const a=window.NoriSyncAuth;if(!a||!a.configured()){alert('Nori cloud authentication is not configured yet. The backend must be connected before real accounts can enter.');return;}try{if(state.mode==='signup'){const name=v('nori-auth-name'),ageRaw=v('nori-auth-age'),age=ageRaw?Number(ageRaw):null,email=v('nori-auth-email'),backup=v('nori-auth-backup'),password=v('nori-auth-password');if(!name||!email||!backup||!password||email.toLowerCase()===backup.toLowerCase()){alert('Enter name, age, primary email, a different backup email and a password.');return;}const r=await a.signUp(email,password,{name:name});if(r.user&&r.session){await a.createPendingProfile({name,age,email,backupEmail:backup});}alert('Account created. Verify your email. Pre-approved accounts skip the separate Nori admission PIN.');}else{const email=v('nori-auth-email');state.adminVerified=false;await a.signIn(email,v('nori-auth-password'));await syncAdmission();let adminStarted=false;if(!state.canEnter && ['ADMIN','OWNER'].includes(String(state.profile?.role||'').toUpperCase()))adminStarted=await adminVerification(email);if(adminStarted)await syncAdmission();if(!state.canEnter&&!adminStarted)alert(state.status==='ADMIN_VERIFICATION_REQUIRED'?'Administrator verification is required to enter Nori.':'Sign-in succeeded, but Nori is still waiting for the account profile to become available. Please try again shortly.');}await refresh();}catch(e){alert(e?.message||String(e));}}
function mount(){refresh();}
window.NoriAuthGate={mount,refresh,state};document.addEventListener('DOMContentLoaded',mount);
})();