/* DIANAE contact form: real submission when the separate API is configured.
   Until then, works as a local copyable draft; no pretend submissions. */
(()=>{'use strict';
 const group=document.querySelector('#contact-form');
 const settings=document.querySelector('#contact-settings');
 if(!group||!settings)return;
 const {text:t}=JSON.parse(settings.textContent);
 const lang=document.documentElement.lang.slice(0,2);
 const i18n={
  de:{send:'Nachricht senden',sending:'Wird gesendet…',saved:'Nachricht gespeichert. Danke! Eine E-Mail-Benachrichtigung konnte nicht bestätigt werden.',success:'Nachricht gesendet und Benachrichtigung verschickt. Danke!',error:'Versand fehlgeschlagen. Bitte später erneut versuchen oder den Text kopieren.',consent:'Ich habe die Datenschutzhinweise gelesen.',offline:'Ohne aktivierten Onlinedienst wird nur eine Kopie des Textes erstellt.'},
  it:{send:'Invia messaggio',sending:'Invio in corso…',saved:'Messaggio salvato. Grazie! La notifica email non è stata confermata.',success:'Messaggio ricevuto e notifica email inviata. Grazie!',error:'Servizio non disponibile. Riprova o copia il messaggio.',consent:'Ho letto l’informativa sulla privacy.',offline:'Finché il servizio non è configurato, viene preparata soltanto una bozza da copiare.'},
  en:{send:'Send message',sending:'Sending…',saved:'Message saved. Thank you! Email notification could not be confirmed.',success:'Message saved and notification email sent. Thank you!',error:'Service unavailable. Please try later or copy the draft.',consent:'I have read the privacy notice.',offline:'Until the service is configured, this only creates a copyable draft.'},
  fr:{send:'Envoyer le message',sending:'Envoi en cours…',saved:'Message enregistré, merci ! La notification par e-mail n’a pas été confirmée.',success:'Message enregistré et notification envoyée, merci !',error:'Service indisponible. Réessayez plus tard ou copiez votre message.',consent:'J’ai lu la politique de confidentialité.',offline:'Tant que le service n’est pas configuré, seul un brouillon est préparé.'},
  es:{send:'Enviar mensaje',sending:'Enviando…',saved:'Mensaje guardado. ¡Gracias! No se ha confirmado el aviso por correo.',success:'Mensaje guardado y aviso por correo enviado. ¡Gracias!',error:'Servicio no disponible. Inténtalo más tarde o copia el borrador.',consent:'He leído el aviso de privacidad.',offline:'Hasta activar el servicio, solo se prepara un borrador para copiar.'},
 }[lang]||{};
 const config=window.DIANAE_BACKEND||{};
 const base=typeof config.apiBase==='string'?config.apiBase.trim().replace(/\/$/,''):'';
 const button=group.querySelector('button'),status=document.querySelector('#contact-status'),draft=document.querySelector('#contact-draft');
 const value=name=>group.querySelector(`[name="${name}"]`)?.value.trim()||'';
 const formFields=[...group.querySelectorAll('input:not([type=hidden]),textarea:not([readonly])')];
 const copyDraft=async()=>{
   const valueStr=[t.name+': '+value('name'),t.email+': '+value('email'),t.found+': '+value('how_found'),'',value('message'),'',group.querySelector('[name="occasional_updates"]').checked?t.optin:''].join('\n');
   draft.value=valueStr;draft.hidden=false;group.querySelector('label[for="contact-draft"]').hidden=false;
   try{await navigator.clipboard.writeText(valueStr);status.textContent=t.copied;}
   catch{status.textContent=t.fallback;draft.focus();draft.select();}
 };
 button.disabled=false;
 if(!base){button.addEventListener('click',async()=>{for(const input of formFields)if(!input.reportValidity())return;await copyDraft();});return;}
 button.textContent=i18n.send;
 const smallNote=group.querySelector('.contact-fields .small');
 if(smallNote)smallNote.textContent='';
 const langUrl={de:'/datenschutz/',it:'/it/privacy/',en:'/en/privacy/',fr:'/fr/confidentialite/',es:'/es/privacidad/'}[lang];
 const fields=group.querySelector('.contact-fields');
 const privacy=document.createElement('label');privacy.className='poll-check';
 privacy.innerHTML=`<input type="checkbox" id="contact-privacy" required><span>${i18n.consent} <a href="${langUrl}">↗</a></span>`;
 button.before(privacy);
 const trap=document.createElement('input');trap.name='website';trap.type='text';trap.tabIndex=-1;trap.autocomplete='off';trap.setAttribute('aria-hidden','true');
 trap.style.cssText='position:absolute;left:-9999px;opacity:0;pointer-events:none';
 button.before(trap);
 button.addEventListener('click',async()=>{
  for(const input of [...formFields,privacy.querySelector('input')])if(!input.reportValidity())return;
  button.disabled=true;button.textContent=i18n.sending;
  try{
   const response=await fetch(base+'/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    lang,name:value('name'),email:value('email'),howFound:value('how_found'),
    message:value('message'),occasionalUpdates:group.querySelector('[name="occasional_updates"]').checked,
    website:trap.value,privacyAck:true
   })});
   const answer=await response.json();
   if(!response.ok||!answer.ok||!answer.saved)throw new Error('not confirmed');
   status.textContent=answer.notificationSent?i18n.success:i18n.saved;
   for(const input of formFields)if(input.type==='checkbox')input.checked=false;else input.value='';
   privacy.querySelector('input').checked=false;
  }catch{status.textContent=i18n.error;}
  finally{button.disabled=false;button.textContent=i18n.send;}
 });
})();
