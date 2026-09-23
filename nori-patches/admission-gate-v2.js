/* Nori V36.5 admission gate hardening.
   Authentication remains required. Admission exceptions are server-authorized by email/rule.
   Danat's approved admin account never enters the legacy PIN flow.
   Approved students enter normally; admin-only surfaces remain role-gated. */
(function(){
'use strict';
const Native=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.NoriAuth;
const C=()=>window.NORI_PRODUCTION_CONFIG||{};
const state={status:'SIGN_UP_REQUIRED',canEnter:false,mode:'signup',profile:null,error:null};

function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function host(){let h=document.querySelector('#nori-auth-gate');if(!h){h=document.createElement('div');h.id='nori-auth-gate';document.body.prepend(h);}return h;}
function emailOf(session,profile){return String(profile?.email||profile?.primary_email||session?.user?.email||'').trim().toLowerCase();}
function isDanat(email){return email==='danatbayu@gmail.com';}
function isExceptionStudent(email){return email==='mirasutton58@gmail.com'||email==='justicesteve.councle@gmail.com';}
function roleOf(profile){return String(profile?.role||'STUDENT').toUpperCase();}

async function nativeStatus(){
  if(!Native?.status)return;
  try{Object.assign(state,await Native.status());}catch(_){}
}

async function ensureServerAdmission(session){
  const email=String(session?.user?.email||'').toLowerCase();
  if(!isDanat(email)&&!isExceptionStudent(email))return null;
  try{
    const r=await fetch(C().supabaseUrl+'/functions/v1/admission-control',{
      method:'POST',
      headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({action:'ensure'})
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||j.reason||'admission_control_failed');
    return j;
  }catch(e){
    state.error=e;
    return null;
  }
}

async function syncAdmission(){
  const a=window.NoriSyncAuth;
  if(!a||!a.configured()){state.status='AUTH_NOT_CONFIGURED';state.canEnter=false;return;}
  try{
    const sr=await a.session(), session=sr?.data?.session;
    if(!session){state.status='SIGN_UP_REQUIRED';state.canEnter=false;state.profile=null;return;}

    await ensureServerAdmission(session);
    const p=await a.profile();
    state.profile=p;
    const email=emailOf(session,p);
    const role=roleOf(p);
    const approved=String(p?.admission_status||'').toUpperCase()==='APPROVED';

    if(isDanat(email)&&approved&&(role==='ADMIN'||role==='OWNER')){
      state.status='APPROVED_ADMIN';
      state.canEnter=true;
      if(Native?.acceptApprovedSession){
        await Native.acceptApprovedSession({
          userId:session.user.id,name:p?.display_name||p?.full_name||'',
          email,backupEmail:p?.backup_email,age:p?.age,
          sessionId:session.access_token,role
        });
      }
      await nativeStatus();
      return;
    }

    if(approved&&['STUDENT','ADMIN','OWNER'].includes(role)){
      state.status='APPROVED';
      state.canEnter=true;
      if(Native?.acceptApprovedSession){
        await Native.acceptApprovedSession({
          userId:session.user.id,name:p?.display_name||p?.full_name||'',
          email,backupEmail:p?.backup_email,age:p?.age,
          sessionId:session.access_token,role
        });
      }
      await nativeStatus();
      return;
    }

    state.status=p?(p.admission_status||'PENDING'):'PROFILE_PENDING';
    state.canEnter=false;
  }catch(e){
    state.status='PENDING_REVIEW';state.canEnter=false;state.error=e;
  }
}

async function refresh(){await syncAdmission();await nativeStatus();render();}

function render(){
  const h=host();
  if(state.canEnter){h.hidden=true;document.body.classList.remove('nori-auth-locked');return;}
  h.hidden=false;document.body.classList.add('nori-auth-locked');
  const signup=state.mode==='signup';
  h.innerHTML=`<div class="nori-auth-card">
    <div class="nori-auth-mark">NORI PROGRAM · ADMISSION GATE</div>
    <h1>${signup?'Create your Nori account':'Sign in to Nori'}</h1>
    <p>${signup?'Create a registered Nori account. Approved accounts enter without a second admission PIN.':'Sign in with your registered Nori account.'}</p>
    <div class="nori-auth-tabs">
      <button id="nori-auth-signup-tab" class="${signup?'active':''}">SIGN UP</button>
      <button id="nori-auth-login-tab" class="${!signup?'active':''}">SIGN IN</button>
    </div>
    ${signup?`<div class="nori-auth-grid">
      <div class="nori-auth-field"><label>NAME</label><input id="nori-auth-name" autocomplete="name"></div>
      <div class="nori-auth-field"><label>AGE <span style="color:#777">(optional for approved administrators)</span></label><input id="nori-auth-age" type="number" min="13" max="120" inputmode="numeric"></div>
      <div class="nori-auth-field"><label>PRIMARY EMAIL</label><input id="nori-auth-email" type="email" autocomplete="email"></div>
      <div class="nori-auth-field"><label>BACKUP EMAIL</label><input id="nori-auth-backup" type="email" autocomplete="email"></div>
      <div class="nori-auth-field full"><label>PASSWORD</label><input id="nori-auth-password" type="password" autocomplete="new-password"></div>
    </div><div class="nori-auth-actions"><button id="nori-auth-submit">CREATE ACCOUNT / APPLY</button></div>`:
    `<div class="nori-auth-grid">
      <div class="nori-auth-field full"><label>EMAIL</label><input id="nori-auth-email" type="email" autocomplete="email"></div>
      <div class="nori-auth-field full"><label>PASSWORD</label><input id="nori-auth-password" type="password" autocomplete="current-password"></div>
    </div><div class="nori-auth-actions"><button id="nori-auth-submit">SIGN IN</button></div>`}
    <div class="nori-auth-status">${esc(state.status==='PENDING'?'Account created. Complete the normal account verification if Supabase requests it.':state.status==='REJECTED'?'This account is not currently admitted to Nori.':state.status==='PROFILE_PENDING'?'Account exists, but its Nori profile is still being created.':state.error?.message||'No authenticated Nori session is active.')}</div>
    <div class="nori-auth-note">Nori only unlocks the workspace after a valid signed-in session and an approved server-side profile. Optional personal information can be declined later and is not treated as a failed admission.</div>
  </div>`;
  h.querySelector('#nori-auth-signup-tab').onclick=()=>{state.mode='signup';render();};
  h.querySelector('#nori-auth-login-tab').onclick=()=>{state.mode='login';render();};
  h.querySelector('#nori-auth-submit').onclick=submit;
}

async function legacyAdminVerification(email){
  try{
    const ss=(await window.NoriProductionAuth?.session?.())?.data?.session;
    if(!ss)return false;
    const base=C().supabaseUrl+'/functions/v1/admin-verify';
    const start=await fetch(base,{method:'POST',headers:{Authorization:'Bearer '+ss.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'start'})});
    const sj=await start.json().catch(()=>({}));
    if(!start.ok)return false;
    const pin=prompt('ADMINISTRATOR VERIFICATION\nA verification PIN was sent to '+email+'.\nEnter the 6-digit PIN:');
    if(!pin)return false;
    const vr=await fetch(base,{method:'POST',headers:{Authorization:'Bearer '+ss.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'verify_pin',pin:String(pin).trim()})});
    const vj=await vr.json().catch(()=>({}));
    if(!vr.ok)throw new Error(vj.error||'PIN rejected');
    return !!vj.verified;
  }catch(e){state.error=e;return false;}
}

async function submit(){
  const v=id=>document.getElementById(id)?.value.trim();
  const a=window.NoriSyncAuth;
  if(!a||!a.configured()){alert('Nori cloud authentication is not configured.');return;}
  try{
    if(state.mode==='signup'){
      const name=v('nori-auth-name'),ageRaw=v('nori-auth-age'),age=ageRaw?Number(ageRaw):null;
      const email=v('nori-auth-email').toLowerCase(),backup=v('nori-auth-backup'),password=v('nori-auth-password');
      if(!name||!email||!backup||!password||email===backup){alert('Enter name, primary email, a different backup email and a password.');return;}
      const r=await a.signUp(email,password,{name});
      if(r.user&&r.session)await a.createPendingProfile({name,age,email,backupEmail:backup});
      if(r.session){await ensureServerAdmission(r.session);await refresh();}
      else alert('Account created. Complete the normal Supabase account verification if requested, then sign in.');
    }else{
      const email=v('nori-auth-email').toLowerCase();
      const result=await a.signIn(email,v('nori-auth-password'));
      await ensureServerAdmission(result?.session);
      await syncAdmission();
      if(!state.canEnter&&roleOf(state.profile)==='ADMIN'&&!isDanat(email)){
        if(await legacyAdminVerification(email))await syncAdmission();
      }
      if(!state.canEnter)alert('Sign-in succeeded, but the server has not approved this account yet.');
      await refresh();
    }
  }catch(e){alert(e?.message||String(e));}
}
function mount(){refresh();}
window.NoriAuthGate={mount,refresh,state};
document.addEventListener('DOMContentLoaded',mount);
})();