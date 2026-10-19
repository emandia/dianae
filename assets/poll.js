/* Poll data lives on the server. sessionStorage holds only a random session credential. */
(()=>{'use strict';
const settings=document.querySelector('#poll-settings');if(!settings)return;
const {config,text:t,lang}=JSON.parse(settings.textContent);
const status=document.querySelector('#poll-status'),options=[...document.querySelectorAll('[data-vote]')],emailStep=document.querySelector('#email-step'),form=document.querySelector('#poll-email'),field=form.querySelector('fieldset'),email=document.querySelector('#poll-email-address'),results=document.querySelector('#poll-results');
let ready=false,busy=false,token='',base='';
function ensureToken(){
if(token)return;
try{token=sessionStorage.getItem('dianae-poll-v1')||'';}catch{}
if(!/^[a-f0-9]{64}$/.test(token)){
 const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);token=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
 try{sessionStorage.setItem('dianae-poll-v1',token);}catch{}
}
}
function select(choice){options.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vote===choice)));}
function lock(value){busy=value;options.forEach(b=>b.disabled=value);field.disabled=value;}
async function request(path,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(base+path,{method:body?'POST':'GET',mode:'cors',credentials:'omit',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
  const data=await response.json();if(!response.ok||data.ok===false)throw new Error('service');return data;
 }finally{clearTimeout(timer);}
}
options.forEach(button=>button.addEventListener('click',async()=>{
 if(busy)return;const choice=button.dataset.vote;select(choice);
 if(!ready){status.textContent=t.selected+' '+t[choice]+'. '+t.offline;return;}
 ensureToken();lock(true);status.textContent=t.busy;results.hidden=true;
 try{
  const data=await request('/vote',{token,choice});
  if(!['yes','no'].includes(data.choice))throw new Error('invalid vote');
  select(data.choice);status.textContent=t.recorded;emailStep.hidden=false;field.disabled=false;email.focus();
 }catch{status.textContent=t.error;}finally{lock(false);}
}));
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!ready||busy)return;
 if(!form.reportValidity()){status.textContent=t.invalid;return;}
 lock(true);status.textContent=t.busy;
 try{
  const data=await request('/results',{token,email:email.value.trim(),ack:document.querySelector('#privacy-read').checked});
  const s=data.statistics;
  if(!s||!['yes','no','total'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)||s.yes+s.no!==s.total)throw new Error('invalid statistics');
  const start=new Date(s.since),updated=new Date(s.updatedAt);
  if(!Number.isFinite(+start)||!Number.isFinite(+updated))throw new Error('invalid dates');
  const nf=new Intl.NumberFormat(lang),pf=new Intl.NumberFormat(lang,{style:'percent',maximumFractionDigits:1});
  document.querySelector('#result-total').textContent=nf.format(s.total);
  for(const choice of ['yes','no']){
   document.querySelector('#'+choice+'-count').textContent=nf.format(s[choice]);
   document.querySelector('#'+choice+'-percent').textContent=pf.format(s.total?s[choice]/s.total:0);
   document.querySelector('.'+choice+'-bar').style.width=(s.total?100*s[choice]/s.total:0)+'%';
  }
  document.querySelector('#results-period').textContent=t.since+' '+start.toLocaleDateString(lang)+' · '+t.updated+' '+updated.toLocaleString(lang);
  status.textContent=data.duplicate?t.duplicate:t.recorded;email.value='';results.hidden=false;results.focus();
 }catch{status.textContent=t.error;results.hidden=true;}finally{lock(false);}
});
(async()=>{
 if(!config.enabled||!config.apiBase||!config.privacyUrl)return;
 try{
  const api=new URL(config.apiBase,location.href),privacy=new URL(config.privacyUrl,location.href);
  const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
  if(!(api.protocol==='https:'||(local&&api.origin===location.origin)))return;
  if(!(privacy.protocol==='https:'||(local&&privacy.origin===location.origin)))return;
  base=api.href.replace(/\/$/,'');const health=await request('/health');
  if(health.enabled!==true||health.privacyUrl!==privacy.href)return;
  document.querySelector('#poll-privacy').href=privacy.href;ready=true;status.textContent='';
 }catch{status.textContent=t.offline;}
})();
})();
