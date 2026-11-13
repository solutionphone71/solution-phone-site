(function(){
  'use strict';
  if(document.querySelector('.sp-contact-dock'))return;
  // Repair pages share the homepage quote. Shop/product requests stay unchanged.
  if(/\/(?:reparation-[^/]+|ecran-iphone-casse-macon|remplacement-batterie-telephone-macon|atelier)\.html$/.test(location.pathname)){
    const page=location.pathname,params=new URLSearchParams();
    if(page.includes('samsung'))params.set('model','Samsung');
    if(page.includes('batterie'))params.set('issue','battery');
    if(page.includes('ecran-iphone'))params.set('issue','screen');
    const url=new URL('./',location.href);url.search=params.toString();url.hash='devis';
    const dock=document.createElement('nav');dock.className='sp-contact-dock';dock.setAttribute('aria-label','Devis réparation');
    const quote=document.createElement('a');quote.href=url.href;quote.textContent='Obtenir mon prix';
    const mail=document.createElement('a');url.searchParams.set('email','1');mail.href=url.href;mail.textContent='Devis e-mail';const call=document.createElement('a');call.className='sp-contact-call';call.href='tel:+33385330689';call.textContent='03 85 33 06 89';call.setAttribute('aria-label','Appeler Solution Phone au 03 85 33 06 89');dock.append(quote,call,mail);document.body.appendChild(dock);
    return;
  }
  var endpoint='https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/quote-request';
  var PUBLIC_QUOTE_SOURCE='v1'; // Bascule explicite, indépendante des devis de l'accueil.
  var v2Endpoint='https://vps-8066c206.vps.ovh.net/api/public/quote-request';
  var publicKey='sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb';
  var pageTitle=(document.querySelector('h1')||document).textContent.trim()||document.title;
  var page=location.pathname||'/';
  function track(name,params){try{if(typeof window.gtag==='function')window.gtag('event',name,Object.assign({transport_type:'beacon',page_location:location.href},params||{}));}catch(error){}}
  document.querySelectorAll('#crispFloatBtn,#waFloatBtn,.wa-float,a.wa[style*="position:fixed"],.sp-global-float').forEach(function(el){el.remove()});
  // Numéro du bouton d'appel : 03 85 33 06 89 par défaut ; une page peut en indiquer un autre
  // avec <html data-dock-tel="+33…" data-dock-tel-label="0… …" data-dock-tel-name="…"> (ex. Solution Informatique).
  var root=document.documentElement,telHref='tel:+33385330689',telLabel='03 85 33 06 89',telName='Solution Phone';
  if(/^\+\d{8,15}$/.test(root.getAttribute('data-dock-tel')||'')&&root.getAttribute('data-dock-tel-label')){telHref='tel:'+root.getAttribute('data-dock-tel');telLabel=root.getAttribute('data-dock-tel-label');telName=root.getAttribute('data-dock-tel-name')||telName;}
  var dock=document.createElement('div');dock.className='sp-contact-dock';dock.setAttribute('aria-label','Demander un devis');
  dock.innerHTML='<a class="sp-contact-wa" href="https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Solution Phone, je souhaite un devis (page « '+pageTitle+' »). Mon appareil et la panne : ')+'" target="_blank" rel="noopener" aria-label="Demander un devis par WhatsApp">Devis WhatsApp</a><a class="sp-contact-call" href="'+telHref+'" aria-label="Appeler '+telName+' au '+telLabel+'">'+telLabel+'</a><button class="sp-contact-email" type="button" aria-label="Demander un devis par e-mail">E-mail</button>';
  document.body.appendChild(dock);
  var modal=document.createElement('div');modal.className='sp-contact-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','spContactTitle');
  modal.innerHTML='<div class="sp-contact-dialog"><button class="sp-contact-close" type="button" aria-label="Fermer">×</button><span class="sp-contact-kicker">Devis par e-mail</span><h2 id="spContactTitle">Votre devis par e-mail</h2><p>Indiquez simplement votre appareil et la panne. L’équipe vous répond rapidement selon le diagnostic et la disponibilité des pièces.</p><form class="sp-contact-form"><label>1. Votre nom<input name="nom" autocomplete="name" required maxlength="80"></label><label>2. Votre e-mail<input name="email" type="email" autocomplete="email" required maxlength="160"></label><label>3. Appareil et problème<textarea name="demande" required minlength="10" maxlength="1800" placeholder="Ex. iPhone 13, écran cassé"></textarea></label><details><summary>Ajouter un numéro de téléphone</summary><label>Téléphone (facultatif)<input name="telephone" type="tel" autocomplete="tel" maxlength="40"></label></details><label class="sp-contact-hp" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label><button class="sp-contact-submit" type="submit">Envoyer ma demande</button><p class="sp-contact-rgpd">Vos données servent uniquement à répondre à votre demande de devis et sont supprimées au bout de 3 ans sans nouveau contact. Accès, rectification, effacement : contact@solution-phone.fr — <a href="https://solution-phone.fr/politique-confidentialite.html">Politique de confidentialité</a></p><p class="sp-contact-status" role="status" aria-live="polite"></p></form></div>';
  document.body.appendChild(modal);
  var openButton=dock.querySelector('button'),closeButton=modal.querySelector('.sp-contact-close'),form=modal.querySelector('form'),status=modal.querySelector('.sp-contact-status'),submit=form.querySelector('button[type="submit"]');
  function open(){modal.classList.add('open');document.body.style.overflow='hidden';setTimeout(function(){form.nom.focus()},30)}
  function close(){modal.classList.remove('open');document.body.style.overflow=''}
  openButton.addEventListener('click',open);closeButton.addEventListener('click',close);modal.addEventListener('click',function(e){if(e.target===modal)close()});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
  dock.querySelector('.sp-contact-wa').addEventListener('click',function(){if(!document.querySelector('script[src*="landing-tracking"]'))track('contact_whatsapp',{method:'whatsapp',page:page,source:'contact_dock'});});
  var callLink=dock.querySelector('.sp-contact-call');if(callLink)callLink.addEventListener('click',function(){track('contact_phone',{method:'phone',page:page,source:'contact_dock'});});
  var quoteHelperLoading;
  function loadQuoteAttemptHelper(){
    if(window.SolutionPhoneQuoteAttempts)return Promise.resolve(window.SolutionPhoneQuoteAttempts);
    if(!quoteHelperLoading)quoteHelperLoading=new Promise(function(resolve,reject){
      var script=document.createElement('script');script.src='/quote-attempt.fcade1faf080.js';script.async=true;
      script.onload=function(){if(window.SolutionPhoneQuoteAttempts)resolve(window.SolutionPhoneQuoteAttempts);else reject(new Error('quote_helper_unavailable'))};
      script.onerror=function(){reject(new Error('quote_helper_unavailable'))};
      document.head.appendChild(script);
    });
    return quoteHelperLoading;
  }
  function quotePayload(){return {name:form.nom.value.trim(),email:form.email.value.trim(),phone:form.telephone.value.trim(),request:form.demande.value.trim(),form_type:'main_quote',page:page,website:''}}
  function quoteErrorMessage(error){
    if(error&&['quote_payload_changed','quote_attempt_needs_review'].includes(error.code))return 'Cette demande a peut-être déjà été envoyée. Vérifiez avec l’équipe avant de modifier ou renvoyer le devis.';
    if(error&&error.code==='quote_receipt_unconfirmed')return 'Réception non confirmée. Ne créez pas une nouvelle demande avant de vérifier avec l’équipe ; vous pouvez réessayer la même demande.';
    if(error&&(error.code==='quote_storage_unavailable'||error.code==='invalid_quote_form'||error.code==='invalid_quote_payload'||error.message==='quote_helper_unavailable'))return 'Envoi sécurisé indisponible sur ce navigateur. Utilisez WhatsApp ou appelez la boutique.';
    if(error&&error.status===429)return 'Votre demande est peut-être déjà arrivée. Réessayez dans 15 minutes ou contactez la boutique.';
    if(error&&error.status>=400&&error.status<500)return 'Une information est invalide. Vérifiez avec la boutique avant de renvoyer cette demande.';
    return 'Réception non confirmée. Réessayez cette même demande ou appelez le 03 85 33 06 89 avant d’en créer une autre.';
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();if(submit.disabled||form.website.value)return;
    submit.disabled=true;submit.textContent='Envoi en cours…';status.className='sp-contact-status';status.textContent='';
    var data=quotePayload();
    loadQuoteAttemptHelper().then(function(helper){
      return helper.open().submit({
        slot:'dock'+page.toLowerCase().replace(/[^a-z0-9_/-]/g,'_')+'-main_quote',
        defaultReceiver:PUBLIC_QUOTE_SOURCE,
        payload:data,
        send:async function({receiver,clientToken,payload:request}){
          if(receiver!=='v1'&&receiver!=='v2')throw new Error('quote_receiver_invalid');
          var response=await fetch(receiver==='v2'?v2Endpoint:endpoint,{method:'POST',headers:receiver==='v2'?{'Content-Type':'application/json'}:{apikey:publicKey,Authorization:'Bearer '+publicKey,'Content-Type':'application/json'},body:JSON.stringify(Object.assign({},request,{client_token:clientToken}))});
          var receipt=await response.json().catch(function(){return null});
          if(!response.ok||!receipt||receipt.received!==true){var error=new Error(receipt&&receipt.error||'quote_failed');error.status=response.status;throw error}
          return receipt;
        }
      });
    })
      .then(function(receipt){status.className='sp-contact-status ok';status.textContent='Votre demande est bien enregistrée — référence '+receipt.reference+'.';try{form.reset()}catch(error){}track('devis_email_envoye',{method:'email',page:page,source:'contact_dock'});},function(error){status.className='sp-contact-status err';status.textContent=quoteErrorMessage(error);})
      .finally(function(){submit.disabled=false;submit.textContent='Envoyer ma demande'});
  });
})();
