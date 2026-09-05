(function(){
  'use strict';
  const root=document.querySelector('.quote-journey'),api=window.SolutionPhoneQuote;
  if(!root||!api)return;
  const model=document.getElementById('journey-model'),result=document.getElementById('journey-result'),summary=document.getElementById('journey-summary'),price=document.getElementById('journey-price'),qualities=document.getElementById('journey-qualities'),list=document.getElementById('journey-quality-list'),wa=document.getElementById('journey-whatsapp');
  const labels={screen:'Écran cassé',battery:'Batterie',charge:'Ne charge plus',camera:'Caméra ou son',water:'Téléphone mouillé',other:'Panne à identifier'};
  let issue='',rows=[];
  const dockWhatsApp=document.querySelector('.home-contact-dock a[href*="wa.me"]'),dockDefault=dockWhatsApp?.href;
  const datalist=document.getElementById('journey-models');
  [...api.models(),'Samsung Galaxy A54','Samsung Galaxy S23','Samsung Galaxy S24','Google Pixel','Xiaomi','Autre modèle'].forEach(value=>{const option=document.createElement('option');option.value=value;datalist.appendChild(option)});
  function request(){
    const prices=rows.length?' Tarifs affichés : '+rows.map(row=>row.name+' '+row.price+' €').join(' ; ')+'. Qualité à choisir avec l’équipe.':'';
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
      const note=document.createElement('small');note.textContent='Tarifs de l’atelier · pièce et main-d’œuvre comprises. Qualité et disponibilité confirmées avant intervention.';price.appendChild(note);
      rows.forEach(row=>{const p=document.createElement('p'),name=document.createElement('span'),value=document.createElement('b'),description=document.createElement('small');name.textContent=row.name;value.textContent=row.price+' €';description.textContent=row.desc;p.append(name,value,description);list.appendChild(p)});
    }else{price.textContent='Votre devis confirmé par l’équipe';const note=document.createElement('small');note.textContent='Nous vérifions le modèle et la panne avant d’annoncer un prix. Aucun engagement.';price.appendChild(note)}
    document.getElementById('journey-safety').hidden=issue!=='water';
    wa.href='https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Solution Phone, ma demande est urgente. '+request()+' Pouvez-vous me confirmer le devis ?');
    if(dockWhatsApp)dockWhatsApp.href=wa.href;
  }
  model.addEventListener('input',render);
  root.querySelectorAll('[data-journey-issue]').forEach(button=>button.addEventListener('click',()=>{
    issue=button.dataset.journeyIssue;
    root.querySelectorAll('[data-journey-issue]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    render();if(!model.value.trim())model.focus();
  }));
  document.getElementById('journey-unknown').addEventListener('click',()=>{model.value='Modèle à identifier';render()});
  document.getElementById('journey-email').addEventListener('click',()=>{if(model.value.trim()&&issue)api.email(request())});
  api.draft=()=>model.value.trim()&&issue?request():undefined;
  // Keep the persistent contact dock away from the same buttons inside the card.
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>document.body.classList.toggle('journey-in-view',entries[0].isIntersecting),{threshold:0}).observe(root);
  api.ready.then(render);
})();
