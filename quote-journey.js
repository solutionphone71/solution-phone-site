(function(){
  'use strict';
  const root=document.querySelector('.quote-journey'),api=window.SolutionPhoneQuote;
  if(!root||!api)return;
  const model=document.getElementById('journey-model'),result=document.getElementById('journey-result'),summary=document.getElementById('journey-summary'),price=document.getElementById('journey-price'),qualities=document.getElementById('journey-qualities'),list=document.getElementById('journey-quality-list'),wa=document.getElementById('journey-whatsapp');
  const labels={screen:'Écran cassé',battery:'Batterie',charge:'Connecteur de charge',cleaning:'Nettoyage du smartphone',virus:'Virus suspecté ou publicités indésirables',camera:'Caméra ou son',water:'Téléphone mouillé',other:'Panne à identifier'};
  let issue='',rows=[],selected='',activeUniverse='iphone';
  const dockWhatsApp=document.querySelector('.home-contact-dock a[href*="wa.me"]'),dockDefault=dockWhatsApp?.href;
  const datalist=document.getElementById('journey-models');
  const brandBar=document.getElementById('journey-universes');
  const quickChips=document.getElementById('journey-quick-models');
  const reservePartBtn=document.getElementById('journey-reserve-part');

  function models(){
    datalist.replaceChildren();
    api.models().forEach(value=>{const option=document.createElement('option');option.value=value;datalist.appendChild(option)});
  }
  models();

  function renderQuickChips(){
    if(!quickChips||!api.brandPresets)return;
    const presets=api.brandPresets[activeUniverse]||api.brandPresets.iphone||[];
    quickChips.replaceChildren();
    presets.slice(0,6).forEach(val=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='journey-model-chip';
      btn.textContent=val.replace(/^Samsung Galaxy /,'Galaxy ').replace(/^Xiaomi /,'');
      btn.addEventListener('click',()=>{
        model.value=val;
        selected='';
        if(!issue){
          issue=/PS5|Switch|Trottinette|Disque/i.test(val)?'other':'screen';
          root.querySelectorAll('[data-journey-issue]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.journeyIssue===issue)));
        }
        render();
      });
      quickChips.appendChild(btn);
    });
  }

  if(brandBar){
    brandBar.querySelectorAll('[data-universe]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        activeUniverse=btn.dataset.universe;
        brandBar.querySelectorAll('[data-universe]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
        const placeholders={
          iphone:'Ex. iPhone 13, iPhone 15 Pro Max…',
          samsung:'Ex. Samsung Galaxy A14, A54, S23, S24…',
          android:'Ex. Xiaomi Redmi Note 13, Google Pixel 8…',
          ipad:'Ex. iPad 9e génération, Galaxy Tab A8…',
          pc:'Ex. PC portable Lenovo, MacBook Air…',
          console:'Ex. PS5 port HDMI, Nintendo Switch…',
          scooter:'Ex. Trottinette Xiaomi Pro 2, Ninebot…'
        };
        model.placeholder=placeholders[activeUniverse]||'Ex. iPhone 13, Samsung A54…';
        renderQuickChips();
      });
    });
    renderQuickChips();
  }

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
      const note=document.createElement('small');note.textContent='25 € déjà déduits sur réparation smartphone éligible · pièce et main-d’œuvre comprises.';price.appendChild(note);
      rows.forEach(row=>{const p=document.createElement('button'),name=document.createElement('span'),value=document.createElement('b'),description=document.createElement('small');p.type='button';p.className='journey-quality-choice';p.setAttribute('aria-pressed',String(selected===row.id));name.textContent=row.name;value.textContent=row.price+' €';description.textContent=row.desc;p.append(name,value,description);p.addEventListener('click',()=>{selected=row.id;render();list.querySelector('[aria-pressed="true"]')?.focus()});list.appendChild(p)});
    }else{
      const est=typeof api.estimateRange==='function'?api.estimateRange(device,issue):null;
      if(est){
        const amount=document.createElement('strong');amount.style.fontSize='24px';amount.textContent=est.headline;price.appendChild(amount);
        const note=document.createElement('small');note.textContent=est.note;price.appendChild(note);
      }else{
        price.textContent=api.catalogState==='loading'?'Chargement des tarifs…':api.catalogState==='error'?'Connexion aux tarifs indisponible':'Votre devis confirmé par l’équipe';
        const note=document.createElement('small');note.textContent='Nous vérifions la pièce exacte en stock au 21 rue Gambetta avant de vous répondre.';price.appendChild(note);
        if(api.catalogState==='error'){const retry=document.createElement('button');retry.type='button';retry.textContent='Réessayer';retry.addEventListener('click',()=>api.reloadCatalog());price.appendChild(retry)}
      }
    }
    document.getElementById('journey-safety').hidden=issue!=='water';
    const unknown=issue==='other'||/^(Modèle à identifier|Autre modèle)$/i.test(device);
    const handoff=root.querySelector('.journey-handoff');
    if(handoff)handoff.textContent=unknown?'Envoyez une photo de votre appareil ou décrivez la panne : l’équipe vous répond avec le prix.':'Modèle et panne pré-remplis. Vous pouvez aussi bloquer votre pièce 24h avant de passer au 21 rue Gambetta.';
    wa.href='https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Solution Phone, '+request().replace(/^Demande/,'demande').replace(/[.\s]+$/,'')+'.'+(unknown?' Je vous envoie une photo de mon appareil et je décris la panne : ':''));
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
  if(reservePartBtn){
    reservePartBtn.addEventListener('click',()=>{
      if(model.value.trim()&&issue){
        api.email('BLOQUER MA PIÈCE 24H AVANT PASSAGE · '+request()+' Merci de vérifier la disponibilité en stock et de mettre la pièce de côté.');
      }
    });
  }
  api.draft=()=>model.value.trim()&&issue?request():undefined;
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
  const all=document.createElement('details');all.className='journey-all-prices';const title=document.createElement('summary');title.textContent='Tous les tarifs iPhone & repères Android / PC';all.appendChild(title);root.appendChild(all);
  function tables(){
    all.querySelectorAll('div').forEach(el=>el.remove());
    for(const [key,label] of [['screen','Écrans iPhone'],['battery','Batteries iPhone']]){
      const wrap=document.createElement('div');const heading=document.createElement('h3');heading.textContent=label+' · 25 € déjà déduits';wrap.appendChild(heading);
      for(const row of api.catalogRows?.[key]||[]){const item=document.createElement('p');item.textContent='iPhone '+row.modele+' — '+api.prices('iPhone '+row.modele,key).map(p=>p.name+' : '+p.price+' €').join(' · ');wrap.appendChild(item)}
      all.appendChild(wrap);
    }
    const rep=document.createElement('div');
    rep.innerHTML='<h3>Repères Samsung, Android &amp; PC</h3><p>Samsung Galaxy A13 / A14 — Écran compatible : 45 €</p><p>Batterie Android (Samsung, Xiaomi, Pixel…) — Compatible dès 30 € · Originale dès 45 €</p><p>Connecteur USB-C — Nettoyage 10 € (suffit 9 fois sur 10) · Remplacement dès 25 €</p><p>PC portable &amp; Mac — Nettoyage virus 40–60 € · Batterie dès 70 € · Écran 100–170 € · SSD + Windows dès 120 €</p>';
    all.appendChild(rep);
  }
  api.ready.then(tables);window.addEventListener('quote-catalog-update',tables);
})();
