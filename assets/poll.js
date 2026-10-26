/* DIANAE live sustainability poll. Emails are hashed by the API, not saved.
   New online votes are distinct from the archived 136-person product tasting. */
(()=>{'use strict';
 const el=document.querySelector('#poll-settings');if(!el)return;
 const {text:t}=JSON.parse(el.textContent);
 const lang=document.documentElement.lang.slice(0,2);
 const config=window.DIANAE_BACKEND||{};
 const base=typeof config.apiBase==='string'?config.apiBase.trim().replace(/\/$/,''):'';
 const status=document.querySelector('#poll-status');
 const options=[...document.querySelectorAll('[data-vote]')];
 const emailStep=document.querySelector('#email-step');
 const form=document.querySelector('#poll-email');
 const field=form?.querySelector('fieldset');
 const results=document.querySelector('#poll-results');
 const privacy=document.querySelector('#poll-privacy');
 const radio=()=>options.find(b=>b.getAttribute('aria-pressed')==='true')?.dataset.vote;
 let ready=false,busy=false;
 const langUrls={de:'/datenschutz/',it:'/it/privacy/',en:'/en/privacy/',fr:'/fr/confidentialite/',es:'/es/privacidad/'};
 if(privacy){privacy.href=langUrls[lang]||langUrls.en;}
 if(!base){status.textContent=t.offline;return;}
 const request=async(path,body)=>{
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await response.json();
  if(!response.ok||data.ok!==true)throw new Error(data.error||'server');
  return data;
 };
 const lock=v=>{busy=v;options.forEach(b=>b.disabled=v);field.disabled=v;};
 (async()=>{
   try{
    const health=await request('/health');
    ready=Boolean(health.enabled);
    if(ready)status.textContent=t.intro;
   }catch{status.textContent=t.offline;}
 })();
 options.forEach(button=>button.addEventListener('click',()=>{
  if(busy||!ready){status.textContent=t.offline;return;}
  const selected=button.dataset.vote;
  options.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vote===selected)));
  emailStep.hidden=false;field.disabled=false;
  status.textContent=t.selected+' '+t[selected]+'. '+t.intro;
 }));
 form?.addEventListener('submit',async(event)=>{
  event.preventDefault();if(!ready||busy)return;
  const choice=radio();
  if(!choice||!form.reportValidity()){status.textContent=t.invalid;return;}
  lock(true);status.textContent=t.busy;results.hidden=true;
  try{
   const data=await request('/vote',{lang,choice,email:document.querySelector('#poll-email-address').value.trim(),privacyAck:document.querySelector('#privacy-read').checked});
   const s=data.statistics;if(!s||!['yes','no','total'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)||s.yes+s.no!==s.total)throw new Error('bad stats');
   const nf=new Intl.NumberFormat(lang),pf=new Intl.NumberFormat(lang,{style:'percent',maximumFractionDigits:1});
   document.querySelector('#result-total')?.replaceChildren(document.createTextNode(nf.format(s.total)));
   for(const k of ['yes','no']){
    document.querySelector('#'+k+'-count').textContent=nf.format(s[k]);
    document.querySelector('#'+k+'-percent').textContent=pf.format(s.total?s[k]/s.total:0);
    document.querySelector('.'+k+'-bar').style.width=(s.total?100*s[k]/s.total:0)+'%';
   }
   status.textContent=data.duplicate?t.duplicate:t.recorded;
   results.hidden=false;results.focus();form.reset();
  }catch{status.textContent=t.error;results.hidden=true;}
  finally{lock(false);}
 });
})();
