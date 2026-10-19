/* No request is sent unless a real HTTPS endpoint is configured. */
(()=>{'use strict';
const node=document.querySelector('#contact-settings'),form=document.querySelector('#contact-form');if(!node||!form)return;
const {config,text:t,email}=JSON.parse(node.textContent),button=form.querySelector('button[type=submit]'),status=document.querySelector('#contact-status');button.disabled=false;
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const data=Object.fromEntries(new FormData(form));if(data._gotcha)return;
 data.occasional_updates=Boolean(form.elements.occasional_updates.checked);
 if(!config.enabled){
  const body=[t.name+': '+(data.name||''),t.email+': '+(data.email||''),t.found+': '+(data.how_found||''),'',data.message,'',data.occasional_updates?t.optin:''].join('\r\n');
  window.location.href='mailto:'+email+'?subject='+encodeURIComponent('DIANAE — '+(data.name||t.contactTitle))+'&body='+encodeURIComponent(body);
  status.textContent=t.prepared;return;
 }
 button.disabled=true;status.textContent=t.busy;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const url=new URL(config.endpoint);if(url.protocol!=='https:')throw new Error('HTTPS required');
  const response=await fetch(url.href,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:controller.signal,credentials:'omit'});
  const reply=await response.json();if(!response.ok||reply.ok!==true)throw new Error('Not confirmed');
  status.textContent=t.contactSuccess;form.reset();
 }catch{status.textContent=t.contactError;}finally{clearTimeout(timer);button.disabled=false;}
});
})();
