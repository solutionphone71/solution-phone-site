(function(){
  'use strict';
  const root=document.querySelector('.quote-journey'),api=window.SolutionPhoneQuote;
  if(!root||!api)return;
  const model=document.getElementById('journey-model'),result=document.getElementById('journey-result'),summary=document.getElementById('journey-summary'),price=document.getElementById('journey-price'),qualities=document.getElementById('journey-qualities'),list=document.getElementById('journey-quality-list'),wa=document.getElementById('journey-whatsapp');
  const labels={screen:'Écran cassé',battery:'Batterie',charge:'Connecteur de charge',cleaning:'Nettoyage du smartphone',virus:'Virus suspecté ou publicités indésirables',camera:'Caméra ou son',water:'Téléphone mouillé',other:'Panne à identifier'};
  let issue='',rows=[],selected='';
  const dockWhatsApp=document.querySelector('.home-contact-dock a[href*="wa.me"]'),dockDefault=dockWhatsApp?.href;
  const datalist=document.getElementById('journey-models');
  function models(){datalist.replaceChildren();[...api.models(),'Samsung Galaxy A54','Google Pixel','Xiaomi','Autre modèle'].forEach(value=>{const option=document.createElement('option');option.value=value;datalist.appendChild(option)})}models();
  function request(){
    const chosen=rows.find(row=>row.id===selected);
    const prices=chosen?' Qualité choisie : '+chosen.name+' · Prix affiché TTC : '+chosen.price+' €, 25 € déjà déduits. Pièce et main-d’œuvre comprises.':rows.length?' Qualité à choisir avec l’équipe.':'';
    return 'Demande de devis · '+model.value.trim()+' · '+labels[issue]+'.'+prices;
  }
  function render(){
    const device=model.value.trim();
    result.hidden=!device||!issue;
    if(result.hidden){rows=[];if(dockWhatsApp)dockWhatsApp.href=dockDefault;return}
    rows=api.prices(device,issue);
    summary.textContent=device+' · '+labels[issue];
    price.replaceChildren();list.replaceChildren();qualities.hidden=!rows.length;
    if(rows.length){
      const amount=document.createElement('strong');amount.textContent='À partir de '+Math.min(...rows.map(row=>row.price))+' €';price.appendChild(amount);
      const chosen=rows.find(row=>row.id===selected);if(chosen)amount.textContent=chosen.price+' € TTC · '+chosen.name;
      const note=document.createElement('small');note.textContent='25 € déjà déduits · pièce et main-d’œuvre comprises. Disponibilité et délai confirmés par l’équipe.';price.appendChild(note);
      rows.forEach(row=>{const p=document.createElement('button'),name=document.createElement('span'),value=document.createElement('b'),description=document.createElement('small');p.type='button';p.className='journey-quality-choice';p.setAttribute('aria-pressed',String(selected===row.id));name.textContent=row.name;value.textContent=row.price+' €';description.textContent=row.desc;p.append(name,value,description);p.addEventListener('click',()=>{selected=row.id;render();list.querySelector('[aria-pressed="true"]')?.focus()});list.appendChild(p)});
    }else{price.textContent=api.catalogState==='loading'?'Chargement des tarifs…':api.catalogState==='error'?'Connexion aux tarifs indisponible':'Votre devis confirmé par l’équipe';const note=document.createElement('small');note.textContent='Aucun prix estimé : nous vérifions le modèle et la panne avant de vous répondre.';price.appendChild(note);if(api.catalogState==='error'){const retry=document.createElement('button');retry.type='button';retry.textContent='Réessayer';retry.addEventListener('click',()=>api.reloadCatalog());price.appendChild(retry)}}
    document.getElementById('journey-safety').hidden=issue!=='water';
    // Modèle ou panne inconnus : on demande une photo plutôt que d’affirmer que tout est renseigné.
    const unknown=issue==='other'||/^(Modèle à identifier|Autre modèle)$/i.test(device);
    const handoff=root.querySelector('.journey-handoff');
    if(handoff)handoff.textContent=unknown?'Envoyez une photo de votre téléphone et décrivez la panne : l’équipe vous répond avec le prix.':'Modèle et panne déjà renseignés. Sur WhatsApp, il vous reste à envoyer le message. Réparation généralement en moins d’une heure si la pièce est en stock.';
    wa.href='https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Solution Phone, '+request().replace(/^Demande/,'demande').replace(/[.\s]+$/,'')+'.'+(unknown?' Je vous envoie une photo de mon téléphone et je décris la panne : ':''));
    if(dockWhatsApp)dockWhatsApp.href=wa.href;
  }
  model.addEventListener('input',()=>{selected='';render()});
  root.querySelectorAll('[data-journey-issue]').forEach(button=>button.addEventListener('click',()=>{
    issue=button.dataset.journeyIssue;selected='';
    root.querySelectorAll('[data-journey-issue]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    render();if(!model.value.trim())model.focus();
  }));
  document.getElementById('journey-unknown').addEventListener('click',()=>{model.value='Modèle à identifier';render()});
  document.getElementById('journey-email').addEventListener('click',()=>{if(model.value.trim()&&issue)api.email(request())});
  api.draft=()=>model.value.trim()&&issue?request():undefined;
  // Keep the persistent contact dock away from the same buttons inside the card.
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>document.body.classList.toggle('journey-in-view',entries[0].isIntersecting),{threshold:0}).observe(root);
  api.ready.then(render);
  const params=new URLSearchParams(location.search);
  api.ready.then(()=>{
    if(params.has('model'))model.value=params.get('model').slice(0,100);
    if(Object.hasOwn(labels,params.get('issue')))issue=params.get('issue');
    if(params.has('model')||issue){root.querySelectorAll('[data-journey-issue]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journeyIssue===issue)));render()}
    if(params.get('email')==='1')api.email(model.value.trim()&&issue?request():model.value.trim()?'Demande de devis · '+model.value.trim()+' · Panne à préciser.':'');
  });
  if(!document.documentElement.classList.contains('evan-embed'))window.openQuickPrice=()=>{root.scrollIntoView({behavior:'smooth',block:'start'});model.focus()};
  api.choose=(device,problem)=>{model.value=device||model.value;issue=Object.hasOwn(labels,problem)?problem:'other';selected='';root.querySelectorAll('[data-journey-issue]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journeyIssue===issue)));render();root.scrollIntoView({behavior:'smooth',block:'start'})};
  if(document.documentElement.classList.contains('tariff-embed')){
    const modal=document.getElementById('mail-modal');root.appendChild(modal);
    const email=api.email;api.email=request=>{email(request);modal.scrollIntoView({behavior:'smooth',block:'start'})};
    const resize=()=>parent.postMessage({type:'solution-phone-quote-height',height:Math.ceil(root.getBoundingClientRect().height)+32},location.origin);
    new ResizeObserver(resize).observe(root);
  }
  window.addEventListener('quote-catalog-update',()=>{selected='';models();render()});
  const all=document.createElement('details');all.className='journey-all-prices';const title=document.createElement('summary');title.textContent='Tous les tarifs iPhone : écrans et batteries';all.appendChild(title);root.appendChild(all);
  function tables(){all.querySelectorAll('div').forEach(el=>el.remove());for(const [key,label] of [['screen','Écrans'],['battery','Batteries']]){const wrap=document.createElement('div');const heading=document.createElement('h3');heading.textContent=label+' · 25 € déjà déduits';wrap.appendChild(heading);for(const row of api.catalogRows?.[key]||[]){const item=document.createElement('p');item.textContent='iPhone '+row.modele+' — '+api.prices('iPhone '+row.modele,key).map(p=>p.name+' : '+p.price+' €').join(' · ');wrap.appendChild(item)}all.appendChild(wrap)}}api.ready.then(tables);window.addEventListener('quote-catalog-update',tables);
})();
