/* Local draft only: no network requests and no automatic email launch. */
(()=>{'use strict';
 const group=document.querySelector('#contact-form'),settings=document.querySelector('#contact-settings');
 if(!group||!settings)return;
 const t=JSON.parse(settings.textContent).text,button=group.querySelector('button'),status=document.querySelector('#contact-status'),draft=document.querySelector('#contact-draft');
 button.disabled=false;
 button.addEventListener('click',async()=>{
  for(const field of group.querySelectorAll('input,textarea:not([readonly])')){if(!field.reportValidity())return;}
  const value=name=>group.querySelector(`[name="${name}"]`).value.trim();
  const text=[t.name+': '+value('name'),t.email+': '+value('email'),t.found+': '+value('how_found'),'',value('message'),'',group.querySelector('[name="occasional_updates"]').checked?t.optin:''].join('\n');
  draft.value=text;draft.hidden=false;group.querySelector('label[for="contact-draft"]').hidden=false;
  try{await navigator.clipboard.writeText(text);status.textContent=t.copied;}
  catch{status.textContent=t.fallback;draft.focus();draft.select();}
 });
})();
