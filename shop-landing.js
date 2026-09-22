(function(){
  'use strict';
  function init(){
    var journey=document.getElementById('shop-journey');
    if(journey)setupJourney(journey);
    document.querySelectorAll('[data-shop-product]').forEach(function(a){
      a.href='https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Solution Phone, je cherche : '+a.dataset.shopProduct+'. Mon modèle de téléphone : … Pouvez-vous confirmer la compatibilité et la disponibilité ?');
      a.target='_blank';a.rel='noopener';
    });
  }
  function setupJourney(root){
    var need='', choices=[], category='coques';
    var $=function(id){return document.getElementById('sj-'+id)};
    var configs={
      accessoire:{title:'Quel téléphone voulez-vous équiper ?',options:['Protéger l’écran','Choisir une coque','Charger mon téléphone','Écouter de la musique','En voiture'],action:'Découvrir ma sélection →'},
      smartphone:{title:'Qu’est-ce qui compte pour votre prochain smartphone ?',options:['Apple / iPhone','Samsung','Petit budget','Photo & vidéo','Autonomie'],action:'Préparer ma recherche →'},
      transfert:{title:'D’un téléphone à l’autre, que souhaitez-vous retrouver ?',options:['Contacts','Photos et vidéos','Messages / WhatsApp','Aide à la prise en main'],action:'Préparer ma demande →'}
    };
    root.hidden=false;
    root.classList.add('sj-boutique');
    $('title').textContent='Qu’est-ce qu’il vous faut\u00a0?';
    root.querySelector('.sj-intro>p:not(.sj-kicker)').textContent='Coques, protections, chargeurs et téléphones. Choisissez ce que vous cherchez, on vous aide pour le modèle.';
    root.querySelector('.sj-progress').hidden=true;
    var needs=root.querySelector('.sj-needs');needs.replaceChildren();
    [['coques','Une coque','Dès 5 €','Choisir une coque'],['verres','Une protection','Dès 5 €','Protéger l’écran'],['chargeurs','Un chargeur','Câbles & recharge','Charger mon téléphone']].forEach(function(item){
      var b=document.createElement('button');b.type='button';b.dataset.need='accessoire';b.dataset.category=item[0];b.dataset.choice=item[3];b.setAttribute('aria-pressed','false');
      var product=(window.allProducts&&window.allProducts[item[0]]||[])[0];
      if(product&&product.img){var img=document.createElement('img');img.src=product.img;img.alt='';img.width=180;img.height=160;b.appendChild(img)}
      var strong=document.createElement('strong');strong.textContent=item[1];var small=document.createElement('small');small.textContent=item[2];b.append(strong,small);needs.appendChild(b);
    });
    [['smartphone','Un téléphone','Voir les reconditionnés →'],['transfert','Un transfert','Contacts, photos, données →']].forEach(function(item){var b=document.createElement('button');b.type='button';b.dataset.need=item[0];b.setAttribute('aria-pressed','false');b.className='sj-service';var strong=document.createElement('strong');strong.textContent=item[1];var small=document.createElement('small');small.textContent=item[2];b.append(strong,small);needs.appendChild(b)});
    var hero=root.nextElementSibling;hero.hidden=true;
    var catalogue=document.createElement('details');catalogue.className='sj-catalogue';catalogue.id='sj-catalogue';
    var summary=document.createElement('summary');summary.textContent='Je préfère parcourir le catalogue et les prix';catalogue.appendChild(summary);
    hero.after(catalogue);
    var node=catalogue.nextElementSibling;
    while(node && !node.querySelector('[data-evan-question="Je cherche un accessoire pour un modèle qui n\'est pas dans la liste"]')){
      if(node.tagName!=='SECTION'&&node.tagName!=='ASIDE')break;
      var next=node.nextElementSibling;catalogue.appendChild(node);node=next;
    }
    root.querySelectorAll('[data-need]').forEach(function(button){button.addEventListener('click',function(){
      need=button.dataset.need;choices=button.dataset.choice?[button.dataset.choice]:[];category=button.dataset.category||'coques';
      root.querySelectorAll('[data-need]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button))});
      $('question').textContent=configs[need].title;$('detail').hidden=false;$('result').hidden=true;
      $('device-fields').hidden=need!=='accessoire';$('transfer-fields').hidden=need!=='transfert';
      $('options').replaceChildren();
      $('options').hidden=need==='accessoire';
      configs[need].options.forEach(function(name){var b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed','false');b.addEventListener('click',function(){var i=choices.indexOf(name);if(i<0)choices.push(name);else choices.splice(i,1);b.setAttribute('aria-pressed',String(i<0));$('result').hidden=true});$('options').appendChild(b)});
      $('result-button').textContent=need==='accessoire'?'Voir les produits →':configs[need].action;$('detail').focus({preventScroll:true});$('detail').scrollIntoView({block:'start',behavior:'smooth'});
    })});
    $('brand').addEventListener('change',function(){
      var names=Array.from(document.querySelectorAll('.chip[onclick*="filterByModel"]')).map(function(b){return b.textContent.trim()});
      var pattern=$('brand').value==='Apple'?/iPhone/:$('brand').value==='Samsung'?/Galaxy/:/Xiaomi|Redmi/i;
      $('models').replaceChildren();names.filter(function(n){return pattern.test(n)}).forEach(function(n){var option=document.createElement('option');option.value=n;$('models').appendChild(option)});
      $('model').value='';$('result').hidden=true;
    });
    root.querySelectorAll('input').forEach(function(input){input.addEventListener('input',function(){$('result').hidden=true})});
    $('result-button').addEventListener('click',function(){
      var device=[$('brand').value,$('model').value.trim()].filter(Boolean).join(' ')||'modèle à identifier';
      var detail=need==='accessoire'?device:need==='transfert'?($('from').value.trim()||'ancien téléphone à préciser')+' → '+($('to').value.trim()||'nouveau téléphone à préciser'):'smartphone reconditionné';
      var selection=choices.length?choices.join(', '):'À définir avec votre équipe';
      $('result-title').textContent=need==='accessoire'?'À retrouver en boutique':need==='smartphone'?'Les téléphones reconditionnés':'Votre transfert en boutique';
      $('summary').textContent=detail+' · '+selection;
      $('recommendations').replaceChildren();
      var cards=[];
      if(need==='accessoire'){
        if(!choices.length||choices.includes('Protéger l’écran'))cards.push(['Un écran protégé','Verre trempé 5 € · Premium 10 €. Compatibilité à confirmer.']);
        if(!choices.length||choices.includes('Choisir une coque'))cards.push(['Une coque à votre image','Transparente 5 € · MagSafe / couleur 10 €, selon modèle.']);
        if(choices.includes('Charger mon téléphone'))cards.push(['La bonne recharge','Câble, chargeur ou batterie externe : connecteur et puissance à vérifier avec votre appareil.']);
        if(choices.includes('Écouter de la musique'))cards.push(['Votre audio au quotidien','Dites-nous si vous préférez un accessoire filaire ou sans fil.']);
        if(choices.includes('En voiture'))cards.push(['Vos trajets bien équipés','Supports et solutions de recharge : l’équipe vous guide selon votre usage.']);
      }else if(need==='smartphone')cards.push(['Un choix concret','Consultez le stock et les prix des appareils. L’équipe confirme la disponibilité avant votre visite.'],['Un achat accompagné','Garantie commerciale 12 mois sur les reconditionnés, sans préjudice des garanties légales.']);
      else cards.push(['Un transfert préparé ensemble','La faisabilité dépend des deux téléphones, de leur état et des données concernées. Tarif confirmé avant intervention.'],['Vos données restent privées','Ne communiquez ni mot de passe ni code de connexion dans votre message.']);
      cards.forEach(function(c){var card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=c[0];p.textContent=c[1];card.append(h,p);$('recommendations').appendChild(card)});
      if(need==='accessoire'){
        var note=document.createElement('p');note.className='sj-product-note';note.textContent='Exemples de notre gamme. Les références ci-dessous ne sont pas un stock en temps réel : nous vérifions la version adaptée à votre '+device+'. Prix des références sur demande.';$('recommendations').appendChild(note);
        var source=window.allProducts&&window.allProducts[category]||[];
        if(category==='coques'&&$('brand').value==='Samsung')source=window.COQUES_SS||source;
        if(category==='coques'&&$('brand').value==='Apple')source=window.COQUES_IP||source;
        var products=source.slice(0,6);
        products.forEach(function(product){var card=document.createElement('article');card.className='sj-real-product';var img=document.createElement('img');img.src=product.img;img.alt=product.name;img.loading='lazy';img.width=240;img.height=240;var h=document.createElement('h3');h.textContent=product.name;var a=document.createElement('a');a.textContent='Vous l’avez pour mon téléphone ?';a.target='_blank';a.rel='noopener';a.href='https://wa.me/33783921884?text='+encodeURIComponent('Bonjour, je cherche '+product.name+' pour '+device+'. Avez-vous une version compatible ? À quel prix ?');card.append(img,h,a);$('recommendations').appendChild(card)});
      }
      var message='Bonjour Solution Phone / Solution Accessoires, je souhaite '+(need==='accessoire'?'équiper mon téléphone':need==='smartphone'?'changer de smartphone':'un transfert de données')+'.\n'+detail+'\nMes besoins : '+selection+'.\nPouvez-vous me confirmer les possibilités, la disponibilité et le prix ?';
      $('wa').href='https://wa.me/33783921884?text='+encodeURIComponent(message);
      $('wa').textContent=need==='accessoire'?'Vérifier pour mon téléphone sur WhatsApp':'En parler sur WhatsApp';
      $('mail').href='mailto:contact@solution-phone.fr?subject='+encodeURIComponent('Ma sélection Solution Accessoires')+'&body='+encodeURIComponent(message);
      $('stock').hidden=need!=='smartphone';$('detail').hidden=true;$('result').hidden=false;$('result').focus();$('result').scrollIntoView({block:'start',behavior:'smooth'});
    });
    $('edit').addEventListener('click',function(){$('result').hidden=true;$('detail').hidden=false;$('detail').focus();$('detail').scrollIntoView({block:'start'})});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
