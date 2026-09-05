(function(){
  'use strict';
  if(document.querySelector('.sp-contact-dock'))return;
  var endpoint='https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/quote-request';
  var publicKey='sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb';
  var pageTitle=(document.querySelector('h1')||document).textContent.trim()||document.title;
  var page=location.pathname||'/';
  function track(name,params){try{if(typeof window.gtag==='function')window.gtag('event',name,Object.assign({transport_type:'beacon',page_location:location.href},params||{}));}catch(error){}}
  document.querySelectorAll('#crispFloatBtn,#waFloatBtn,.wa-float,a.wa[style*="position:fixed"],.sp-global-float').forEach(function(el){el.remove()});
  var dock=document.createElement('div');dock.className='sp-contact-dock';dock.setAttribute('aria-label','Demander un devis');
  dock.innerHTML='<a class="sp-contact-wa" href="https://wa.me/33783921884?text='+encodeURIComponent('Bonjour, ma demande est urgente. Je souhaite un devis depuis la page « '+pageTitle+' ». Mon appareil et mon problème : ')+'" target="_blank" rel="noopener" aria-label="Demander un devis urgent par WhatsApp">WhatsApp urgent</a><button class="sp-contact-email" type="button" aria-label="Demander un devis par e-mail">E-mail</button>';
  document.body.appendChild(dock);
  var modal=document.createElement('div');modal.className='sp-contact-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','spContactTitle');
  modal.innerHTML='<div class="sp-contact-dialog"><button class="sp-contact-close" type="button" aria-label="Fermer">×</button><span class="sp-contact-kicker">URGENCE TÉLÉPHONE</span><h2 id="spContactTitle">Un devis express, sans perdre de temps</h2><p>Indiquez simplement votre appareil et la panne. L’équipe vous répond rapidement selon le diagnostic et la disponibilité des pièces.</p><form class="sp-contact-form"><label>1. Votre nom<input name="nom" autocomplete="name" required maxlength="80"></label><label>2. Votre e-mail<input name="email" type="email" autocomplete="email" required maxlength="160"></label><label>3. Appareil et problème<textarea name="demande" required minlength="10" maxlength="1800" placeholder="Ex. iPhone 13, écran cassé, téléphone indispensable aujourd’hui"></textarea></label><details><summary>Ajouter un numéro de téléphone</summary><label>Téléphone (facultatif)<input name="telephone" type="tel" autocomplete="tel" maxlength="40"></label></details><label class="sp-contact-hp" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label><button class="sp-contact-submit" type="submit">Envoyer ma demande urgente</button><p class="sp-contact-status" role="status" aria-live="polite"></p></form></div>';
  document.body.appendChild(modal);
  var openButton=dock.querySelector('button'),closeButton=modal.querySelector('.sp-contact-close'),form=modal.querySelector('form'),status=modal.querySelector('.sp-contact-status'),submit=form.querySelector('button[type="submit"]');
  function open(){modal.classList.add('open');document.body.style.overflow='hidden';setTimeout(function(){form.nom.focus()},30)}
  function close(){modal.classList.remove('open');document.body.style.overflow=''}
  openButton.addEventListener('click',open);closeButton.addEventListener('click',close);modal.addEventListener('click',function(e){if(e.target===modal)close()});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
  dock.querySelector('a').addEventListener('click',function(){if(!document.querySelector('script[src*="landing-tracking"]'))track('contact_whatsapp',{method:'whatsapp',page:page,source:'contact_dock'});});
  form.addEventListener('submit',function(e){
    e.preventDefault();if(submit.disabled||form.website.value)return;
    submit.disabled=true;submit.textContent='Envoi en cours…';status.className='sp-contact-status';status.textContent='';
    var token=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
    fetch(endpoint,{method:'POST',headers:{apikey:publicKey,Authorization:'Bearer '+publicKey,'Content-Type':'application/json'},body:JSON.stringify({name:form.nom.value.trim(),email:form.email.value.trim(),phone:form.telephone.value.trim(),request:form.demande.value.trim(),form_type:'main_quote',page:page,client_token:token,website:''})})
      .then(function(response){return response.json().catch(function(){return{}}).then(function(payload){if(!response.ok||!payload.received)throw new Error(payload.error||'Envoi impossible');return payload})})
      .then(function(payload){status.className='sp-contact-status ok';status.textContent='Votre demande est bien enregistrée'+(payload.reference?' — référence '+payload.reference:'')+'.';try{form.reset()}catch(error){}track('devis_email_envoye',{method:'email',page:page,source:'contact_dock'});},function(){status.className='sp-contact-status err';status.textContent='La demande n’a pas pu être envoyée. Utilisez WhatsApp ou appelez le 03 85 33 06 89.';})
      .finally(function(){submit.disabled=false;submit.textContent='Envoyer ma demande urgente'});
  });
})();
