(function(){
  if(document.querySelector('.evan-widget')||/concept-evan\.html$/.test(location.pathname))return;
  var page=location.pathname.split('/').pop()||'';
  var contexts={
    'reconditionnes.html':{label:'Reconditionnés',title:'Quel téléphone recherchez-vous ?',items:['Je cherche un iPhone reconditionné à moins de 500 €','Quels smartphones reconditionnés sont disponibles ?','Je veux faire reprendre mon téléphone']},
    'accessoires.html':{label:'Accessoires',title:'Quel accessoire vous faut-il ?',items:['Je cherche une coque pour mon téléphone','Je cherche un chargeur compatible','Je veux une protection d’écran']},
    'hydrogel.html':{label:'Protection écran',title:'Quelle protection choisir ?',items:['Hydrogel ou verre trempé pour mon téléphone ?','Je veux protéger un écran incurvé','Quel est le prix d’une protection hydrogel posée ?']},
    'reparation-samsung.html':{label:'Réparation Samsung',title:'Quel est le problème du Samsung ?',items:['Batterie Samsung à remplacer','Écran Samsung cassé','Le téléphone charge mal']},
    'atelier.html':{label:'Atelier de Mâcon',title:'Une question sur l’atelier ?',items:['Quels sont vos horaires ?','Puis-je venir sans rendez-vous ?','Comment fonctionne QualiRépar ?']},
    'faq.html':{label:'Questions fréquentes',title:'Je vous réponds directement.',items:['Le tarif d’une réparation','Comment fonctionne la garantie ?','Quels sont vos horaires ?']},
    'actualites.html':{label:'Conseils',title:'Un doute sur votre appareil ?',items:['Mon téléphone chauffe','Ma batterie se vide vite','Mon téléphone ne charge plus']},
    'cgv.html':{label:'Informations',title:'Besoin d’une réponse claire ?',items:['Comment fonctionne la garantie ?','Comment demander un devis ?','Parler directement à l’équipe']},
    'politique-confidentialite.html':{label:'Confidentialité',title:'Une question sur vos données ?',items:['Que conserve l’assistant ?','Comment supprimer mes données ?','Parler directement à l’équipe']},
    'roulette.html':{label:'Jeu Solution Phone',title:'Sébastien peut aussi vous conseiller.',items:['Voir les conditions du jeu','Trouver une protection d’écran','Demander un tarif de réparation']},
    '404.html':{label:'Page introuvable',title:'Je vous remets sur la bonne voie.',items:['Demander un tarif','Voir les réparations','Trouver la boutique']}
  };
  var ctx=contexts[page]||{label:'Solution Phone',title:'Que puis-je faire pour vous ?',items:['Obtenir un tarif de réparation','Diagnostiquer mon appareil','Parler directement à l’équipe']};
  var oldCrispButton=document.getElementById('crispFloatBtn');if(oldCrispButton)oldCrispButton.remove();
  if(window.$crisp&&Array.isArray(window.$crisp))window.$crisp.push(['do','chat:hide']);
  var css=document.createElement('link');css.rel='stylesheet';css.href='evan-widget.css?v=7';document.head.appendChild(css);
  var directMailSubject='Demande depuis '+ctx.label+' — Solution Phone';
  var directMailBody='Bonjour,\n\nJe viens de la page « '+ctx.label+' » du site Solution Phone.\n\nMa demande : \n\nMon appareil et son modèle : \n\nVous pouvez me répondre à cette adresse e-mail.\n\nMerci.';
  var brainUrl='https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/evan-brain';
  var publicKey='sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb';
  var metricToken='';
  try{metricToken=sessionStorage.getItem('evan_conversation_token')||''}catch(e){}
  var metricQueue=Promise.resolve(),metricOpened=false;
  var metricPage=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'/audit-local/'+location.pathname.replace(/^\/+/, ''):location.pathname;
  function trackMetric(event,metadata){
    metricQueue=metricQueue.then(function(){
      return fetch(brainUrl,{method:'POST',keepalive:true,headers:{apikey:publicKey,Authorization:'Bearer '+publicKey,'Content-Type':'application/json'},body:JSON.stringify({event:event,conversation_token:metricToken||undefined,event_metadata:metadata||{},context:{page:metricPage,consent_to_store:false}})})
        .then(function(response){return response.ok?response.json():null})
        .then(function(data){if(data&&data.conversation_token){metricToken=data.conversation_token;try{sessionStorage.setItem('evan_conversation_token',metricToken)}catch(e){}}})
        .catch(function(){});
    });
    return metricQueue;
  }
  function ensureMetricOpened(){
    if(!metricOpened){metricOpened=true;trackMetric('assistant_opened',{source:'page_widget',page:page||'home'});}
    return metricQueue;
  }
  var root=document.createElement('aside');root.className='evan-widget';root.setAttribute('aria-label','Assistant de Sébastien');
  root.innerHTML='<div class="evan-widget-panel"><div class="evan-widget-head"><span class="evan-widget-avatar" aria-hidden="true"></span><div><b>Sébastien · Solution Phone</b><span>Diagnostic &amp; devis · équipe à Mâcon</span></div><button class="evan-widget-back" type="button" aria-label="Poser une autre question">←</button><button class="evan-widget-close" type="button" aria-label="Fermer">×</button></div><div class="evan-widget-body"><small class="evan-widget-context">Vous consultez · '+ctx.label+'</small><p>'+ctx.title+'</p><div class="evan-widget-suggestions">'+ctx.items.map(function(item){return '<button type="button" data-question="'+item.replace(/"/g,'&quot;')+'">'+item+'<span>→</span></button>'}).join('')+'</div><form class="evan-widget-form"><input aria-label="Votre question" placeholder="Écrivez votre demande…"><button aria-label="Envoyer">→</button></form><div class="evan-widget-direct"><a href="https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Sébastien, je viens de la page '+ctx.label+'. Ma demande : ')+'" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:contact@solution-phone.fr?subject='+encodeURIComponent(directMailSubject)+'&body='+encodeURIComponent(directMailBody)+'">E-mail</a><span>Contexte prérempli</span></div></div><div class="evan-widget-conversation" aria-live="polite"></div></div><button class="evan-widget-launch" type="button" aria-expanded="false"><span class="evan-widget-avatar" aria-hidden="true"></span><i></i><span><b>Demandez à Sébastien</b><small>Tarif · diagnostic · devis</small></span></button>';
  document.body.appendChild(root);
  var launch=root.querySelector('.evan-widget-launch'),close=root.querySelector('.evan-widget-close'),back=root.querySelector('.evan-widget-back'),input=root.querySelector('input'),conversation=root.querySelector('.evan-widget-conversation');
  launch.setAttribute('aria-label','Demandez à Sébastien');
  function toggle(force){var open=typeof force==='boolean'?force:!root.classList.contains('open');root.classList.toggle('open',open);launch.setAttribute('aria-expanded',String(open));if(open)setTimeout(function(){input.focus()},80)}
  function ask(question){
    if(!question)return;
    root.classList.add('conversation-open');
    conversation.innerHTML='';
    toggle(true);
    ensureMetricOpened().finally(function(){
      var frame=document.createElement('iframe');
      frame.title='Assistant de Sébastien';
      frame.src='./?embed=1&q='+encodeURIComponent(question)+'&from='+encodeURIComponent(page);
      conversation.appendChild(frame);
    });
  }
  function showStart(){root.classList.remove('conversation-open');conversation.innerHTML='';setTimeout(function(){input.focus()},80)}
  launch.addEventListener('click',function(){var opening=!root.classList.contains('open');toggle();if(opening)ensureMetricOpened()});close.addEventListener('click',function(){toggle(false)});back.addEventListener('click',showStart);
  root.querySelectorAll('[data-question]').forEach(function(button){button.addEventListener('click',function(){ask(button.dataset.question)})});
  document.querySelectorAll('[data-evan-question]').forEach(function(button){button.addEventListener('click',function(){ask(button.dataset.evanQuestion)})});
  root.querySelector('form').addEventListener('submit',function(event){event.preventDefault();ask(input.value.trim())});
  root.querySelector('a[href*="wa.me"]').addEventListener('click',function(){ensureMetricOpened().then(function(){trackMetric('whatsapp_clicked',{source:'page_widget_direct',page:page||'home'})})});
  document.addEventListener('keydown',function(event){if(event.key==='Escape')toggle(false)});
})();
