    const SUPABASE_KEY='';
    const JASON_BRAIN_URL='https://vps-8066c206.vps.ovh.net/api/public/jason-brain';
    const QUOTE_REQUEST_URL='https://vps-8066c206.vps.ovh.net/api/public/quote-request';
    const PUBLIC_QUOTE_SOURCE='v2'; // Bascule souveraine vers Solution Phone V2 OVH.
    const V2_QUOTE_REQUEST_URL='https://vps-8066c206.vps.ovh.net/api/public/quote-request';
    const PUBLIC_CATALOG_URL='https://vps-8066c206.vps.ovh.net/api/public/catalog';
    const JASON_CONTEXT_PAGE=new URLSearchParams(location.search).get('from')||location.pathname;
    const JASON_SOURCE_PAGE=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'/audit-local/'+JASON_CONTEXT_PAGE.replace(/^\/+/, ''):JASON_CONTEXT_PAGE;
    document.querySelectorAll('[data-iphone-site]').forEach(link=>{link.href=location.hostname==='localhost'?'http://localhost:4174/':'https://reparation-iphone-macon.fr/'});
    const QUALITES=[
      {id:'hd',name:'Compatible HD/LTPS',desc:'L’essentiel, au meilleur prix'},
      {id:'ltps',name:'Compatible HD/LTPS',desc:'L’essentiel, au meilleur prix'},
      {id:'ltpsp',name:'LTPS Prime',desc:'Écran LCD de gamme supérieure, lumineux'},
      {id:'oled',name:'Soft OLED',desc:'Rendu proche de l’original'},
      {id:'relife',name:'ReLife',desc:'Dalle Apple d’origine reconditionnée'}
    ];
    const QUALITES_BAT=[
      {id:'compat',name:'Compatible',desc:'Solution économique'},
      {id:'ti',name:'Compatible reconnue',desc:'Batterie compatible reconnue par l’iPhone selon le modèle'},
      {id:'orig',name:'Originale',desc:'Pièce d’origine'}
    ];
    const fallbackBatteries={
      '16 pro max':[65,75,null],'16 pro':[65,75,null],'16':[65,75,null],
      '15 pro max':[65,75,null],'15 pro':[65,75,null],'15':[65,75,null],
      '14 pro max':[55,65,null],'14 pro':[55,65,null],'14':[55,65,null],
      '13 pro max':[55,65,null],'13 pro':[55,65,null],'13':[55,65,null],'13 mini':[55,65,null],
      '12 pro':[45,55,null],'12':[45,55,null],'12 mini':[45,55,null],
      '11':[35,45,null],'xr':[35,45,null],'xs':[35,45,null],'x':[35,45,null]
    };
    let screens={},batteries={...fallbackBatteries},liveScreenModels=new Set(),liveBatteryModels=new Set(),recondStock=[],current=null,conversationText='',conversationParsed=null,waitingFor=null,flowData={},lastBrainWhatsApp='',expertPollTimer=null,expertPollCount=0;
    const SERVICE_ESTIMATES={
      computerScreen:{range:'100 à 170 €',text:'Pour un remplacement d’écran d’ordinateur, comptez généralement',note:'Cette estimation dépend de la marque, du modèle et de la dalle disponible.'},
      computerVirus:{range:'40 à 60 €',text:'Pour un nettoyage de virus sur PC, comptez généralement',note:'Le tarif précis dépend de l’état du système et du temps nécessaire.'},
      computerDrive:{range:'à partir de 120 €',text:'Pour un changement de disque dur avec réinstallation de Windows, comptez',note:'Le prix final dépend du disque choisi et des données à récupérer.'},
      computerBattery:{range:'à partir de 70 €',text:'Pour un changement de batterie de PC portable ou de Mac, comptez',note:'Le prix final dépend de la référence exacte de la batterie.'}
    };
    const SPECIALIST_GUIDANCE={
      computerScreen:{title:'Écran d’ordinateur',check:'Une photo de l’étiquette sous l’ordinateur permet d’identifier la dalle exacte. Si l’image apparaît sur un écran externe, la panne vient souvent de la dalle ou de sa connexion.',safety:'Ne forcez pas la charnière si l’écran est fissuré ou se décolle.'},
      computerVirus:{title:'Virus ou publicités intempestives',check:'Évitez de saisir vos mots de passe et déconnectez les moyens de paiement enregistrés. Nous contrôlons le système avant de supprimer quoi que ce soit.',safety:'Ne payez rien à la suite d’un message d’alerte affiché à l’écran et ne donnez pas accès au PC à un inconnu.'},
      computerDrive:{title:'Disque dur et Windows',check:'Nous vérifions d’abord l’état du disque et la possibilité de récupérer les données avant toute réinstallation.',safety:'Si le disque fait un bruit anormal ou disparaît, éteignez le PC pour limiter les risques de perte de données.'},
      computerBattery:{title:'Batterie de PC ou Mac',check:'La référence exacte de l’appareil et l’état de la batterie sont contrôlés avant commande.',safety:'Si le clavier ou le pavé tactile se soulève, arrêtez de charger l’appareil.'},
      computerData:{title:'Récupération de données',check:'Le support est contrôlé avant toute tentative. Le devis dépend de son état et du niveau de récupération nécessaire.',safety:'Évitez les essais répétés si le disque fait du bruit ou n’est plus détecté.'},
      computerPower:{title:'Ordinateur qui ne démarre plus',check:'Apportez le chargeur avec l’appareil. Nous contrôlons d’abord l’alimentation, la batterie et le connecteur avant d’envisager la carte mère.',safety:'Débranchez l’appareil s’il chauffe anormalement ou dégage une odeur.'},
      scooterTire:{title:'Pneu ou crevaison',check:'Le modèle exact et le diamètre de roue déterminent le pneu ou la chambre à air nécessaire.',safety:'Ne roulez pas à plat : cela peut endommager le pneu, la jante et le moteur de roue.'},
      scooterBrake:{title:'Freinage de trottinette',check:'Le jeu, les plaquettes, le disque ou le câble doivent être contrôlés avant réglage.',safety:'N’utilisez plus la trottinette si le freinage est insuffisant ou irrégulier.'},
      scooterBattery:{title:'Autonomie de trottinette',check:'La pression des pneus, la température, le chargeur et l’état de la batterie peuvent tous réduire l’autonomie.',safety:'Ne rechargez pas une batterie gonflée, choquée, mouillée ou anormalement chaude.'},
      scooterPower:{title:'Trottinette qui ne démarre plus',check:'Apportez le chargeur et, si possible, une photo du code erreur. Nous contrôlons la charge avant le contrôleur ou la batterie.',safety:'Ne tentez pas d’ouvrir ni de shunter la batterie.'},
      consoleHdmi:{title:'Port HDMI de console',check:'Testez un autre câble et une autre entrée du téléviseur sans forcer la prise. Si le connecteur bouge, l’atelier doit le contrôler.',safety:'Cessez les essais si le port est tordu ou enfoncé.'},
      consoleHeat:{title:'Console qui surchauffe',check:'Laissez les aérations libres et notez si la console s’éteint seule. Un nettoyage interne ou le refroidissement peut être en cause.',safety:'Éteignez-la si elle affiche une alerte de température ou dégage une odeur.'},
      consolePower:{title:'Console qui ne démarre plus',check:'Testez une autre prise et, si possible, un câble compatible. Nous contrôlons l’alimentation avant la carte mère.',safety:'N’ouvrez pas le bloc d’alimentation.'},
      consoleDrive:{title:'Lecteur ou manette',check:'Essayez un autre disque propre ou reconnectez la manette par câble. Le modèle de console et le symptôme précis permettent de préparer le devis.',safety:'Ne forcez jamais un disque dans le lecteur.'}
    };
    const REPAIR_EXPERTISE={
      camera:{title:'Caméra ou mise au point',advice:'Nettoyez doucement la lentille extérieure et testez avec l’application photo d’origine. Si l’image tremble, reste floue ou affiche un écran noir, le module ou sa connexion doit être contrôlé.',safety:'Aucun prix fiable sans connaître le modèle et tester la caméra.'},
      audio:{title:'Micro, écouteur ou haut-parleur',advice:'Retirez la coque et testez séparément un appel, le haut-parleur et un enregistrement vocal. Une grille encrassée peut suffire à étouffer le son ; n’utilisez pas d’aiguille ni de liquide.',safety:'Nous commençons par un contrôle et un nettoyage avant d’envisager une pièce.'},
      buttons:{title:'Bouton Power ou volume',advice:'Retirez la coque et vérifiez si le bouton reste physiquement enfoncé. Ne forcez pas : la panne peut venir du bouton, de la nappe interne ou du châssis.',safety:'Le devis dépend du modèle et de la pièce réellement en cause.'},
      back:{title:'Vitre arrière cassée',advice:'Évitez l’eau et protégez les bords coupants. Le prix dépend du modèle, de la matière du dos et de l’état du châssis ou des lentilles.',safety:'Une photo permet souvent à l’équipe de préparer un devis précis.'},
      water:{title:'Téléphone mouillé ou oxydé',advice:'Éteignez-le, débranchez-le et ne le rechargez pas. N’utilisez ni riz, ni sèche-cheveux, ni source de chaleur. Plus l’appareil reste alimenté, plus le risque de corrosion et de court-circuit augmente.',safety:'Apportez-le rapidement en atelier : aucune remise sous tension avant contrôle.'},
      power:{title:'Extinctions ou redémarrages',advice:'La cause peut être la batterie, la charge, le logiciel ou la carte mère. Un diagnostic est nécessaire avant d’annoncer une pièce ou un prix.',safety:'Si la batterie gonfle ou si le téléphone chauffe au repos, arrêtez de le charger.'},
      faceid:{title:'Face ID ou reconnaissance faciale',advice:'Nettoyez la zone des capteurs, retirez la protection d’écran si elle les masque et redémarrez le téléphone. Après un choc ou un remplacement d’écran, les capteurs doivent être contrôlés sans remplacer de pièce au hasard.',safety:'Ne tentez pas de démonter le module : certains composants sont associés au téléphone.'},
      network:{title:'Réseau, Wi-Fi ou carte SIM',advice:'Activez puis désactivez le mode avion, redémarrez l’appareil et testez la carte SIM dans un autre téléphone si possible. La panne peut venir du réseau, de la SIM, des réglages ou de l’appareil.',safety:'Aucun remplacement de pièce avant d’avoir isolé la cause.'},
      overheating:{title:'Téléphone qui chauffe',advice:'Retirez la coque, fermez les applications lourdes et laissez l’appareil refroidir sans le mettre au froid. Une chauffe pendant la charge, au repos ou avec une batterie qui gonfle nécessite un contrôle.',safety:'Débranchez-le et cessez de l’utiliser s’il devient brûlant, se déforme ou dégage une odeur.'},
      slow:{title:'Téléphone lent ou stockage saturé',advice:'Vérifiez l’espace libre, redémarrez le téléphone et mettez le système à jour après sauvegarde. Un stockage presque plein ou une application défaillante suffit souvent à ralentir l’appareil.',safety:'Nous vérifions le logiciel et le stockage avant d’envisager une réparation matérielle.'},
      vibration:{title:'Vibreur ou retour haptique',advice:'Vérifiez le mode silencieux, les réglages de vibration et testez sans coque. Si le téléphone ne vibre jamais, le moteur ou sa connexion doit être contrôlé.',safety:'Le devis dépend du modèle et du diagnostic en atelier.'}
      ,androidVirus:{title:'Virus ou publicités sur Android',advice:'Des publicités intempestives, des applications qui s’ouvrent seules ou un navigateur redirigé viennent souvent d’une application indésirable. Évitez de saisir vos mots de passe et ne payez rien à la suite d’un message d’alerte.',safety:'Nous contrôlons et nettoyons le téléphone avant d’envisager toute réinitialisation.'}
      ,board:{title:'Carte mère ou micro-soudure',advice:'Une panne de carte mère ne se confirme pas à distance. Nous contrôlons d’abord l’alimentation, la batterie, le connecteur et les traces d’oxydation afin d’éviter une intervention lourde inutile.',safety:'Le diagnostic et la faisabilité doivent être validés par l’atelier avant tout prix ou délai.'}
    };
    let jasonConversationToken='';
    try{jasonConversationToken=sessionStorage.getItem('jason_conversation_token')||''}catch(e){}
    const $=s=>document.querySelector(s);
    const normalize=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
    function handoffDevice(message,parsed){
      if(parsed?.detectedModel)return parsed.detectedModel;
      const value=normalize(message);
      if(/\bgalaxy tab\b/.test(value))return 'Samsung Galaxy Tab · modèle à préciser';
      if(/\bipad\b/.test(value))return 'iPad · modèle à préciser';
      if(/\btablette\b/.test(value))return 'Tablette · modèle à préciser';
      const consoleModel=value.match(/\b(ps ?[345](?: pro)?|playstation ?[345]|xbox(?: one| series [xs])?|nintendo switch|switch(?: oled)?)\b/);
      if(consoleModel)return consoleModel[1].replace(/^ps ?/,'PS ').replace(/^playstation/i,'PlayStation').replace(/^xbox/i,'Xbox').replace(/^nintendo switch/i,'Nintendo Switch').replace(/^switch/i,'Nintendo Switch');
      if(/\bconsole\b/.test(value))return 'Console · modèle à préciser';
      if(/\bmacbook\b/.test(value))return 'MacBook · modèle à préciser';
      if(/\bimac\b/.test(value))return 'iMac · modèle à préciser';
      const pcBrand=value.match(/\b(lenovo|thinkpad|hp|hewlett packard|dell|asus|acer|msi|surface|microsoft|chromebook)\b/);
      if(/\b(pc portable|ordinateur portable|laptop)\b/.test(value))return `PC portable${pcBrand?' '+pcBrand[1].replace(/\b\w/g,c=>c.toUpperCase()):''} · modèle exact à préciser`;
      if(/\b(pc fixe|ordinateur fixe|tour)\b/.test(value))return `PC fixe${pcBrand?' '+pcBrand[1].replace(/\b\w/g,c=>c.toUpperCase()):''} · référence à préciser`;
      if(/\b(pc|ordinateur)\b/.test(value))return `Ordinateur${pcBrand?' '+pcBrand[1].replace(/\b\w/g,c=>c.toUpperCase()):''} · modèle à préciser`;
      if(/\btrottinette\b/.test(value))return 'Trottinette · modèle à préciser';
      if(/\biphone\b/.test(value))return 'iPhone · modèle à préciser';
      if(/\bsamsung\b/.test(value))return 'Samsung · modèle à préciser';
      if(/\bandroid\b/.test(value))return 'Smartphone Android · modèle à préciser';
      return parsed?.brand||'Appareil à préciser';
    }
    const escapeHtml=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    function parisStoreTime(){
      try{return new Date(new Date().toLocaleString('en-US',{timeZone:'Europe/Paris'}))}catch(e){return new Date()}
    }
    function storeAvailability(forcedNow){
      const now=forcedNow||parisStoreTime(),day=now.getDay(),minutes=now.getHours()*60+now.getMinutes();
      const mondayMorning=day===1&&minutes>=555&&minutes<735;
      const mondayAfternoon=day===1&&minutes>=840&&minutes<1140;
      const continuous=day>=2&&day<=6&&minutes>=555&&minutes<1140;
      const open=mondayMorning||mondayAfternoon||continuous;
      let next='';
      if(!open){
        if(day===1&&minutes>=735&&minutes<840)next='Réouverture aujourd’hui à 14h';
        else if(day>=1&&day<=6&&minutes<555)next='Ouverture aujourd’hui à 9h15';
        else if(day===6||day===0)next='Réouverture lundi à 9h15';
        else next='Réouverture demain à 9h15';
      }
      return{open,next,clock:String(now.getHours()).padStart(2,'0')+'h'+String(now.getMinutes()).padStart(2,'0')};
    }
    function updateStoreAvailability(){
      const bar=$('#live-availability');if(!bar)return;
      const live=storeAvailability(),title=$('#availability-title'),detail=$('#availability-detail'),meta=$('#availability-meta'),action=$('#availability-action');
      bar.classList.toggle('closed',!live.open);
      title.textContent=live.open?'Boutique ouverte':'Boutique fermée';
      if(live.open){
        detail.innerHTML='<b>Place disponible</b> · réparations courantes possibles en moins d’une heure*';
        meta.textContent='Sans rendez-vous · selon modèle et pièce · '+live.clock;
        action.textContent='Lancer mon diagnostic';
      }else{
        detail.innerHTML='<b>Devis immédiat 24/24</b> · l’assistant prépare votre demande maintenant';
        meta.textContent=live.next+' · '+live.clock;
        action.textContent='Obtenir mon devis';
      }
    }
    window.focusEvan=focusJason;function focusJason(){
      const conversation=$('.conversation');if(conversation)conversation.scrollIntoView({behavior:'smooth',block:'start'});
      const input=$('#journey-model');
      setTimeout(()=>input?.focus(),420);
    }

    async function loadPrices(){
      // Écrans approuvés dans V2 : aucune réponse tardive de V1 ne peut les écraser.
      // Si l'asset manque ou est invalide, ne jamais afficher un vieux prix écran.
      const approved=window.SolutionPhoneApprovedIphoneScreens;
      if(Array.isArray(approved)&&approved.length===25){
        const next={},keys=new Set();let valid=true;
        approved.forEach(r=>{
          if(!r||typeof r.modele!=='string'||!Array.isArray(r.prix)||r.prix.length!==5
            ||!r.prix.some(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)
            ||!r.prix.every(x=>x===null||(typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=100000&&x===Math.round(x*100)/100))){valid=false;return;}
          const matches=modelKeys(r.modele);if(!matches.length){valid=false;return;}
          matches.forEach(k=>{if(keys.has(k))valid=false;keys.add(k);next[k]=r.prix});
        });
        if(valid){screens=next;liveScreenModels=new Set(keys)}
      }
      syncQuickModels();
      try{
        const response=await fetch(PUBLIC_CATALOG_URL+'?resource=prices');
        if(!response.ok)throw new Error('catalogue prices unavailable');
        const catalogue=await response.json();
        if(Array.isArray(catalogue.prices?.screens)&&catalogue.prices.screens.length){const nextScreens={};liveScreenModels=new Set();catalogue.prices.screens.forEach(r=>{if(!Array.isArray(r.prix))return;modelKeys(r.modele).forEach(k=>{nextScreens[k]=r.prix;if(r.prix.some(Number))liveScreenModels.add(k)})});if(liveScreenModels.size)screens=nextScreens;}
        (catalogue.prices?.batteries||[]).forEach(r=>{if(!Array.isArray(r.prix))return;modelKeys(r.modele).forEach(k=>{batteries[k]=r.prix;if(r.prix.some(Number))liveBatteryModels.add(k)})});
      }catch(e){}finally{syncQuickModels()}
    }
    async function loadStock(){
      try{
        const response=await fetch(PUBLIC_CATALOG_URL+'?resource=stock');
        if(!response.ok)throw new Error('catalogue stock unavailable');
        const catalogue=await response.json(),used=catalogue.stock?.used||[],newPhones=catalogue.stock?.new||[];
        recondStock=[...used.map(p=>({...p,neuf:false})),...newPhones.map(p=>({...p,grade:'Neuf',neuf:true}))].filter(p=>p.modele&&Number(p.vente)>0);
      }catch(e){recondStock=[]}
    }
    const IPHONE_MODEL_KEYS=['17 pro max','17 pro','17 air','17','16 pro max','16 pro','16 plus','16e','16','15 pro max','15 pro','15 plus','15','14 pro max','14 pro','14 plus','14','13 pro max','13 pro','13 mini','13','12 pro max','12 pro','12 mini','12','11 pro max','11 pro','11','xs max','xs','xr','x','se 3','se 2','se','8 plus','8','7 plus','7','6s plus','6s','6 plus','6','5s','5c'];
    function modelKeys(raw){
      const cleaned=normalize(raw).replace(/\biphone\b/g,' ').replace(/promax/g,'pro max').replace(/\bse\s*(?:3|2022)\b/g,'se 3').replace(/\bse\s*(?:2|2020)\b/g,'se 2').replace(/\s+/g,' ').trim();
      const matches=cleaned.split('/').map(part=>part.trim().replace(/\+/g,' plus').replace(/\s+/g,' ')).map(part=>IPHONE_MODEL_KEYS.find(key=>part===key)).filter(Boolean);
      if(matches.length)return[...new Set(matches)];
      const searchable=cleaned.replace(/\+/g,' plus');
      const padded=` ${searchable} `;
      const fallback=IPHONE_MODEL_KEYS.find(key=>padded.includes(` ${key} `));
      return fallback?[fallback]:[];
    }
    function modelKey(raw){return modelKeys(raw)[0]||null}
    function parseRequest(text){
      const t=normalize(text);
      const intent=/informatique|ordinateur|\bpc\b|macbook|imac/.test(t)?'computer':/trottinette|scooter electrique/.test(t)?'scooter':/console|playstation|\bps[345]\b|xbox|nintendo|switch/.test(t)?'console':/transfert|transferer|migration|copier.*donnee|nouveau telephone|sauvegarde|cle usb|whatsapp.*(?:transfer|recuper)|photos?.*(?:cle usb|sauvegard)/.test(t)?'transfer':/accessoire|coque|protection|hydrogel|chargeur|cable|verre trempe/.test(t)?'accessory':/recondition|occasion|acheter.*(?:iphone|android|telephone|smartphone|samsung)|(?:iphone|android|telephone|smartphone|samsung).*(?:acheter|achat|budget|moins de|disponible|stock)/.test(t)?'reconditioned':/repar|panne|casse|ecran|batter|charge|connecteur|camera|micro|haut.?parleur|bouton|vitre arriere|dos casse|oxyd|liquide|etein|redemarr|reboot|pomme|face\s?id|reseau|wifi|bluetooth|sim|chauffe|lent|stockage|memoire pleine|vibre|carte mere|micro.?soud|virus|malware|publicit|\bpubs?\b|pop.?up|infecte/.test(t)?'repair':null;
      const issue=/carte mere|micro.?soud/.test(t)?'board':/virus|malware|publicit|\bpubs?\b|pop.?up|application.*(?:seule|suspecte)|infecte/.test(t)?'androidVirus':/oxyd|liquide|tombe.*eau|mouille/.test(t)?'water':/gonfle|batterie.*chaud|batterie.*odeur/.test(t)?'battery':/face\s?id|reconnaissance faciale|true\s?depth/.test(t)?'faceid':/wifi|bluetooth|reseau|carte sim|aucun service|pas de service/.test(t)?'network':/chauffe|surchauffe|brulant/.test(t)?'overheating':/lent|rame|stockage|memoire pleine|espace.*plein/.test(t)?'slow':/vibreur|vibration|haptique/.test(t)?'vibration':/etein|redemarr|reboot|boucle.*pomme|logo.*pomme|ne s.?allume|plus.*allumer/.test(t)?'power':/batter|autonomie|decharge/.test(t)?'battery':/vitre arriere|face arriere|dos casse/.test(t)?'back':/ecran|vitre|cass|fissur|tactile|affich/.test(t)?'screen':/charge|connecteur|usb|lightning/.test(t)?'charge':/camera|photo|flou/.test(t)?'camera':/micro|haut.?parleur|son|audio/.test(t)?'audio':/bouton|volume|power/.test(t)?'buttons':null;
      const brand=/iphone|apple/.test(t)?'Apple':/samsung|galaxy/.test(t)?'Samsung':/xiaomi|redmi/.test(t)?'Xiaomi':/honor/.test(t)?'Honor':/huawei/.test(t)?'Huawei':/pixel|google/.test(t)?'Google Pixel':/one\s?plus/.test(t)?'OnePlus':/oppo/.test(t)?'Oppo':/realme/.test(t)?'Realme':/motorola|moto\s/.test(t)?'Motorola':/sony|xperia/.test(t)?'Sony':/nokia/.test(t)?'Nokia':null;
      const key=modelKey(t);
      let detectedModel=brand==='Apple'&&key?'iPhone '+key.replace(/\b\w/g,c=>c.toUpperCase()):null;
      if(brand==='Samsung'){
        const match=t.match(/\b(?:samsung\s+)?(?:galaxy\s+)?((?:s|a)\s?\d{2}(?:\s?(?:ultra|plus|fe|\+))?|z\s?(?:flip|fold)\s?\d?)\b/);
        if(match){
          const model=match[1].replace(/\s+/g,' ').replace(/^([sa])\s?/i,(_,l)=>l.toUpperCase()).replace(/\b(ultra|plus|fe)\b/g,w=>w.charAt(0).toUpperCase()+w.slice(1));
          detectedModel='Samsung Galaxy '+model;
        }
      }
      if(brand&&brand!=='Apple'&&brand!=='Samsung'&&!detectedModel){
        const candidate=t.replace(/xiaomi|redmi|honor|huawei|google|pixel|one\s?plus|oppo|realme|motorola|moto|sony|xperia|nokia/g,' ').replace(/changer|remplacer|reparation|reparer|prix|tarif|batterie|autonomie|ecran|vitre|casse|connecteur|charge|camera/g,' ').replace(/\s+/g,' ').trim();
        if(candidate&&/\d/.test(candidate))detectedModel=brand+' '+candidate.replace(/\b\w/g,c=>c.toUpperCase());
      }
      const safetyAlert=/gonfle|brulant|tres chaud|odeur|fumee|deforme/.test(t);
      return {text,intent,issue,brand,key,detectedModel,safetyAlert};
    }
    function addMessage(role,text){
      const thread=$('#chat-thread'),node=document.createElement('div');node.className='message '+role;
      node.innerHTML=(role==='bot'?'<small>Assistant de Sébastien · Solution Phone</small>':'')+'<p>'+escapeHtml(text)+'</p>';
      thread.appendChild(node);thread.scrollTop=thread.scrollHeight;
      return node;
    }
    function addKnowledgeFeedback(node,knowledgeId){
      if(!node||!knowledgeId||!jasonConversationToken)return;
      const feedback=document.createElement('div');feedback.className='message-feedback';feedback.innerHTML='<span>Cette réponse vous aide ?</span><button type="button" data-value="helpful">Oui</button><button type="button" data-value="not_helpful">Pas vraiment</button>';
      feedback.querySelectorAll('button').forEach(button=>button.addEventListener('click',async()=>{
        feedback.querySelectorAll('button').forEach(item=>item.disabled=true);
        try{
          const response=await fetch(JASON_BRAIN_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_token:jasonConversationToken,knowledge_id:knowledgeId,feedback:button.dataset.value})});
          if(!response.ok)throw new Error('feedback_failed');
          feedback.classList.add('is-sent');feedback.textContent=button.dataset.value==='helpful'?'Merci, cette réponse est maintenant validée.':'Merci, cette réponse sera revue par l’équipe.';
        }catch(error){feedback.querySelectorAll('button').forEach(item=>item.disabled=false)}
      }));
      node.appendChild(feedback);
    }
    function showTyping(){
      document.body.classList.remove('evan-listening','evan-speaking');document.body.classList.add('evan-thinking');
      const thread=$('#chat-thread'),node=document.createElement('div');node.className='typing';node.id='chat-typing';node.innerHTML='<i></i><i></i><i></i>';thread.appendChild(node);thread.scrollTop=thread.scrollHeight;
    }
    function botReply(text,quick=[]){
      showTyping();$('#chat-quick').innerHTML='';
      setTimeout(()=>{$('#chat-typing')?.remove();document.body.classList.remove('evan-thinking');document.body.classList.add('evan-speaking');addMessage('bot',text);trackBrainEvent('answer_shown',{mode:'guided'});setQuickReplies(quick);setTimeout(()=>document.body.classList.remove('evan-speaking'),950)},520);
    }
    function setQuickReplies(items){
      const box=$('#chat-quick');box.innerHTML='';
      items.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=item.label;b.addEventListener('click',()=>handleConversationAnswer(item.value,item.label,item.kind));box.appendChild(b)});
    }
    function updateDiagnosticProgress(progress){
      const meter=$('#diagnostic-meter');
      if(!progress?.total){meter.classList.remove('show');return}
      const current=Math.max(1,Math.min(Number(progress.current)||1,Number(progress.total)||1));
      meter.classList.add('show');
      meter.style.setProperty('--diagnostic-progress',(current/Number(progress.total)*100)+'%');
      $('#diagnostic-progress-label').textContent='Diagnostic '+current+'/'+progress.total;
    }
    async function trackBrainEvent(event,metadata={}){
      try{
        const response=await fetch(JASON_BRAIN_URL,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({event,conversation_token:jasonConversationToken||undefined,event_metadata:metadata,context:{page:JASON_SOURCE_PAGE,consent_to_store:false}})
        });
        if(!response.ok)return;
        const data=await response.json();
        if(data.conversation_token){jasonConversationToken=data.conversation_token;try{sessionStorage.setItem('jason_conversation_token',jasonConversationToken)}catch(e){}}
      }catch(e){}
    }
    function stopExpertPolling(){if(expertPollTimer){clearTimeout(expertPollTimer);expertPollTimer=null}expertPollCount=0}
    function startExpertPolling(){
      stopExpertPolling();if(!jasonConversationToken)return;
      const poll=async()=>{
        expertPollCount++;
        try{
          const response=await fetch(JASON_BRAIN_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({poll:true,conversation_token:jasonConversationToken})});
          if(response.ok){
            const data=await response.json();
            if(data.status==='answered'&&data.answer){
              stopExpertPolling();document.body.classList.add('evan-speaking');const node=addMessage('bot','Confirmation de l’équipe : '+data.answer);if(data.knowledge_id)addKnowledgeFeedback(node,data.knowledge_id);trackBrainEvent('answer_shown',{mode:'expert_live'});$('#device-state').textContent='Réponse de l’équipe';setQuickReplies([{label:'Continuer sur WhatsApp',value:'whatsapp',kind:'brainWhatsApp'},{label:'Recevoir par e-mail',value:'mail',kind:'brainMail'}]);setTimeout(()=>document.body.classList.remove('evan-speaking'),950);return;
            }
          }
        }catch(e){}
        if(expertPollCount>=8){
          stopExpertPolling();
          $('#device-state').textContent='Équipe indisponible';
          addMessage('bot','Personne n’est disponible dans l’équipe pour le moment. Vous pouvez continuer immédiatement sur WhatsApp ou envoyer votre demande par e-mail.');
          setQuickReplies([{label:'Continuer sur WhatsApp',value:'whatsapp',kind:'brainWhatsApp'},{label:'Envoyer ma demande par e-mail',value:'mail',kind:'brainMail'}]);
          trackBrainEvent('handoff_timeout',{after_seconds:78});
          return
        }
        expertPollTimer=setTimeout(poll,10000);
      };
      expertPollTimer=setTimeout(poll,8000);
    }
    async function consultJasonMemory(message,parsed){
      showTyping();$('#chat-quick').innerHTML='';
      try{
        const response=await fetch(JASON_BRAIN_URL,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({message,conversation_token:jasonConversationToken||undefined,context:{brand:parsed?.brand||'',model:parsed?.detectedModel||'',page:JASON_SOURCE_PAGE,consent_to_store:false}})
        });
        if(!response.ok)throw new Error('brain_unavailable');
        const data=await response.json();
        if(data.conversation_token){jasonConversationToken=data.conversation_token;try{sessionStorage.setItem('jason_conversation_token',jasonConversationToken)}catch(e){}}
        $('#chat-typing')?.remove();document.body.classList.remove('evan-thinking');document.body.classList.add('evan-speaking');setTimeout(()=>document.body.classList.remove('evan-speaking'),1100);
        const warning=Array.isArray(data.warnings)&&data.warnings.length?'\n\nÀ savoir : '+data.warnings[0]:'';
        const botMessage=addMessage('bot',(data.answer||'Je vérifie votre demande.')+warning);
        trackBrainEvent('answer_shown',{mode:data.mode||'unknown',topic:data.topic||'',matched:Boolean(data.matched)});
        if(data.knowledge_id&&!data.diagnostic_active)addKnowledgeFeedback(botMessage,data.knowledge_id);
        current={...(parsed||{}),text:message,issueLabel:data.topic||'Question à l’atelier',model:handoffDevice(message,parsed),brainReference:data.reference||null,brainAnswer:data.answer||'',brainWarning:Array.isArray(data.warnings)&&data.warnings.length?data.warnings[0]:''};
        if(data.diagnostic_summary){current.text=data.diagnostic_summary;current.brainReference=null}
        lastBrainWhatsApp=data.whatsapp_url||waLink();
        syncContextCta();
        updateDiagnosticProgress(data.diagnostic_progress);
        if(data.needs_expert){
          trackBrainEvent('handoff_offered',{reason:'needs_expert',topic:data.topic||''});
          startExpertPolling();
          setQuickReplies([{label:'Envoyer sur WhatsApp',value:'whatsapp',kind:'brainWhatsApp'},{label:'Faire ma demande par e-mail',value:'mail',kind:'brainMail'},{label:'Ajouter une précision',value:'precision',kind:'brainPrecision'}]);
        }else if(Array.isArray(data.quick_replies)&&data.quick_replies.length){
          setQuickReplies(data.quick_replies.map(item=>({
            label:item.label,value:item.value,
            kind:item.action==='whatsapp'?'brainWhatsApp':item.action==='mail'?'brainMail':'brainDiagnostic'
          })));
        }else{
          setQuickReplies([{label:'Continuer sur WhatsApp',value:'whatsapp',kind:'brainWhatsApp'},{label:'Demander par e-mail',value:'mail',kind:'brainMail'}]);
        }
        $('#device-state').textContent=data.diagnostic_complete?'Diagnostic prêt':data.diagnostic_active?'Diagnostic guidé':data.needs_expert?'Validation humaine':'Tarif indicatif, à confirmer';
        return true;
      }catch(error){
        $('#chat-typing')?.remove();document.body.classList.remove('evan-thinking','evan-speaking');
        return false;
      }
    }
    function hasGenericModel(p){
      if(p.key||p.detectedModel)return true;
      if(p.brand==='Apple')return false;
      const stripped=normalize(p.text).replace(/apple|iphone|samsung|galaxy|xiaomi|redmi|honor|huawei|google|pixel|one\s?plus|oppo|realme|motorola|moto|sony|xperia|nokia/g,' ').replace(/ecran|vitre|casse|fissure|tactile|affichage|batterie|autonomie|charge|connecteur|camera|photo|panne|probleme/g,' ').replace(/\s+/g,' ').trim();
      return /[a-z]*\d+[a-z]*/i.test(stripped);
    }
    function replyEducation(type){
      if(type==='qualirepar'){
        botReply('Solution Phone est réparateur labellisé QualiRépar. 25 € sont déjà déduits de nos tarifs de réparation de smartphone : grâce au Bonus Réparation QualiRépar quand la réparation est éligible, sans remise équivalente hors éligibilité.\n\nLe Bonus est financé par les éco-organismes agréés (ecosystem, Ecologic). Vous n’avez aucun dossier à remplir.',[
          {label:'Voir mon tarif',value:'price',kind:'openPrice'},
          {label:'Comparer les écrans iPhone',value:'iphoneScreen',kind:'education'},
          {label:'Demander sur WhatsApp',value:'whatsapp',kind:'directWhatsApp'}
        ]);return;
      }
      if(type==='androidScreen'){
        botReply('Pour un écran Android, vous avez généralement 2 choix selon le modèle :\n\nCompatible — la solution la plus économique.\nService Pack constructeur — la pièce officielle de la marque, pour privilégier le rendu et la finition d’origine.\n\nJe vérifie toujours la disponibilité avant le devis : toutes les marques ne proposent pas un Service Pack pour chaque modèle.',[
          {label:'Demander le prix exact',value:'whatsapp',kind:'directWhatsApp'},
          {label:'Devis par e-mail',value:'mail',kind:'brainMail'},
          {label:'Comparer les écrans iPhone',value:'iphoneScreen',kind:'education'}
        ]);return;
      }
      if(type==='battery'){
        botReply('Pour la batterie, le choix dépend du téléphone :\n\niPhone — compatible, compatible reconnue par l’iPhone ou originale selon le modèle.\nAndroid — compatible ou originale constructeur selon disponibilité.\n\nAvant la réparation, l’équipe vous explique clairement le prix, la qualité et la compatibilité. Lorsqu’il existe plusieurs versions, vous choisissez celle adaptée à votre budget.',[
          {label:'Demander le prix exact',value:'whatsapp',kind:'directWhatsApp'},
          {label:'Devis par e-mail',value:'mail',kind:'brainMail'},
          {label:'Voir un tarif iPhone',value:'price',kind:'openPrice'}
        ]);return;
      }
      botReply('Pour votre écran iPhone, voici les qualités à comparer selon le modèle :\n\nCompatible HD/LTPS — écran LCD compatible (technologie des écrans classiques), le prix le plus bas.\nLTPS Prime — écran LCD de gamme supérieure, plus lumineux.\nHard OLED — écran OLED rigide : noirs profonds, généralement moins cher que le Soft OLED, mais moins tolérant à la flexion et aux chocs. Prix et disponibilité à confirmer selon le modèle.\nSoft OLED — écran OLED souple : noirs profonds, rendu proche de l’origine.\nReLife — dalle Apple d’origine reconditionnée avec une vitre neuve.\n\nVous choisissez selon votre budget ; l’équipe confirme la qualité disponible avant l’intervention.',[
        {label:'Voir mon tarif',value:'price',kind:'openPrice'},
        {label:'Comprendre QualiRépar',value:'qualirepar',kind:'education'},
        {label:'Me conseiller sur WhatsApp',value:'whatsapp',kind:'directWhatsApp'}
      ]);
    }
    function startEducation(text,type){
      const label=type==='qualirepar'?'Information QualiRépar':type==='androidScreen'?'Qualité écran Android':type==='battery'?'Qualité batterie':'Qualité écran iPhone';
      current={text,issueLabel:label,model:type==='androidScreen'?'Android':type==='battery'?'Toutes marques':'iPhone'};
      $('#start-view').style.display='none';$('#answer-view').classList.remove('show');$('#chat-view').classList.add('show');$('#chat-thread').innerHTML='';$('#chat-quick').innerHTML='';
      addMessage('user',text);$('#device-state').textContent=type==='qualirepar'?'Bonus vérifié':type==='battery'?'Choix batterie':'Comparatif écran';replyEducation(type);
    }
    function startBusinessAnswer(text,type){
      const answers={
        hours:'Nos horaires : lundi de 9h15 à 12h15 et de 14h à 19h. Du mardi au samedi, nous sommes ouverts de 9h15 à 19h en journée continue. La boutique est fermée le dimanche.',
        address:'Nous sommes au 21 rue Gambetta, 71000 Mâcon, dans le centre-ville. Les trois espaces Solution Phone, Solution Accessoires et Solution Informatique sont réunis à cette adresse.',
        contact:'Vous pouvez appeler la boutique au 03 85 33 06 89 ou écrire directement sur WhatsApp au 07 83 92 18 84.',
        appointment:'Vous pouvez venir sans rendez-vous. Pour éviter un déplacement inutile, je vous conseille de vérifier la disponibilité de la pièce par WhatsApp si vous connaissez déjà le modèle et la panne.',
        warranty:'Les réparations standard sont garanties 6 mois sur la pièce et la main-d’œuvre réalisées. Les smartphones reconditionnés et les accessoires électriques bénéficient aussi d’une garantie commerciale de 12 mois, sans réduire la garantie légale de conformité de 2 ans. Les conditions précises figurent dans les CGV et sur les documents remis.',
        payment:'La boutique accepte la carte bancaire (y compris sans contact), Apple Pay, le virement et les espèces (1 000 € maximum, limite légale). Les chèques sont également acceptés. Le paiement en plusieurs fois n’est pas proposé. Une commande spéciale de pièce peut nécessiter un acompte de 30 % du devis avant commande.',
        turnaround:'Nous ne promettons pas un délai avant d’avoir identifié la panne et vérifié la pièce. Les réparations standard d’iPhone (écran, batterie) sont généralement réalisées en moins d’une heure si la pièce est en stock. Les recherches de panne complexes et la micro-soudure demandent plus de temps.',
        dataPrivacy:'L’équipe est tenue au secret professionnel. Aucune donnée personnelle n’est collectée, copiée ou transmise, sauf si vous le demandez expressément pour une sauvegarde, un transfert ou le diagnostic.',
        backup:'Sauvegardez vos photos, contacts et documents avant de déposer l’appareil lorsque c’est possible. Une intervention peut toujours comporter un risque pour les données, surtout si l’appareil ne démarre plus ou si la carte mère est touchée.',
        quoteProcess:'Le diagnostic et le devis sont gratuits et sans engagement. Le prix est annoncé avant l’intervention et rien n’est réparé sans votre accord. L’assistant de Sébastien peut afficher les tarifs enregistrés pour les écrans et batteries iPhone ; pour les autres cas, l’équipe confirme le devis après identification du modèle et de la panne.',
        parts:'La qualité et l’origine de la pièce sont expliquées avant la réparation. Selon le modèle, plusieurs options peuvent être proposées. L’équipe ne présente jamais une pièce comme originale si elle ne l’est pas.',
        reconditionedInfo:'Les smartphones reconditionnés visibles sur le site correspondent au stock de la boutique. Ils sont contrôlés avant la vente, garantis 12 mois et peuvent être configurés avec transfert de données sur place.',
        invoice:'Une facture détaillée est remise après l’intervention. Elle précise la réparation effectuée et sert de justificatif pour la garantie.',
        manufacturerWarranty:'Si l’appareil est encore sous garantie du fabricant ou du vendeur, vérifiez d’abord si une prise en charge gratuite est possible. Une intervention par un réparateur indépendant peut interrompre cette garantie constructeur.',
        cancellation:'Vous pouvez annuler tant que l’intervention n’a pas commencé. Une fois le travail commencé, les pièces commandées et le travail réalisé restent dus. Une pièce commandée spécialement peut avoir nécessité un acompte.',
        bring:'Apportez l’appareil et, pour un problème de charge ou d’ordinateur, son chargeur habituel. Si possible, faites une sauvegarde et notez le modèle exact. L’équipe vous demandera uniquement les accès nécessaires au test, avec votre accord.',
        boardRepair:'Une intervention sur carte mère ou en micro-soudure nécessite un diagnostic humain et comporte un risque inhérent, surtout sur un appareil oxydé. L’assistant ne promet ni résultat ni délai : l’équipe explique les risques avant votre accord.'
      };
      current={text,category:'business',issueLabel:'Information boutique',model:'Solution Phone'};
      $('#start-view').style.display='none';$('#answer-view').classList.remove('show');$('#chat-view').classList.add('show');$('#chat-thread').innerHTML='';$('#chat-quick').innerHTML='';
      addMessage('user',text);$('#device-state').textContent='Information boutique';
      botReply(answers[type],[
        {label:'Obtenir un tarif',value:'price',kind:'openPrice'},
        {label:'Écrire sur WhatsApp',value:'whatsapp',kind:'directWhatsApp'},
        {label:'Faire un devis par e-mail',value:'mail',kind:'directMail'}
      ]);
    }
    async function runDiagnostic(text){
      $('#advanced-help').open=true;
      track('diagnostic_demarre',{intent:parseRequest(text).intent||'unknown'});
      const educational=normalize(text);
      if(/horaire|heure.*ouvert|ouvert|ouverte|ferme|fermee|fermeture|ouvre|journee continue/.test(educational)&&!/fuseau(?:x)? horaire|reglage horaire|heure du telephone|date et heure/.test(educational)){startBusinessAnswer(text,'hours');return}
      if(/adresse|ou etes|ou se trouve|itineraire|venir.*boutique/.test(educational)){startBusinessAnswer(text,'address');return}
      if(/(?:quel|votre|le|un).*numero|numero.*(?:boutique|telephone|whatsapp)|comment.*(?:appeler|contacter)|(?:appeler|contacter).*boutique|contact(?:er)?\s+(?:l equipe|la boutique|solution phone)/.test(educational)){startBusinessAnswer(text,'contact');return}
      if(/rendez[- ]?vous|sans rdv|venir sans/.test(educational)){startBusinessAnswer(text,'appointment');return}
      if(/garantie.*(?:apple|samsung|constructeur|fabricant|vendeur)|encore sous garantie/.test(educational)){startBusinessAnswer(text,'manufacturerWarranty');return}
      if(/(?:garanti|garantie|test|controle|fiable|condition).{0,35}recondition|recondition.{0,35}(?:garanti|garantie|test|controle|fiable|condition)/.test(educational)){startBusinessAnswer(text,'reconditionedInfo');return}
      if(/garantie|garanti combien/.test(educational)){startBusinessAnswer(text,'warranty');return}
      if(/moyen.*paiement|payer|paiement|regler|apple pay|google pay|especes|sans contact|acompte|carte bleue|\bcb\b|plusieurs fois|3 fois/.test(educational)){startBusinessAnswer(text,'payment');return}
      if(/combien de temps|quel delai|duree.*reparation|reparation.*duree|repare.*journee/.test(educational)){startBusinessAnswer(text,'turnaround');return}
      if(/donnee.*(?:copie|confident|prive)|confidentialite|acces.*photo|regard.*photo|fichier.*personnel/.test(educational)){startBusinessAnswer(text,'dataPrivacy');return}
      if(/sauvegard|perdre.*donnee|effac.*donnee|photo.*perd|donnee.*perd/.test(educational)){startBusinessAnswer(text,'backup');return}
      if(/comment.*(?:devis|diagnostic)|devis.*(?:gratuit|engage|avant)|prix.*avant|diagnostic.*gratuit|accord.*repar|repar.*sans.*accord/.test(educational)){startBusinessAnswer(text,'quoteProcess');return}
      if(/piece.*(?:origine|original|compatible|qualite)|origine.*piece/.test(educational)){startBusinessAnswer(text,'parts');return}
      if(/facture|justificatif/.test(educational)){startBusinessAnswer(text,'invoice');return}
      if(/annul.*repar|changer d.avis|annul.*intervention/.test(educational)){startBusinessAnswer(text,'cancellation');return}
      if(/quoi apporter|que dois.*apporter|venir avec|apporter.*chargeur/.test(educational)){startBusinessAnswer(text,'bring');return}
      if(/carte mere|micro.?soudure|microsoudure/.test(educational)){startBusinessAnswer(text,'boardRepair');return}
      if(/qualirepar|bonus reparation/.test(educational)){startEducation(text,'qualirepar');return}
      if(/(?:qualite.*ecran|ecran.*(?:compatible|service pack)|service pack.*ecran)/.test(educational)&&/(?:android|samsung|xiaomi|redmi|honor|huawei|pixel|oppo|realme|motorola|service pack)/.test(educational)){startEducation(text,'androidScreen');return}
      if(/qualite.*ecran|ltps|hard oled|soft oled|relife|4 qualite.*ecran/.test(educational)){startEducation(text,'iphoneScreen');return}
      if(/(?:qualite.*batterie|batterie.*(?:compatible|originale|origine)|(?:compatible|originale|origine).*batterie)/.test(educational)&&!/(?:prix|tarif|combien|coute|euros?)/.test(educational)){startEducation(text,'battery');return}
      conversationText=text;conversationParsed=parseRequest(text);flowData={};
      if(conversationParsed.intent==='reconditioned'){
        const between=educational.match(/(?:entre|de)\s*(\d{2,4})\s*(?:€|euros?)?\s*(?:a|et|-)\s*(\d{2,4})/);
        const under=educational.match(/(?:moins de|maximum|max|budget(?: de)?|jusqu.?a)\s*(\d{2,4})/);
        if(between)flowData.budget={min:Number(between[1]),max:Number(between[2]),label:between[1]+' à '+between[2]+' €'};
        else if(under)flowData.budget={min:0,max:Number(under[1]),label:'Moins de '+under[1]+' €'};
        if(conversationParsed.brand==='Apple')flowData.platform='iphone';
        else if(conversationParsed.brand)flowData.platform='android';
      }
      if(conversationParsed.intent==='accessory'&&conversationParsed.detectedModel)flowData.device=conversationParsed.detectedModel;
      if(conversationParsed.intent==='transfer'){
        const iphonePosition=educational.search(/\b(?:iphone|ios)\b/);
        const androidPosition=educational.search(/\b(?:android|samsung|galaxy|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola)\b/);
        if(iphonePosition>=0&&androidPosition>=0){
          if(iphonePosition<androidPosition){flowData.source='iPhone';flowData.target='Android'}
          else{flowData.source='Android';flowData.target='iPhone'}
        }else if(/\b(?:iphone|ios)\b.{0,35}\b(?:vers|sur|pour)\b.{0,20}\b(?:iphone|ios)\b/.test(educational)){
          flowData.source='iPhone';flowData.target='iPhone';
        }else if(/\b(?:android|samsung|galaxy|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola)\b.{0,35}\b(?:vers|sur|pour)\b.{0,20}\b(?:android|samsung|galaxy|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola)\b/.test(educational)){
          flowData.source='Android';flowData.target='Android';
        }
        if(/\bwhatsapp\b/.test(educational))flowData.transferType='WhatsApp';
        else if(/\bphotos?\b/.test(educational)&&/\bcontacts?\b/.test(educational))flowData.transferType='Photos et contacts';
        else if(/\b(configur|parametr)\w*\b/.test(educational))flowData.transferType='Configuration complète';
        else if(/\b(tout|complet|donnees?|contenu)\b/.test(educational))flowData.transferType='Transfert complet';
      }
      if(conversationParsed.intent==='computer'){
        const computerText=normalize(text);
        if(/macbook/.test(computerText))flowData.computerType='MacBook';
        else if(/imac/.test(computerText))flowData.computerType='iMac';
        else if(/pc portable|ordinateur portable|laptop/.test(computerText))flowData.computerType='PC portable';
        else if(/pc fixe|ordinateur fixe|tour/.test(computerText))flowData.computerType='PC fixe';
        if(conversationParsed.issue==='screen')flowData.specialistDetail='Écran d’ordinateur cassé ou défaillant';
        else if(/virus|malware|logiciel malveillant|publicite|pub intempestive/.test(computerText))flowData.specialistDetail='Nettoyage virus PC';
        else if(/disque dur|\bssd\b|reinstall.*windows|windows.*reinstall/.test(computerText))flowData.specialistDetail='Changement disque dur et réinstallation Windows';
        else if(/batterie|autonomie|ne tient plus la charge/.test(computerText))flowData.specialistDetail='Batterie PC portable ou Mac';
        else if(/recuper.*donnee|fichier.*perdu|donnee.*perdu/.test(computerText))flowData.specialistDetail='Récupération de données';
        else if(/ne demarre|ne s.?allume|aucun voyant/.test(computerText))flowData.specialistDetail='Ne démarre plus';
      }
      if(conversationParsed.intent==='scooter'){
        const scooterModel=educational.match(/\b(xiaomi|ninebot|segway|dualtron|wispeed)\b(?:\s+([a-z0-9-]{1,12}))?/);
        if(scooterModel)flowData.computerType=(scooterModel[1]+' '+(scooterModel[2]||'')).trim().replace(/\b\w/g,c=>c.toUpperCase());
        if(/pneu|crev|chambre a air/.test(educational))flowData.specialistDetail='Pneu ou crevaison';
        else if(/frein|freinage|plaquette|disque/.test(educational))flowData.specialistDetail='Problème de freinage';
        else if(/autonomie|batterie|charge/.test(educational))flowData.specialistDetail='Manque d’autonomie';
        else if(/ne demarre|ne s.?allume|code erreur/.test(educational))flowData.specialistDetail='Ne démarre plus';
      }
      if(conversationParsed.intent==='console'){
        const consoleModel=educational.match(/\b(ps\s?[345](?:\s?pro)?|playstation\s?[345]|xbox(?:\s+(?:one|series\s?[xs]))?|switch(?:\s+oled)?|nintendo switch)\b/);
        if(consoleModel)flowData.computerType=consoleModel[1].replace(/\bps\s?/,'PS').replace(/\b\w/g,c=>c.toUpperCase());
        if(/hdmi|pas d.image|aucune image/.test(educational))flowData.specialistDetail='Problème de port HDMI';
        else if(/chauffe|surchauffe|ventilateur|s.?eteint/.test(educational))flowData.specialistDetail='Console qui surchauffe';
        else if(/ne demarre|ne s.?allume|aucun voyant/.test(educational))flowData.specialistDetail='Ne démarre plus';
        else if(/lecteur|disque|manette|joystick/.test(educational))flowData.specialistDetail='Lecteur ou manette';
      }
      current=conversationParsed;
      $('#start-view').style.display='none';$('#answer-view').classList.remove('show');$('#chat-view').classList.add('show');$('#chat-thread').innerHTML='';$('#chat-quick').innerHTML='';
      addMessage('user',text);$('#device-state').textContent='Conversation active';
      const localIssues=['screen','battery','charge','camera','audio','buttons','back','water','power','faceid','network','overheating','slow','vibration','androidVirus','board'];
      const asksForPrice=/\b(prix|tarif|combien|cout|coute|devis)\b/.test(educational);
      const validatedServicePrice=conversationParsed.intent==='computer'&&asksForPrice;
      const validatedAndroidBatteryPrice=conversationParsed.intent==='repair'&&conversationParsed.brand&&conversationParsed.brand!=='Apple'&&conversationParsed.issue==='battery'&&asksForPrice;
      const knowledgeFirst=/\b(baseband|micro[ -]?soudure|carte mere|tablette|ipad|galaxy tab|hdmi|haut parleur|son.{0,45}faible|vaut.*coup|rentable|reparer ou (?:changer|remplacer)|quelles reparations|quelles pieces.*changez)\b/.test(educational)
        || (/\bbatterie\b/.test(educational)&&/\b(ti reconnue|qualite|compatible.*originale|originale.*compatible|trois prix|3 prix)\b/.test(educational)&&/\b(iphone|apple)\b/.test(educational))
        || (/\b(ps[345]|playstation|xbox|switch|console)\b/.test(educational)&&/\b(chauffe|surchauffe|ventilateur|s eteint)\b/.test(educational));
      const isDirectAppleCard=conversationParsed.intent==='repair'&&conversationParsed.brand==='Apple'&&Boolean(conversationParsed.key)&&(conversationParsed.issue==='screen'||conversationParsed.issue==='battery');
      const shouldUseBrain=!isDirectAppleCard||knowledgeFirst;
      if(shouldUseBrain){
        const handled=await consultJasonMemory(text,conversationParsed);if(handled)return;
      }
      advanceConversation();
    }
    function advanceConversation(){
      const p=conversationParsed;
      if(!p.intent){
        waitingFor='intent';botReply('Je peux vous aider. Que souhaitez-vous faire ?',[
          {label:'Faire réparer',value:'réparation téléphone',kind:'intent'},{label:'Acheter un smartphone',value:'acheter smartphone',kind:'intent'},{label:'Accessoire',value:'accessoire téléphone',kind:'intent'},{label:'Informatique',value:'service informatique',kind:'intent'},{label:'Trottinette',value:'réparation trottinette',kind:'intent'},{label:'Console',value:'réparation console',kind:'intent'}]);return;
      }
      if(p.intent==='reconditioned'){
        if(!flowData.budget){
          waitingFor='budget';botReply('Quel budget souhaitez-vous respecter ?',[
            {label:'Moins de 300 €',value:'0-300',kind:'budget'},{label:'300 à 500 €',value:'300-500',kind:'budget'},{label:'500 à 800 €',value:'500-800',kind:'budget'},{label:'Plus de 800 €',value:'800-99999',kind:'budget'}]);return;
        }
        if(!flowData.platform){
          waitingFor='platform';botReply('Vous préférez un iPhone ou un Android ?',[
            {label:'iPhone',value:'iphone',kind:'platform'},{label:'Android',value:'android',kind:'platform'},{label:'Peu importe',value:'all',kind:'platform'}]);return;
        }
        finishConversation();return;
      }
      if(p.intent==='accessory'){
        if(!flowData.device){
          waitingFor='device';$('#chat-input').placeholder='Ex. : iPhone 15, Galaxy S23…';botReply('Pour quel modèle de téléphone cherchez-vous un accessoire ?');return;
        }
        if(!flowData.accessory){
          waitingFor='accessoryType';botReply('De quel accessoire avez-vous besoin ?',[
            {label:'Coque',value:'Coque',kind:'accessoryType'},{label:'Protection écran',value:'Protection écran',kind:'accessoryType'},{label:'Chargeur',value:'Chargeur',kind:'accessoryType'},{label:'Câble',value:'Câble',kind:'accessoryType'},{label:'Autre',value:'Autre accessoire',kind:'accessoryType'}]);return;
        }
        finishConversation();return;
      }
      if(p.intent==='transfer'){
        if(!flowData.source){
          waitingFor='source';botReply('Votre ancien téléphone est un iPhone ou un Android ?',[
            {label:'iPhone',value:'iPhone',kind:'source'},{label:'Android',value:'Android',kind:'source'}]);return;
        }
        if(!flowData.target){
          waitingFor='target';botReply('Et votre nouveau téléphone ?',[
            {label:'iPhone',value:'iPhone',kind:'target'},{label:'Android',value:'Android',kind:'target'}]);return;
        }
        if(!flowData.transferType){
          waitingFor='transferType';botReply('Que souhaitez-vous récupérer ?',[
            {label:'Tout transférer',value:'Transfert complet',kind:'transferType'},{label:'Photos et contacts',value:'Photos et contacts',kind:'transferType'},{label:'WhatsApp',value:'WhatsApp',kind:'transferType'},{label:'Configuration complète',value:'Configuration complète',kind:'transferType'}]);return;
        }
        finishConversation();return;
      }
      if(['computer','scooter','console'].includes(p.intent)){
        if(!flowData.specialistDetail){
          waitingFor='specialistDetail';
          const options=p.intent==='computer'?[{label:'Nettoyage virus',value:'Nettoyage virus PC'},{label:'Disque dur + Windows',value:'Changement disque dur et réinstallation Windows'},{label:'Batterie portable ou Mac',value:'Batterie PC portable ou Mac'},{label:'Écran cassé',value:'Écran cassé'},{label:'Ne démarre plus',value:'Ne démarre plus'},{label:'Récupérer mes données',value:'Récupération de données'}]:p.intent==='scooter'?[{label:'Ne démarre plus',value:'Ne démarre plus'},{label:'Pneu ou crevaison',value:'Pneu ou crevaison'},{label:'Freinage',value:'Problème de freinage'},{label:'Manque d’autonomie',value:'Manque d’autonomie'}]:[{label:'Port HDMI',value:'Problème de port HDMI'},{label:'Surchauffe',value:'Console qui surchauffe'},{label:'Ne démarre plus',value:'Ne démarre plus'},{label:'Lecteur ou manette',value:'Lecteur ou manette'}];
          botReply(p.intent==='computer'?'Quel est le besoin informatique ?':p.intent==='scooter'?'Quel est le problème de la trottinette ?':'Quel est le problème de la console ?',options.map(x=>({...x,kind:'specialistDetail'})));return;
        }
        finishConversation();return;
      }
      if(p.issue==='charge'||p.issue==='water'||p.issue==='androidVirus'){finishConversation();return}
      if(!p.brand){
        waitingFor='brand';botReply('D’accord. De quelle marque est votre téléphone ?',[
          {label:'Apple',value:'Apple',kind:'brand'},{label:'Samsung',value:'Samsung',kind:'brand'},{label:'Xiaomi',value:'Xiaomi',kind:'brand'},{label:'Honor',value:'Honor',kind:'brand'},{label:'Autre marque',value:'autre marque',kind:'brand'}]);return;
      }
      if(!hasGenericModel(p)){
        waitingFor='model';$('#chat-input').placeholder='Ex. : S23 Ultra, iPhone 15…';botReply('Très bien. Quel est le modèle exact ?');return;
      }
      if(!p.issue){
        waitingFor='issue';botReply('Merci. Qu’est-ce qui ne fonctionne plus ?',[
          {label:'Écran cassé',value:'écran cassé',kind:'issue'},{label:'Batterie',value:'batterie',kind:'issue'},{label:'Ne charge plus',value:'connecteur charge',kind:'issue'},{label:'Caméra',value:'caméra',kind:'issue'}]);return;
      }
      if(p.brand==='Apple'&&p.key&&(p.issue==='screen'||p.issue==='battery')){finishConversation();return}
      if(p.brand&&p.brand!=='Apple'&&p.issue==='battery'){finishConversation();return}
      if(!p.symptom&&p.issue==='screen'){
        waitingFor='symptom';botReply('L’écran affiche-t-il encore une image ?',[
          {label:'Oui, l’image est visible',value:'Image visible',kind:'symptom'},{label:'Écran noir ou avec des taches',value:'Écran noir ou taches',kind:'symptom'},{label:'Je ne sais pas',value:'État à vérifier',kind:'symptom'}]);return;
      }
      if(!p.symptom&&p.issue==='battery'){
        waitingFor='symptom';botReply('Quel est le problème principal avec la batterie ?',[
          {label:'Elle se décharge vite',value:'Autonomie faible',kind:'symptom'},{label:'Le téléphone s’éteint',value:'Extinctions',kind:'symptom'},{label:'Elle semble gonflée',value:'Batterie possiblement gonflée',kind:'symptom'}]);return;
      }
      if(!p.symptom&&p.issue==='power'){
        waitingFor='symptom';botReply('Le téléphone s’éteint-il également lorsqu’il est branché au chargeur ?',[
          {label:'Oui, même branché',value:'S’éteint même branché',kind:'symptom'},{label:'Non, il reste allumé branché',value:'Reste allumé quand il est branché',kind:'symptom'},{label:'Il redémarre sur la pomme',value:'Boucle de redémarrage sur le logo Apple',kind:'symptom'}]);return;
      }
      finishConversation();
    }
    function handleConversationAnswer(value,label,kind){
      if(kind==='brainWhatsApp'){openTrackedWhatsApp(lastBrainWhatsApp||waLink(),'assistant_quick_reply');return}
      if(kind==='brainMail'){openMail();return}
      if(kind==='openPrice'){openQuickPrice();return}
      if(kind==='directWhatsApp'){openTrackedWhatsApp(waLink(),'assistant_direct_reply');return}
      if(kind==='directMail'){openMail();return}
      addMessage('user',label||value);$('#chat-quick').innerHTML='';
      if(kind==='education'){replyEducation(value);return}
      if(['brand','model','issue','symptom'].includes(kind))flowData.localQuestions=(flowData.localQuestions||0)+1;
      if(kind==='brainPrecision'){waitingFor='brainFreeText';$('#chat-input').placeholder='Ajoutez un détail utile…';botReply('Dites-moi ce qui peut aider : modèle, choc, liquide, message affiché ou réparation récente.');return}
      if(kind==='brainDiagnostic'){conversationText+=' '+value;conversationParsed=parseRequest(conversationText);current=conversationParsed;consultJasonMemory(value,conversationParsed);return}
      if(kind==='brainQuestion'){conversationText+=' '+value;consultJasonMemory(conversationText,parseRequest(conversationText));return}
      if(kind==='intent'){conversationText+=' '+value;conversationParsed=parseRequest(conversationText);current=conversationParsed}
      else if(kind==='budget'){
        const parts=String(value).split('-').map(Number);flowData.budget={min:parts[0]||0,max:parts[1]||99999,label:label||value};
      }
      else if(kind==='platform'){flowData.platform=value}
      else if(kind==='device'){flowData.device=value}
      else if(kind==='accessoryType'){flowData.accessory=value}
      else if(kind==='source'){flowData.source=value}
      else if(kind==='target'){flowData.target=value}
      else if(kind==='transferType'){flowData.transferType=value}
      else if(kind==='specialistDetail'){flowData.specialistDetail=value}
      else if(kind==='computerType'){flowData.computerType=value}
      else if(kind==='symptom'){conversationParsed={...conversationParsed,symptom:value};current=conversationParsed}
      else if(kind==='brainFreeText'){conversationText+=' '+value;conversationParsed=parseRequest(conversationText);current=conversationParsed;consultJasonMemory(conversationText,conversationParsed);return}
      else{conversationText+=' '+value;conversationParsed=parseRequest(conversationText);current=conversationParsed}
      $('#chat-input').placeholder='Écrivez votre réponse…';
      const directPriceReady=conversationParsed?.brand==='Apple'&&conversationParsed?.key&&['screen','battery'].includes(conversationParsed?.issue);
      const localQuestionLimit=['screen','battery','power'].includes(conversationParsed?.issue)?4:3;
      if(conversationParsed?.intent==='repair'&&flowData.localQuestions>=localQuestionLimit&&!directPriceReady){finishConversation();return}
      advanceConversation();
    }
    function finishConversation(){
      waitingFor=null;conversationParsed={...conversationParsed,flow:{...flowData}};current=conversationParsed;
      const specialist=['computer','scooter','console'].includes(conversationParsed.intent);
      const directRepairPrice=conversationParsed.intent==='repair'&&((conversationParsed.brand==='Apple'&&conversationParsed.key&&['screen','battery'].includes(conversationParsed.issue))||(conversationParsed.brand&&conversationParsed.brand!=='Apple'&&conversationParsed.issue==='battery'));
      const finalText=conversationParsed.intent==='reconditioned'?'Parfait. Je regarde les téléphones réellement disponibles.':directRepairPrice?'Parfait. Je vérifie le tarif enregistré par l’atelier.':conversationParsed.issue==='charge'?'Parfait. Je commence par l’intervention la plus simple et la moins coûteuse.':conversationParsed.intent==='repair'?'Parfait. Je prépare une première orientation sans vous annoncer une pièce au hasard.':specialist?'Parfait. Je prépare une première orientation, puis mes collègues pourront confirmer le devis.':'Parfait. Je prépare votre demande pour l’équipe Solution Phone.';
      botReply(finalText);setTimeout(()=>{$('#chat-view').classList.remove('show');launchLookup(conversationParsed)},1250);
    }
    function launchLookup(parsed){
      current=parsed;$('#loading-view').classList.add('show');$('#device-state').textContent='Analyse en cours';
      const hasLivePrice=parsed.brand==='Apple'&&(parsed.issue==='screen'||parsed.issue==='battery');
      const labels=parsed.intent==='reconditioned'?['Lecture du stock disponible','Filtrage selon votre budget','Sélection des meilleurs choix']:hasLivePrice?['Identification du modèle','Recherche du tarif atelier','Vérification QualiRépar']:['Identification du besoin','Analyse de la demande','Préparation du devis'];
      let i=0;$('#loading-label').textContent=labels[0];
      const timer=setInterval(()=>{$('#loading-label').textContent=labels[++i%labels.length]},420);
      setTimeout(()=>{clearInterval(timer);$('#loading-view').classList.remove('show');renderAnswer(parsed);$('#device-state').textContent=parsed.intent==='reconditioned'?'Stock consulté':parsed.key?'Tarif trouvé':parsed.detectedModel?'Modèle reconnu':'Demande prête'},1350);
    }
    function renderAnswer(p){
      const answer=$('#answer-view'),issueLabel={screen:'Écran cassé',battery:'Batterie',charge:'Connecteur de charge',camera:'Caméra',audio:'Audio',buttons:'Boutons',back:'Vitre arrière',water:'Oxydation',power:'Extinctions répétées',faceid:'Face ID',network:'Réseau ou Wi-Fi',overheating:'Surchauffe',slow:'Lenteur ou stockage',vibration:'Vibreur',androidVirus:'Nettoyage virus Android',board:'Carte mère ou micro-soudure'}[p.issue]||'Diagnostic';
      if(p.intent==='reconditioned'){renderReconditioned(p);answer.classList.add('show');return}
      if(p.intent==='accessory'||p.intent==='transfer'||['computer','scooter','console'].includes(p.intent)){renderService(p);answer.classList.add('show');return}
      if(p.intent==='repair'&&p.issue==='charge'){renderChargeConnector(p);answer.classList.add('show');return}
      if(p.intent==='repair'&&p.issue==='back'){renderBackGlass(p);answer.classList.add('show');return}
      if(p.intent==='repair'&&p.issue==='androidVirus'){renderAndroidVirus(p);answer.classList.add('show');return}
      if(p.intent==='repair'&&REPAIR_EXPERTISE[p.issue]){renderExpertRepair(p);answer.classList.add('show');return}
      if(p.brand&&p.brand!=='Apple'&&p.issue==='battery'){
        renderAndroidBattery(p);answer.classList.add('show');return;
      }
      if(p.brand==='Apple'&&p.key&&(p.issue==='screen'||p.issue==='battery')){
        if(window.SolutionPhoneQuote?.choose&&!document.documentElement.classList.contains('evan-embed')){
          window.SolutionPhoneQuote.choose(iphoneLabel(p.key),p.issue);return;
        }
        const source=p.issue==='screen'?screens:batteries,meta=p.issue==='screen'?QUALITES:QUALITES_BAT;
        const livePrice=(p.issue==='screen'?liveScreenModels:liveBatteryModels).has(p.key);
        const prices=source[p.key]||[];
        let qualities=meta.map((q,i)=>({...q,price:Number(prices[i])||0})).filter(q=>q.price>0);
        if(p.issue==='screen'){
          const economy=qualities.filter(q=>q.id==='hd'||q.id==='ltps').sort((a,b)=>a.price-b.price)[0];
          qualities=[...(economy?[{...economy,id:'eco',name:'Compatible HD/LTPS',desc:'L’essentiel, au meilleur prix'}]:[]),...qualities.filter(q=>q.id!=='hd'&&q.id!=='ltps')];
        }
        if(qualities.length){
          current={...p,issueLabel,model:'iPhone '+p.key.replace(/\b\w/g,c=>c.toUpperCase()),qualities,selected:qualities.length>1?qualities[1]:qualities[0],priceSource:livePrice?'atelier_connecte':'estimation_secours'};
          answer.innerHTML=`
            <div class="answer-head"><small>${livePrice?'Résultat · tarifs atelier connectés':'Estimation disponible · connexion atelier indisponible'}</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
            <h3>${issueLabel}<br>${current.model}</h3>
            <p class="answer-intro">J’ai trouvé ${qualities.length} qualité${qualities.length>1?'s':''} de pièce. ${livePrice?'Nos prix à jour, pièce et main-d’œuvre comprises, confirmés avant l’intervention.':'Tarif indicatif, à confirmer par l’équipe.'}</p>
            ${p.issue==='battery'&&p.safetyAlert?`<div class="recap"><div><small>Consigne de sécurité</small><b>Batterie possiblement gonflée ou anormalement chaude : ne rechargez plus le téléphone et apportez-le en atelier.</b></div><strong>Stop</strong></div>`:''}
            ${p.issue==='screen'?`<details class="screen-explainer"><summary>Le conseil de Sébastien · quelle qualité choisir ?</summary><p>Compatible HD/LTPS — écran LCD compatible (technologie des écrans classiques), le choix économique.
LTPS Prime — écran LCD de gamme supérieure, plus lumineux.
Hard OLED — écran OLED rigide : noirs profonds, généralement moins cher que le Soft OLED, mais moins tolérant à la flexion et aux chocs. Prix et disponibilité à confirmer selon le modèle.
Soft OLED — écran OLED souple : noirs profonds, rendu proche de l’origine.
ReLife — dalle Apple d’origine reconditionnée avec une vitre neuve.

Budget : Compatible · Équilibre : LTPS Prime · Confort : Soft OLED · Fidélité : ReLife.</p></details>`:''}
            ${p.issue==='battery'?`<details class="screen-explainer"><summary>Le conseil de Sébastien · quelle batterie choisir ?</summary><p>Compatible — l’option économique.
Compatible reconnue — batterie compatible sélectionnée pour être reconnue par l’iPhone sur les modèles concernés.
Originale — pièce d’origine, selon disponibilité.

Lorsqu’il existe plusieurs versions pour votre modèle, vous gardez le choix. La compatibilité, le prix et l’affichage de l’état de santé sont confirmés avant l’intervention.</p></details>`:''}
            <div class="qualities">${qualities.map(q=>`<button class="quality ${q.id===current.selected.id?'selected':''}" data-id="${q.id}"><div><b>${q.name}</b><span>${q.desc}</span></div><strong>${q.price} €</strong></button>`).join('')}</div>
            <div class="recap${livePrice?' bonus-eligible':''}"><div><small>${livePrice?'Prix TTC après avantage Solution Phone':'Estimation TTC à confirmer'}</small><b>${livePrice?'25 € déjà déduits du tarif affiché':'Confirmation nécessaire par WhatsApp ou e-mail'}</b></div><strong id="recap-price">${current.selected.price} €</strong></div>
            ${p.issue==='screen'?protectionOffersHtml():''}
            <div class="actions"><a class="action wa" id="result-wa" target="_blank" rel="noopener">Confirmer sur WhatsApp</a><button class="action mail" onclick="openMail()">Recevoir par e-mail</button></div>
            <p class="assurance">${livePrice?'Prix à jour, pièce et main-d’œuvre comprises':'Tarif indicatif, à confirmer'} · Garantie 6 mois · Facture détaillée · Rien n’est effectué sans votre accord. Le tarif final reste soumis au diagnostic visuel et à la disponibilité de la pièce.</p>`;
          answer.querySelectorAll('.quality').forEach(btn=>btn.addEventListener('click',()=>selectQuality(btn.dataset.id)));
          updateActions();syncContextCta();
        }else renderUnknown(p);
      }else renderUnknown(p);
      answer.classList.add('show');
    }
    function renderChargeConnector(p){
      const answer=$('#answer-view'),model=p.detectedModel||(p.brand==='Apple'&&p.key?'iPhone '+p.key.replace(/\b\w/g,c=>c.toUpperCase()):null)||p.brand||'Modèle à confirmer';
      current={...p,issueLabel:'Connecteur de charge',model,selected:{name:'Contrôle et nettoyage du connecteur',price:10}};
      answer.innerHTML=`<div class="answer-head"><small>Diagnostic honnête · intervention minimale</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
        <h3>On commence par<br>le plus simple.</h3>
        <p class="answer-intro">Lorsqu’un téléphone charge mal, de la poussière compactée dans le connecteur est très souvent en cause. D’après notre expérience en atelier, un nettoyage suffit dans environ 9 cas sur 10.</p>
        <div class="recap"><div><small>Premier contrôle conseillé</small><b>Nettoyage du connecteur</b></div><strong>10 €</strong></div>
        <div class="qualities">
          <div class="quality selected"><div><b>Nettoyage professionnel</b><span>Contrôle de la charge après nettoyage</span></div><strong>10 €</strong></div>
          <div class="quality"><div><b>Remplacement du connecteur</b><span>Seulement si le nettoyage ne suffit pas · selon le modèle</span></div><strong>dès 25 €</strong></div>
        </div>
        <p class="answer-intro">Nous ne remplaçons la pièce que si c’est réellement nécessaire. Si vous souhaitez un tarif précis, contactez-nous par WhatsApp ou par e-mail.</p>
        <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div>
        <p class="assurance">Contrôle avant remplacement · Prix annoncé avant intervention · Aucun engagement</p>`;
      syncContextCta();
    }
    function renderBackGlass(p){
      const answer=$('#answer-view');
      const isIphone=p.brand==='Apple';
      const model=p.detectedModel||(isIphone&&p.key?'iPhone '+p.key.replace(/\b\w/g,c=>c.toUpperCase()):null)||p.brand||(isIphone?'iPhone':'Smartphone Android');
      const basePrice=isIphone?40:35;
      current={...p,issueLabel:'Vitre arrière',model,selected:{name:'Remplacement vitre arrière',priceLabel:`à partir de ${basePrice} €`}};
      answer.innerHTML=`<div class="answer-head"><small>Estimation atelier · pièce et main-d’œuvre</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
        <h3>Vitre arrière<br>${escapeHtml(model)}</h3>
        <p class="answer-intro">Le remplacement de la vitre arrière est proposé <b>à partir de ${basePrice} €</b>, pièce et main-d’œuvre incluses${isIphone?' sur iPhone':' sur Samsung et les autres smartphones Android'}.</p>
        <div class="recap"><div><small>Tarif indicatif</small><b>Remplacement de la vitre arrière</b></div><strong>dès ${basePrice} €</strong></div>
        <p class="answer-intro">Le prix exact dépend du modèle, de la matière du dos, de l’état du châssis et des lentilles photo. Si vous souhaitez un tarif précis, contactez-nous par WhatsApp ou par e-mail.</p>
        <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div>
        <p class="assurance">Pièce et main-d’œuvre incluses · Prix confirmé avant intervention · Aucun engagement</p>`;
      syncContextCta();
    }
    function renderAndroidVirus(p){
      const answer=$('#answer-view'),model=p.detectedModel||p.brand||'Smartphone Android';
      current={...p,issueLabel:'Nettoyage virus Android',model,selected:{name:'Nettoyage virus Android',price:10}};
      answer.innerHTML=`<div class="answer-head"><small>Service atelier · tarif clair</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
        <h3>Nettoyage virus<br>${escapeHtml(model)}</h3>
        <p class="answer-intro">Publicités intempestives, applications qui s’ouvrent seules ou téléphone ralenti : nous contrôlons et nettoyons votre smartphone Android pour <b>10 €</b>.</p>
        <div class="recap"><div><small>Tarif atelier</small><b>Contrôle et nettoyage des applications indésirables</b></div><strong>10 €</strong></div>
        <p class="answer-intro">Évitez de saisir vos mots de passe et ne payez rien à la suite d’un message d’alerte. Nous privilégions le nettoyage avant toute réinitialisation afin de préserver vos données.</p>
        <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div>
        <p class="assurance">Tarif annoncé · Données préservées autant que possible · Aucun effacement sans votre accord</p>`;
      syncContextCta();
    }
    function renderExpertRepair(p){
      const answer=$('#answer-view'),rule=REPAIR_EXPERTISE[p.issue],model=p.detectedModel||(p.brand==='Apple'&&p.key?'iPhone '+p.key.replace(/\b\w/g,c=>c.toUpperCase()):null)||p.brand||'Modèle à confirmer';
      current={...p,issueLabel:rule.title,model,selected:null};
      answer.innerHTML=`<div class="answer-head"><small>Conseil technique · sans diagnostic hasardeux</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
        <div class="unknown"><h3>${escapeHtml(rule.title)}<br>${escapeHtml(model)}</h3>
        <p class="answer-intro">${escapeHtml(rule.advice)}</p>
        <div class="recap"><div><small>À retenir</small><b>${escapeHtml(rule.safety)}</b></div><strong>Contrôle</strong></div>
        <p class="answer-intro">Si vous souhaitez un tarif précis, contactez-nous par WhatsApp ou par e-mail. Mes collègues reprendront votre demande avec le modèle et les symptômes déjà indiqués.</p>
        <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div>
        <p class="assurance">Conseil prudent · Prix annoncé avant intervention · Aucune réparation sans votre accord</p></div>`;
      syncContextCta();
    }
    function renderAndroidBattery(p){
      const answer=$('#answer-view'),brand=p.brand||'Android',model=p.detectedModel||brand+' · modèle à confirmer';
      current={...p,issueLabel:'Batterie '+brand,model,selected:null};
      answer.innerHTML=`<div class="answer-head"><small>Estimation atelier · pièce et main-d’œuvre</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
        <h3>Batterie<br>${escapeHtml(model)}</h3>
        <p class="answer-intro">Deux solutions peuvent être proposées selon le modèle et la disponibilité de la pièce.</p>
        ${p.safetyAlert?`<div class="recap"><div><small>Consigne de sécurité</small><b>Batterie possiblement gonflée ou anormalement chaude : ne rechargez plus le téléphone et apportez-le en atelier.</b></div><strong>Stop</strong></div>`:''}
        <div class="qualities">
          <button class="quality" type="button" onclick="selectAndroidBattery('Compatible','à partir de 30 €',this)"><div><b>Batterie compatible</b><span>Pièce et main-d’œuvre incluses</span></div><strong>dès 30 €</strong></button>
          <button class="quality" type="button" onclick="selectAndroidBattery('Originale constructeur','à partir de 45 €',this)"><div><b>Batterie d’origine constructeur</b><span>Selon disponibilité · pièce et main-d’œuvre incluses</span></div><strong>dès 45 €</strong></button>
        </div>
        <p class="answer-intro">Si vous souhaitez un tarif précis, contactez-nous par WhatsApp ou par e-mail afin que mes collègues vérifient la référence exacte.</p>
        <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div>
        <p class="assurance">Fourchettes indicatives · Modèle et disponibilité à confirmer · Aucun engagement</p>`;
      syncContextCta();
    }
    function selectAndroidBattery(name,priceLabel,button){
      current.selected={name,priceLabel};
      document.querySelectorAll('#answer-view .quality').forEach(item=>item.classList.toggle('selected',item===button));
      updateActions();
    }
    function formatStorage(value){
      if(!value)return'';const s=String(value).trim();if(/go|to/i.test(s))return s;const n=Number(s);return n>=1000?(n/1000)+' To':s+' Go';
    }
    function protectionOffersHtml(){
      return `<div class="advisor-offer"><small>Conseil de Sébastien</small><strong>Protéger le téléphone dès maintenant ?</strong><div class="offer-grid">
        <button class="offer-add" type="button" onclick="toggleAddon('Film hydrogel Saphir · pose incluse',10,this)"><b>Hydrogel Saphir · 10 €</b><span>Transparent · anti-rayures · pose incluse</span></button>
        <button class="offer-add" type="button" onclick="toggleAddon('Coque adaptée au modèle',0,this)"><b>Coque adaptée</b><span>Modèle et couleur à confirmer</span></button>
      </div></div>`;
    }
    function toggleAddon(name,price,button){
      current.addons=current.addons||[];const index=current.addons.findIndex(x=>x.name===name);
      if(index>=0){current.addons.splice(index,1);button.classList.remove('added')}
      else{current.addons.push({name,price});button.classList.add('added')}
      updateActions();
    }
    function stockModelKey(item){
      const cleaned=normalize(phoneDisplayName(item.modele)).replace(/[.]/g,' ').replace(/\s+/g,' ');
      const iphone=cleaned.match(/iphone\s*(?:se\s*[23]|x(?:r|s(?:\s*max)?)?|(?:[78]|1[1-7])(?:\s*(?:mini|plus|pro(?:\s*max)?|promax))?)/);
      return (iphone?iphone[0].replace(/promax/,'pro max'):cleaned)+'|'+formatStorage(item.stockage);
    }
    function phoneDisplayName(value){
      let model=String(value||'').trim().replace(/\s+/g,' ')
        .replace(/\bpo\s*max\b/ig,'Pro Max')
        .replace(/\bpromax\b/ig,'Pro Max');
      if(/^(?:1[0-7]|se|xr|xs|x\b|[7-9]\b)/i.test(model))model='iPhone '+model;
      return model.replace(/^iphone\b/i,'iPhone').replace(/\bpro\b/ig,'Pro').replace(/\bmax\b/ig,'Max').replace(/\bplus\b/ig,'Plus').replace(/\bmini\b/ig,'mini');
    }
    function renderReconditioned(p){
      const answer=$('#answer-view'),budget=p.flow?.budget||{min:0,max:99999,label:'Budget libre'},platform=p.flow?.platform||'all';
      const available=recondStock.filter(item=>{
        const price=Number(item.vente)||0,isIphone=/iphone/i.test(item.modele||'');
        return price>=budget.min&&price<=budget.max&&(platform==='all'||(platform==='iphone'&&isIphone)||(platform==='android'&&!isIphone));
      }).sort((a,b)=>Number(a.vente)-Number(b.vente));
      const seenModels=new Set(),matches=available.filter(item=>{const key=stockModelKey(item);if(seenModels.has(key))return false;seenModels.add(key);return true}).slice(0,5);
      current={...p,issueLabel:'Recherche reconditionné',model:(platform==='iphone'?'iPhone':platform==='android'?'Android':'Toutes marques')+' · '+budget.label,selected:null};
      if(matches.length){
        answer.innerHTML=`<div class="answer-head"><small>Stock réel · ${matches.length} sélection${matches.length>1?'s':''}</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
          <h3>J’ai trouvé ${matches.length}<br>téléphone${matches.length>1?'s':''}.</h3><p class="answer-intro">Modèles actuellement enregistrés dans le stock Solution Phone.</p>
          <div class="qualities">${matches.map(item=>{const displayModel=phoneDisplayName(item.modele),detail=[formatStorage(item.stockage),item.grade||'',item.couleur||''].filter(Boolean).join(' · '),message='Bonjour Solution Phone, le '+displayModel+' '+formatStorage(item.stockage)+' à '+item.vente+' € est-il toujours disponible ?';return `<a class="quality" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="https://wa.me/33783921884?text=${encodeURIComponent(message)}"><div><b>${escapeHtml(displayModel)}</b><span>${escapeHtml(detail)}</span></div><strong>${Number(item.vente)} €</strong></a>`}).join('')}</div>
          ${protectionOffersHtml()}
          <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander conseil sur WhatsApp</a><a class="action mail" href="reconditionnes.html">Voir tout le stock</a></div>
          <p class="assurance">Stock mis à jour depuis l’application · Téléphones testés · Garantie selon le modèle</p>`;
      }else{
        answer.innerHTML=`<div class="answer-head"><small>Stock consulté · demande enregistrée</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
          <div class="unknown"><h3>Aucun modèle exact<br>dans ce budget.</h3><p class="answer-intro">Le stock évolue souvent. Votre recherche est prête pour vérifier les prochains arrivages avec l’équipe.</p>
          <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Demander les arrivages</a><button class="action mail" onclick="openMail()">Recevoir une réponse par e-mail</button></div></div>`;
      }
    }
    function specialistProfile(intent,rawDetail){
      const detail=normalize(rawDetail||'');let key=null;
      if(intent==='computer')key=/ecran/.test(detail)?'computerScreen':/virus|malware|publicite/.test(detail)?'computerVirus':/disque dur|ssd|windows/.test(detail)?'computerDrive':/batterie|autonomie/.test(detail)?'computerBattery':/recuper.*donnee|donnee.*perdu/.test(detail)?'computerData':/ne demarre|ne s.?allume/.test(detail)?'computerPower':null;
      if(intent==='scooter')key=/pneu|crev/.test(detail)?'scooterTire':/frein/.test(detail)?'scooterBrake':/autonomie|batterie|charge/.test(detail)?'scooterBattery':/ne demarre|ne s.?allume/.test(detail)?'scooterPower':null;
      if(intent==='console')key=/hdmi|image/.test(detail)?'consoleHdmi':/chauffe|ventilateur/.test(detail)?'consoleHeat':/ne demarre|ne s.?allume/.test(detail)?'consolePower':/lecteur|disque|manette|joystick/.test(detail)?'consoleDrive':null;
      return {key,guidance:key?SPECIALIST_GUIDANCE[key]:null,estimate:key?SERVICE_ESTIMATES[key]||null:null};
    }
    function renderService(p){
      const answer=$('#answer-view'),f=p.flow||{};
      if(p.intent==='accessory'){
        current={...p,issueLabel:'Accessoire',model:`${f.accessory||'Accessoire'} · ${f.device||'Modèle à préciser'}`};
        answer.innerHTML=`<div class="answer-head"><small>Demande accessoire prête</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
          <div class="unknown"><h3>${escapeHtml(f.accessory||'Accessoire')}<br>${escapeHtml(f.device||'Votre téléphone')}</h3><p class="answer-intro">L’équipe vérifie la disponibilité et vous confirme le prix exact.</p>
          ${f.accessory==='Coque'?protectionOffersHtml():''}
          <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Vérifier sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div><p class="assurance">Modèle et accessoire déjà renseignés · Réponse humaine</p></div>`;
      }else if(p.intent==='transfer'){
        current={...p,issueLabel:'Transfert de téléphone',model:`${f.source||'?'} vers ${f.target||'?'} · ${f.transferType||'Données à préciser'}`};
        answer.innerHTML=`<div class="answer-head"><small>Transfert accompagné · estimation atelier</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
          <div class="unknown"><h3>${escapeHtml(f.source||'Ancien téléphone')} → ${escapeHtml(f.target||'Nouveau téléphone')}</h3><p class="answer-intro">${escapeHtml(f.transferType||'Transfert de données')} · Si l’ancien smartphone est cassé, nous contrôlons d’abord s’il reste accessible. La récupération et le transfert sont proposés <b>à partir de 20 €</b>.</p>
          <div class="recap"><div><small>Tarif indicatif</small><b>Récupération et transfert vers le nouveau smartphone</b></div><strong>dès 20 €</strong></div>
          <p class="answer-intro">Le prix et la faisabilité dépendent de l’état de l’ancien appareil, de la quantité de données et de la compatibilité du nouveau téléphone. Tout est confirmé avant intervention.</p>
          <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Organiser le transfert</a><button class="action mail" onclick="openMail()">Demander par e-mail</button></div><p class="assurance">Photos, contacts et applications selon compatibilité · Aucun effacement sans votre accord</p></div>`;
      }else{
        const labels={computer:'Informatique',scooter:'Trottinette',console:'Console'},label=labels[p.intent]||'Service spécialisé';
        const profile=specialistProfile(p.intent,f.specialistDetail),estimate=profile.estimate,guidance=profile.guidance;
        const preciseDevice=[f.computerType,f.specialistDetail].filter(Boolean).join(' · ');
        current={...p,issueLabel:label,model:preciseDevice||'Besoin à préciser'};
        answer.innerHTML=`<div class="answer-head"><small>Solution Informatique · demande prête</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
          <div class="unknown"><h3>${label}<br>${escapeHtml(guidance?.title||f.computerType||f.specialistDetail||'Diagnostic')}</h3><p class="answer-intro">${estimate?`${estimate.text} <b>${estimate.range}</b>. ${estimate.note}`:'La prise en charge et le tarif dépendent du modèle et du diagnostic.'}</p>
          ${estimate?`<div class="recap"><div><small>Fourchette indicative</small><b>Devis précis après identification du modèle</b></div><strong>${estimate.range}</strong></div>`:''}
          ${guidance?`<div class="screen-explainer" style="margin:12px 0 16px"><div style="padding:15px 16px"><b>Première orientation de l’atelier</b><p style="padding:8px 0 0;margin:0">${escapeHtml(guidance.check)}</p></div></div><p class="answer-intro"><b>Important :</b> ${escapeHtml(guidance.safety)}</p>`:''}
          <p class="answer-intro">Si vous souhaitez un devis précis, je passe la main à mes collègues.</p>
          <div class="actions"><a class="action wa" id="result-wa" href="${waLink()}" target="_blank" rel="noopener">Passer la main sur WhatsApp</a><button class="action mail" onclick="openMail()">Demander le devis par e-mail</button></div><p class="assurance">3 boutiques spécialisées · 21 rue Gambetta à Mâcon · Aucun engagement</p></div>`;
      }
      syncContextCta();
    }
    function renderUnknown(p){
      const answer=$('#answer-view');
      const cleaned=(p.text||'').replace(/\b(ecran|écran|vitre|casse|cassé|cassee|cassée|fissure|fissuré|batterie|autonomie|charge|connecteur|camera|caméra|photo|panne|probleme|problème)\b/gi,' ').replace(/\s+/g,' ').trim();
      const model=p.detectedModel||(p.brand==='Apple'&&p.key?'iPhone '+p.key:cleaned||p.brand)||'Votre téléphone';
      const issue={screen:'Écran cassé',battery:'Batterie',charge:'Connecteur de charge',camera:'Caméra',audio:'Audio',buttons:'Boutons',back:'Vitre arrière',water:'Oxydation',power:'Extinctions répétées',faceid:'Face ID',network:'Réseau ou Wi-Fi',overheating:'Surchauffe',slow:'Lenteur ou stockage',vibration:'Vibreur',androidVirus:'Nettoyage virus Android'}[p.issue]||'Panne à identifier';
      current={...p,model,issueLabel:issue,selected:null};
      const explanation=p.issue==='power'?'Une batterie fatiguée est possible, mais les extinctions peuvent aussi venir du logiciel, de l’alimentation ou de la carte mère. Un diagnostic est nécessaire avant d’annoncer un prix.':'Ce tarif n’est pas enregistré dans la base en ligne. Votre demande est déjà prête : l’équipe confirme le prix exact.';
      answer.innerHTML=`<div class="answer-head"><small>Modèle reconnu · tarif sur demande</small><button onclick="resetDiagnostic()">Nouvelle demande</button></div>
        <div class="unknown"><h3>${escapeHtml(model)}<br>${issue}</h3><p class="answer-intro">${explanation}</p>
        <div class="actions"><a class="action wa" href="${waLink()}" target="_blank" rel="noopener">Obtenir le tarif sur WhatsApp</a><button class="action mail" onclick="openMail()">Recevoir un devis par e-mail</button></div>
        <p class="assurance">Message prérempli · Réponse humaine · Aucun engagement</p></div>`;
      syncContextCta();
    }
    function selectQuality(id){
      current.selected=current.qualities.find(q=>q.id===id)||current.selected;
      document.querySelectorAll('.quality').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));
      $('#recap-price').textContent=current.selected.price+' €';updateActions();
    }
    function requestText(){
      if(!current)return'Je souhaite obtenir un devis.';
      if(current.brainReference)return `Demande ${current.brainReference} · ${current.text||current.issueLabel||'Question à l’atelier'}`;
      if(current.category==='business')return `Question boutique · ${current.text}`;
      const brainContext=current.brainAnswer?` · Réponse affichée par l’assistant : ${String(current.brainAnswer).replace(/\s+/g,' ').trim().slice(0,380)}${current.brainWarning?' · Précaution : '+String(current.brainWarning).replace(/\s+/g,' ').trim().slice(0,180):''}`:'';
      const addons=current.addons?.length?' · À préparer : '+current.addons.map(x=>x.name+(x.price?' ('+x.price+' €)':'')).join(' + '):'';
      if(current.intent==='reconditioned')return `Recherche smartphone reconditionné · ${current.model}${brainContext}${addons}`;
      if(current.intent==='accessory')return `Accessoire · ${current.model}${current.text?' · Demande originale : '+current.text:''}${brainContext}${addons}`;
      if(current.intent==='transfer')return `Service données · ${current.model} · Transfert de données smartphone à smartphone : dès 20 €${current.text?' · Demande originale : '+current.text:''}${brainContext}`;
      if(['computer','scooter','console'].includes(current.intent))return `${current.issueLabel} · ${current.model}${current.text?' · Demande : '+current.text:''}${brainContext}`;
      const q=current.selected?` · ${current.selected.name} · ${current.selected.priceLabel||current.selected.price+' €'}`:'';
      const priceStatus=current.priceSource==='estimation_secours'?' · Tarif indicatif, à confirmer':current.priceSource==='atelier_connecte'?' · Prix à jour, pièce et main-d’œuvre comprises':'';
      const qualiStatus=current.brand==='Apple'&&['screen','battery'].includes(current.issue)?' · Prix affiché après réduction Solution Phone de 25 €':'';
      const symptom=current.symptom?` · ${current.symptom}`:'';
      const declared=current.text?` · ${current.intent==='repair'?'Symptôme déclaré':'Demande originale'} : ${current.text}`:'';
      return `${current.issueLabel||'Diagnostic'} · ${current.model||current.text}${symptom}${q}${priceStatus}${qualiStatus}${declared}${brainContext}${addons}`;
    }
    function waLink(){
      return 'https://wa.me/33783921884?text='+encodeURIComponent('Bonjour Solution Phone, '+requestText()+'.');
    }
    function updateActions(){const a=$('#result-wa');if(a)a.href=waLink()}
    function resetDiagnostic(){
      stopExpertPolling();$('#answer-view').classList.remove('show');$('#answer-view').innerHTML='';$('#chat-view').classList.remove('show');$('#chat-thread').innerHTML='';$('#chat-quick').innerHTML='';$('#loading-view').classList.remove('show');$('#start-view').style.display='block';$('#diagnostic-input').value='';$('#diagnostic-input').placeholder='Écrivez directement votre demande…';document.querySelectorAll('.brand-button').forEach(x=>x.classList.remove('active'));conversationText='';conversationParsed=null;waitingFor=null;flowData={};current=null;lastBrainWhatsApp='';updateDiagnosticProgress(null);jasonConversationToken='';try{sessionStorage.removeItem('jason_conversation_token')}catch(e){}$('#device-state').textContent='Votre demande';syncContextCta();setTimeout(()=>$('#diagnostic-input').focus(),80);
    }
    let mailReturnFocus=null,mailDraftContext='';
    function resetMailSuccess(){
      $('#mail-modal-title').hidden=false;$('#mail-modal-intro').hidden=false;$('#mail-form').hidden=false;$('#form-status').hidden=false;$('#mail-success').hidden=true;$('#mail-success-email').textContent='';$('#mail-success-reference').textContent='';
    }
    function showMailSuccess(payload,email){
      $('#mail-modal-title').hidden=true;$('#mail-modal-intro').hidden=true;$('#mail-form').hidden=true;$('#form-status').hidden=true;
      $('#mail-success-email').textContent=email||'';
      const reference=$('#mail-success-reference');reference.textContent=payload?.reference?'Référence : '+payload.reference:'';reference.hidden=!payload?.reference;
      const success=$('#mail-success');success.hidden=false;success.focus();
    }
    function openMail(requestOverride){
      mailReturnFocus=document.activeElement;
      resetMailSuccess();
      const request=$('#mail-request');
      if(typeof requestOverride==='string'){mailDraftContext=requestOverride;request.value=requestOverride}
      else if(!request.value||request.value===mailDraftContext){mailDraftContext=current?requestText():'';request.value=mailDraftContext}
      $('#mail-modal').classList.add('open');document.body.classList.add('modal-open');
      setTimeout(()=>{if($('#mail-modal').classList.contains('open'))(request.value?$('#mail-name'):request).focus()},30);
      track('devis_email_ouvert',{intent:current?.intent||'unknown'});
    }
    function closeMail(){const wasOpen=$('#mail-modal').classList.contains('open');$('#mail-modal').classList.remove('open');if(!$('#quick-modal').classList.contains('open'))document.body.classList.remove('modal-open');if(wasOpen&&mailReturnFocus?.isConnected)mailReturnFocus.focus()}
    $('#mail-modal').addEventListener('keydown',e=>{
      if(e.key!=='Tab')return;
      const items=[...$('#mail-modal').querySelectorAll('button,input,textarea,summary,a[href]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length),first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    });
    function openQuickPrice(){
      $('#quick-modal').classList.add('open');document.body.classList.add('modal-open');setTimeout(()=>$('#quick-model').focus(),60);
    }
    function syncContextCta(){
      const button=$('#dock-price-button');if(!button)return;
      if(current?.intent==='computer')button.textContent='Devis ordinateur';
      else if(current?.intent==='transfer')button.textContent='Transfert dès 20 €';
      else if(['scooter','console','accessory'].includes(current?.intent))button.textContent='Demander un devis';
      else if(current?.brand==='Apple'&&['screen','battery'].includes(current?.issue))button.textContent='Voir ce tarif';
      else if(current?.issue==='battery')button.textContent='Devis batterie';
      else if(current?.issue==='charge')button.textContent='Devis connecteur';
      else if(current?.issue==='back')button.textContent='Devis vitre arrière';
      else if(current?.issue==='androidVirus')button.textContent='Nettoyage 10 €';
      else if(current?.intent==='repair'&&current?.brand)button.textContent='Devis '+current.brand;
      else if(current?.intent==='repair')button.textContent='Demander ce devis';
      else button.textContent='Tarif iPhone';
    }
    function openContextAction(){
      const directIphone=current?.brand==='Apple'&&current?.key&&['screen','battery'].includes(current?.issue);
      if(current&&!directIphone){openMail();return}
      openQuickPrice();
    }
    function closeQuickPrice(){$('#quick-modal').classList.remove('open');if(!$('#mail-modal').classList.contains('open'))document.body.classList.remove('modal-open')}
    function iphoneLabel(key){return 'iPhone '+key.replace(/\b\w/g,c=>c.toUpperCase())}
    function syncQuickModels(){
      const select=$('#quick-model');if(!select)return;
      const selected=select.value,issue=$('#quick-issue')?.value||'screen';
      const available=IPHONE_MODEL_KEYS.filter(key=>issue==='other'||(issue==='screen'?(screens[key]||[]).some(Number):(batteries[key]||[]).some(Number)));
      select.innerHTML='<option value="">Votre modèle d’iPhone</option>';
      available.forEach(key=>{const option=document.createElement('option');option.value=key;option.textContent=iphoneLabel(key);select.appendChild(option)});
      if(available.includes(selected))select.value=selected;
    }
    function setQuickIssue(issue){
      $('#quick-issue').value=issue;
      document.querySelectorAll('[data-quick-issue]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.quickIssue===issue)));
      const other=issue==='other',fields=$('#quick-other-fields'),detail=$('#quick-other-detail');
      fields.hidden=!other;detail.required=other;$('#quick-show-price').hidden=other;$('#quick-other-status').textContent='';
      syncQuickModels();
    }
    function quickOtherRequest(){
      const key=$('#quick-model').value,detail=$('#quick-other-detail').value.trim();
      return key&&detail?`Devis autre pièce iPhone · ${iphoneLabel(key)} · ${detail}`:'';
    }
    let quoteHelperLoading;
    function loadQuoteAttemptHelper(){
      if(window.SolutionPhoneQuoteAttempts)return Promise.resolve(window.SolutionPhoneQuoteAttempts);
      if(!quoteHelperLoading)quoteHelperLoading=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='/quote-attempt.fcade1faf080.js';script.async=true;
        script.onload=()=>window.SolutionPhoneQuoteAttempts?resolve(window.SolutionPhoneQuoteAttempts):reject(new Error('quote_helper_unavailable'));
        script.onerror=()=>reject(new Error('quote_helper_unavailable'));
        document.head.appendChild(script);
      });
      return quoteHelperLoading;
    }
    function quoteErrorMessage(error){
      if(error?.code==='quote_payload_changed'||error?.code==='quote_attempt_needs_review')return 'Cette demande a peut-être déjà été envoyée. Vérifiez avec l’équipe avant de modifier ou renvoyer le devis.';
      if(error?.code==='quote_receipt_unconfirmed')return 'Réception non confirmée. Ne renvoyez pas une nouvelle demande avant de vérifier avec l’équipe ; vous pouvez réessayer la même demande.';
      if(error?.code==='quote_storage_unavailable'||error?.code==='invalid_quote_form'||error?.code==='invalid_quote_payload'||error?.message==='quote_helper_unavailable')return 'Envoi sécurisé indisponible sur ce navigateur. Utilisez WhatsApp ou appelez la boutique.';
      if(error?.status===429)return 'Plusieurs demandes ont déjà été envoyées récemment. Votre devis est peut-être déjà arrivé ; sinon, réessayez dans 15 minutes ou utilisez WhatsApp.';
      if(error?.status>=400&&error?.status<500)return 'La demande contient une information invalide. Contactez la boutique avant de modifier ou renvoyer cette demande.';
      return 'Réception non confirmée. Réessayez cette même demande ou contactez la boutique avant d’en créer une autre.';
    }
    async function sendQuoteRequest(data){
      const helper=await loadQuoteAttemptHelper();
      const page=location.pathname||'/';
      return helper.open().submit({
        slot:'page'+page.toLowerCase().replace(/[^a-z0-9_/-]/g,'_')+'-'+data.form_type,
        defaultReceiver:PUBLIC_QUOTE_SOURCE,
        payload:{...data,page},
        send:async({receiver,clientToken,payload:request})=>{
          if(receiver!=='v1'&&receiver!=='v2')throw new Error('quote_receiver_invalid');
          let lastError=new Error('quote_failed');
          for(let attempt=0;attempt<2;attempt++){
            if(attempt)await new Promise(resolve=>setTimeout(resolve,650));
            try{
              const response=await fetch(receiver==='v2'?V2_QUOTE_REQUEST_URL:QUOTE_REQUEST_URL,{method:'POST',headers:receiver==='v2'?{'Content-Type':'application/json'}:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({...request,client_token:clientToken})});
              const receipt=await response.json().catch(()=>null);
              if(response.ok&&receipt?.received)return receipt;
              const error=new Error(receipt?.error||'quote_failed');error.status=response.status;
              if(response.status>=400&&response.status<500)throw error;
              lastError=error;
            }catch(error){
              if(error?.status>=400&&error?.status<500)throw error;
              lastError=error instanceof Error?error:lastError;
            }
          }
          throw lastError;
        }
      });
    }
    document.querySelectorAll('[data-quick-issue]').forEach(tab=>tab.addEventListener('click',()=>setQuickIssue(tab.dataset.quickIssue)));
    $('#quick-other-wa').addEventListener('click',()=>{
      const request=quickOtherRequest(),status=$('#quick-other-status');status.className='quick-status';
      if(!$('#quick-model').value){$('#quick-model').reportValidity();return}
      if(!request){status.textContent='Indiquez la pièce ou la panne.';status.classList.add('is-error');$('#quick-other-detail').focus();return}
      const name=$('#quick-other-name').value.trim(),phone=$('#quick-other-phone').value.trim();
      const message=`Bonjour Solution Phone, ${request}${name?' · Nom : '+name:''}${phone?' · Téléphone : '+phone:''}. Pouvez-vous me confirmer le devis ?`;
      openTrackedWhatsApp('https://wa.me/33783921884?text='+encodeURIComponent(message),'quick_other_part');track('devis_autre_piece_whatsapp',{model:iphoneLabel($('#quick-model').value)});
    });
    $('#quick-other-mail').addEventListener('click',async()=>{
      if($('#quick-other-mail').disabled)return;
      const request=quickOtherRequest(),status=$('#quick-other-status'),name=$('#quick-other-name').value.trim(),email=$('#quick-other-email').value.trim(),phone=$('#quick-other-phone').value.trim(),button=$('#quick-other-mail');status.className='quick-status';
      if(!$('#quick-model').value){$('#quick-model').reportValidity();return}
      if(!request){status.textContent='Indiquez la pièce ou la panne.';status.classList.add('is-error');$('#quick-other-detail').focus();return}
      if(!name){status.textContent='Indiquez votre nom pour que l’équipe puisse vous répondre.';status.classList.add('is-error');$('#quick-other-name').focus();return}
      if(!email||!$('#quick-other-email').checkValidity()){status.textContent='Indiquez une adresse e-mail valide.';status.classList.add('is-error');$('#quick-other-email').focus();return}
      button.disabled=true;status.textContent='Envoi en cours…';
      let payload;
      try{payload=await sendQuoteRequest({name,email,phone,request,form_type:'quick_other_part',website:$('#quick-other-website').value})}
      catch(error){status.textContent=quoteErrorMessage(error);status.classList.add('is-error');button.disabled=false;return}
      status.textContent=`Demande reçue (${payload.reference}). L’équipe vous répondra directement par e-mail.`;status.classList.add('is-success');
      runQuoteSideEffect(()=>trackLeadSuccess('devis_email_envoye',{method:'email',form_type:'quick_other_part',reference:payload.reference},{email,phone}));
      runQuoteSideEffect(()=>track('devis_autre_piece_email',{model:iphoneLabel($('#quick-model').value)}));
      runQuoteSideEffect(()=>trackBrainEvent('email_clicked',{intent:'other_iphone_part',source:'quick_quote'}));
      button.disabled=false;
    });
    syncQuickModels();
    $('#diagnostic-form').addEventListener('submit',async e=>{e.preventDefault();const v=$('#diagnostic-input').value.trim();if(v){await trackBrainEvent('assistant_opened',{source:'diagnostic_form'});runDiagnostic(v)}});
    $('#chat-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#chat-input'),value=input.value.trim();if(!value)return;input.value='';handleConversationAnswer(value,value,waitingFor==='symptom'?'symptom':waitingFor)});
    ['diagnostic-input','chat-input'].forEach(id=>{const input=document.getElementById(id);if(!input)return;input.addEventListener('focus',()=>{document.body.classList.add('input-active');if(!document.body.classList.contains('evan-thinking')&&!document.body.classList.contains('evan-speaking'))document.body.classList.add('evan-listening')});input.addEventListener('blur',()=>{document.body.classList.remove('evan-listening');setTimeout(()=>document.body.classList.remove('input-active'),350)})});
    document.querySelectorAll('#mail-modal input,#mail-modal textarea').forEach(input=>{input.addEventListener('focus',()=>document.body.classList.add('input-active'));input.addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('input-active'),350))});
    function focusRepairPart(part){
      if(!part)return;
      document.querySelectorAll('.repair-part').forEach(item=>item.classList.toggle('is-active',item===part));
      const title=$('#repair-focus-title'),detail=$('#repair-focus-detail'),price=$('#repair-focus-price');
      if(title)title.textContent=part.dataset.part||'Diagnostic ciblé';
      if(detail)detail.textContent=part.dataset.detail||'Touchez pour lancer le diagnostic.';
      if(price)price.textContent=part.dataset.price||'Devis selon le modèle et le diagnostic.';
    }
    document.querySelectorAll('.repair-part').forEach(part=>{
      part.addEventListener('pointerenter',()=>focusRepairPart(part));
      part.addEventListener('pointerdown',()=>focusRepairPart(part));
      part.addEventListener('focus',()=>focusRepairPart(part));
    });
    document.querySelectorAll('.prompt,.need-card,.repair-part,.repair-device,.repair-brand').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.prompt||b.dataset.repairPrompt;$('#diagnostic-input').value=v;runDiagnostic(v);$('#advanced-help').scrollIntoView({block:'start',behavior:'smooth'})}));
    document.querySelectorAll('.brand-button').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.brand-button').forEach(x=>x.classList.toggle('active',x===b));
      const input=$('#diagnostic-input');input.value=b.dataset.brand+' ';input.placeholder='Indiquez le modèle et la panne';input.focus();
    }));
    $('#close-modal').addEventListener('click',closeMail);
    $('#mail-success-close').addEventListener('click',closeMail);
    $('#mail-modal').addEventListener('click',e=>{if(e.target.id==='mail-modal')closeMail()});
    $('#quick-close').addEventListener('click',closeQuickPrice);
    $('#quick-modal').addEventListener('click',e=>{if(e.target.id==='quick-modal')closeQuickPrice()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMail();closeQuickPrice()}});
    $('#quick-form').addEventListener('submit',e=>{
      e.preventDefault();const key=$('#quick-model').value,issue=$('#quick-issue').value;if(!key)return;
      if(issue==='other'){const status=$('#quick-other-status');status.textContent='Choisissez WhatsApp ou e-mail pour transmettre cette demande.';return}
      closeQuickPrice();$('#start-view').style.display='none';$('#chat-view').classList.remove('show');
      const parsed={text:'Tarif direct '+iphoneLabel(key),intent:'repair',brand:'Apple',key,detectedModel:iphoneLabel(key),issue,symptom:'Tarif immédiat demandé'};
      current=parsed;launchLookup(parsed);
    });
    // Analytics and UI cleanup must never turn an accepted request into a send failure.
    function runQuoteSideEffect(callback){try{Promise.resolve(callback()).catch(()=>{})}catch(error){}}
    $('#mail-form').addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget,status=$('#form-status'),submit=form.querySelector('button[type="submit"]');
      if(submit.disabled)return;
      const data=Object.fromEntries(new FormData(form).entries());
      if(data.website)return;
      status.textContent='Envoi en cours…';submit.disabled=true;
      let payload;
      try{
        payload=await sendQuoteRequest({name:data.Nom,email:data.email,phone:data.Telephone,request:data.Demande,form_type:'main_quote',website:data.website});
      }catch(err){status.textContent=quoteErrorMessage(err);runQuoteSideEffect(()=>track('devis_email_erreur',{status:err?.status||0}));submit.disabled=false;return}
      runQuoteSideEffect(()=>form.reset());
      runQuoteSideEffect(()=>trackLeadSuccess('devis_email_envoye',{method:'email',form_type:'main_quote',reference:payload.reference},{email:data.email,phone:data.Telephone}));
      runQuoteSideEffect(()=>track('devis_autre_piece_email',{method:'email',form_type:'main_quote',migration_bridge:true}));
      runQuoteSideEffect(()=>trackBrainEvent('email_clicked',{intent:current?.intent||'unknown',source:'form_submit_success'}));
      submit.disabled=false;showMailSuccess(payload,data.email);
    });
    function track(name,params){try{if(typeof window.gtag==='function')window.gtag('event',name,{transport_type:'beacon',...(params||{})})}catch(e){}}
    // Aucune donnée personnelle (e-mail, téléphone) n’est transmise à Google : seul l’événement est mesuré.
    function trackLeadSuccess(name,params){track(name,params)}
    function trackWhatsApp(source){
      track('contact_whatsapp',{method:'whatsapp',page:'assistant',source:String(source||'link'),intent:current?.intent||'unknown',brand:current?.brand||''});
      trackBrainEvent('whatsapp_clicked',{intent:current?.intent||'unknown',brand:current?.brand||'',source:String(source||'link')});
    }
    function openTrackedWhatsApp(url,source){trackWhatsApp(source);window.open(url,'_blank','noopener')}
    function phoneClickData(href){
      const number=String(href||'').replace(/^tel:/,'').replace(/\s/g,''),destinations={'+33385330689':'atelier_fixe','+33783921884':'mobile_whatsapp','+33602849953':'solution_accessoires','+33748348743':'solution_informatique'};
      return {phone_number:number,phone_destination:destinations[number]||'autre'};
    }
    document.addEventListener('click',e=>{
      const link=e.target.closest('a[href*="wa.me"]');if(link)trackWhatsApp(link.id||link.className||'link');
      const phoneLink=e.target.closest('a[href^="tel:"]');if(phoneLink)track('contact_phone',{method:'phone',page:'assistant',...phoneClickData(phoneLink.getAttribute('href'))});
      if(e.target.closest('.express-price,#dock-price-button'))track('ouverture_tarif_direct',{page:'evan',context:requestText()});
    });
    const visualPanel=document.querySelector('.visual'),agentStage=document.querySelector('.agent-stage');
    if(visualPanel&&agentStage&&matchMedia('(prefers-reduced-motion: no-preference)').matches){
      visualPanel.addEventListener('pointermove',e=>{const r=visualPanel.getBoundingClientRect(),x=((e.clientX-r.left)/r.width-.5)*8,y=((e.clientY-r.top)/r.height-.5)*5;agentStage.style.setProperty('--look-x',x.toFixed(1)+'px');agentStage.style.setProperty('--look-y',y.toFixed(1)+'px')});
      visualPanel.addEventListener('pointerleave',()=>{agentStage.style.setProperty('--look-x','0px');agentStage.style.setProperty('--look-y','0px')});
    }
    updateStoreAvailability();setInterval(updateStoreAvailability,30000);
    const priceDataReady=loadPrices();
    const evanDataReady=Promise.allSettled([priceDataReady,loadStock()]);
    window.SolutionPhoneQuote={
      models:()=>IPHONE_MODEL_KEYS.map(iphoneLabel),
      prices(model,issue){
        const key=normalize(model).replace(/^iphone\s+/,'');
        if(!/^iphone\s/i.test(model)||!IPHONE_MODEL_KEYS.includes(key)||!['screen','battery'].includes(issue))return [];
        if(!(issue==='screen'?liveScreenModels:liveBatteryModels).has(key))return [];
        const values=(issue==='screen'?screens:batteries)[key]||[],meta=issue==='screen'?QUALITES:QUALITES_BAT;
        let rows=meta.map((item,i)=>({...item,price:Number(values[i])||0})).filter(item=>Number.isFinite(item.price)&&item.price>0);
        if(issue==='screen'){const economy=rows.filter(item=>['hd','ltps'].includes(item.id)).sort((a,b)=>a.price-b.price)[0];rows=[...(economy?[{...economy,id:'eco'}]:[]),...rows.filter(item=>!['hd','ltps'].includes(item.id))]}
        return rows;
      },
      email:request=>openMail(request),
      ready:priceDataReady
    };
    if(document.documentElement.classList.contains('evan-embed'))$('#advanced-help').open=true;
    const sharedQuestion=new URLSearchParams(location.search).get('q');
    if(sharedQuestion){
      $('#diagnostic-input').value=sharedQuestion;
      Promise.race([evanDataReady,new Promise(resolve=>setTimeout(resolve,900))]).then(async()=>{await trackBrainEvent('assistant_opened',{source:'page_context',from:JASON_SOURCE_PAGE});runDiagnostic(sharedQuestion)});
    }
    const updateContactDock=()=>document.body.classList.toggle('contact-dock-visible',window.scrollY>Math.min(520,window.innerHeight*.62));
    updateContactDock();window.addEventListener('scroll',updateContactDock,{passive:true});
