(function(){
  'use strict';
  const api=window.SolutionPhoneQuote;if(!api)return;
  const screen=[['hd','HD','LCD économique : le choix du budget.'],['ltps','LTPS','Écran LCD (technologie des écrans classiques) : une alternative économique à l’OLED.'],['ltpsp','LTPS Prime','Écran LCD de gamme supérieure. Un écran LCD ne reproduit pas les noirs profonds d’un OLED.'],['oled','Soft OLED','OLED souple : noirs profonds et contraste élevé.'],['relife','ReLife','Dalle Apple d’origine reconditionnée, avec une vitre remplacée.']];
  const battery=[['compat','Compatible','Batterie compatible : solution économique.'],['ti','Compatible reconnue','Batterie compatible reconnue par l’iPhone selon le modèle. À confirmer avec l’équipe.'],['orig','Originale','Pièce d’origine, selon disponibilité.']];
  const clean=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/iphone/g,'').replace(/\+/g,' plus ').replace(/promax/g,'pro max').replace(/\b2020\b/g,'2').replace(/\b2022\b/g,'3').replace(/\s+/g,'').trim();
  const cleanAndroid=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(samsung|galaxy|xiaomi|redmi|poco|google|honor|huawei|oppo|oneplus|motorola)\b/g,'').replace(/\s+/g,' ').trim();

  function approvedScreens(){
    const rows=window.SolutionPhoneApprovedIphoneScreens;
    if(!Array.isArray(rows)||rows.length!==25)return [];
    const names=new Set();
    for(const row of rows){
      if(!row||typeof row.modele!=='string'||!Array.isArray(row.prix)||row.prix.length!==5
        ||!row.prix.some(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)
        ||!row.prix.every(x=>x===null||(typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=100000&&x===Math.round(x*100)/100))
        ||names.has(clean(row.modele)))return [];
      names.add(clean(row.modele));
    }
    return rows;
  }

  api.catalogState='loading';
  api.catalogRows={screen:[],battery:[],android:[]};

  api.brandPresets={
    iphone:['iPhone 13','iPhone 14','iPhone 15','iPhone 11','iPhone 12','iPhone 16','iPhone 15 Pro Max','iPhone 14 Pro'],
    samsung:['Samsung Galaxy A14','Samsung Galaxy A15','Samsung Galaxy A54','Samsung Galaxy A55','Samsung Galaxy S23','Samsung Galaxy S24','Samsung Galaxy S22','Samsung Galaxy Z Flip5'],
    android:['Xiaomi Redmi Note 13','Xiaomi Redmi Note 12','Google Pixel 8','Google Pixel 7a','Honor Magic6 Lite','Xiaomi Redmi 13C','Oppo / OnePlus'],
    ipad:['iPad 9e génération','iPad 10e génération','iPad Air','iPad Pro','Samsung Galaxy Tab A8','Tablette Lenovo'],
    pc:['PC portable (toutes marques)','MacBook Air','MacBook Pro','PC fixe / Tour','Disque dur / SSD (récupération données)'],
    console:['PS5 (Port HDMI / Surchauffe)','Nintendo Switch (USB-C / Écran / Lecteur)','Xbox Series X / S','Manette PS5 / Switch'],
    scooter:['Trottinette Xiaomi (Pneu / Frein / Batterie)','Trottinette Ninebot Segway','Autre trottinette électrique']
  };

  api.models=()=>{
    const iphones=[...new Set([
      ...api.catalogRows.screen.flatMap(r=>{const group=/^(14|15|16)\/\1 Plus$/.exec(r.modele);return group?['iPhone '+group[1],'iPhone '+group[1]+' Plus']:['iPhone '+r.modele]}),
      ...api.catalogRows.battery.map(r=>'iPhone '+r.modele)
    ])];
    const extras=Object.values(api.brandPresets).flat().filter(x=>!/^iPhone /i.test(x));
    return [...new Set([...iphones,...extras,'Autre modèle'])];
  };

  api.estimateRange=(model,issue)=>{
    const raw=String(model||'').toLowerCase();
    const isPc=/\b(pc|macbook|imac|ordinateur|portable|windows|lenovo|hp|dell|asus|acer)\b/.test(raw);
    const isConsole=/\b(ps5|ps4|playstation|switch|nintendo|xbox|console|manette)\b/.test(raw);
    const isScooter=/\b(trottinette|xiaomi pro|ninebot|segway)\b/.test(raw);
    const isIpad=/\b(ipad|galaxy tab|tablette)\b/.test(raw);
    const isAndroid=!isPc&&!isConsole&&!isScooter&&!isIpad&&/\b(samsung|galaxy|xiaomi|redmi|poco|pixel|google|honor|huawei|oppo|oneplus|motorola|realme|vivo|android|\ba[0-9]{2}|\bs2[0-9])\b/.test(raw);

    if(issue==='cleaning'&&!isPc&&!isConsole&&!isScooter){
      return {headline:'10 € TTC (forfait nettoyage)',note:'Nettoyage professionnel du connecteur de charge et des grilles haut-parleur en boutique (suffit dans 9 cas sur 10 sur un souci de charge).'};
    }
    if(issue==='virus'){
      if(isPc)return {headline:'40 à 60 € TTC',note:'Suppression de virus, publicités intempestives et nettoyage système PC/Mac chez Solution Informatique (devis confirmé avant intervention).'};
      return {headline:'10 à 20 € TTC',note:'Suppression des publicités intrusives et applications malveillantes sur smartphone Android, sans perte de vos photos.'};
    }
    if(isPc){
      if(issue==='screen')return {headline:'Repère : 100 à 170 € TTC',note:'Selon la référence exacte de la dalle (envoyez une photo de l’étiquette sous le PC ou passez au 21 rue Gambetta).'};
      if(issue==='battery')return {headline:'À partir de 70 € TTC',note:'Remplacement de batterie PC portable ou MacBook sur référence exacte.'};
      return {headline:'Diagnostic PC / Mac au comptoir',note:'Remplacement SSD + Windows dès 120 € TTC, charnière, connecteur ou récupération de données : tarif annoncé avant intervention.'};
    }
    if(isConsole){
      return {headline:'Devis Console au 21 rue Gambetta',note:'Port HDMI PS5/Xbox en micro-soudure, entretien surchauffe + métal liquide, port USB-C ou lecteur Nintendo Switch : prix fixe annoncé avant réparation.'};
    }
    if(isScooter){
      return {headline:'Atelier Trottinettes sur place',note:'Chambre à air renforcée, pneu plein increvable, réglage/étrier de frein ou diagnostic batterie (Xiaomi, Ninebot…) : tarif confirmé avant intervention.'};
    }
    if(isIpad){
      return {headline:'Devis Tablette selon génération',note:'Vitre tactile, écran complet, batterie ou connecteur iPad / Galaxy Tab : indiquez le numéro de modèle au dos (ex. A2602) pour bloquer la pièce.'};
    }
    if(isAndroid){
      if(issue==='battery')return {headline:'Dès 30 € (compatible) · Dès 45 € (origine)',note:'25 € déjà déduits si éligible au Bonus Réparation QualiRépar · Garantie 6 mois, pièce et pose comprises.'};
      if(issue==='charge')return {headline:'Nettoyage 10 € · Remplacement dès 25 €',note:'Dans 9 cas sur 10, un nettoyage à 10 € suffit sans remplacer le connecteur USB-C !'};
      if(issue==='screen')return {headline:'Devis écran Compatible ou Service Pack',note:'25 € déduits si éligible QualiRépar · Indiquez votre référence exacte pour vérifier le stock et mettre votre écran de côté 24h.'};
    }
    return null;
  };

  api.prices=(model,issue)=>{
    const raw=String(model||'').trim();
    const isIphone=/\biphone\b/i.test(raw)||/^(1[1-7]|x|xr|xs|se|[678])\b/i.test(raw);
    if(isIphone&&(issue==='screen'||issue==='battery')){
      const row=(api.catalogRows[issue]||[]).find(r=>clean(r.modele)===clean(raw)||r.modele.split('/').some(part=>clean(part)===clean(raw)));
      if(row)return (issue==='screen'?screen:battery).map((q,i)=>({id:q[0],name:q[1],desc:q[2],price:Number(row.prix[i])})).filter(q=>Number.isFinite(q.price)&&q.price>0);
    }
    // Check live V2 Android catalog rows when populated
    if(!isIphone&&Array.isArray(api.catalogRows.android)&&api.catalogRows.android.length){
      const target=cleanAndroid(raw);
      if(target){
        const aRow=api.catalogRows.android.find(r=>cleanAndroid((r.marque||'')+' '+(r.modele||''))===target||cleanAndroid(r.modele)===target);
        if(aRow){
          const out=[];
          if(issue==='screen'){
            const incell=Number(aRow.ecran_compatible_incell||aRow.ecran_compatible);
            if(incell>0)out.push({id:'acomp_incell',name:'Écran Compatible Incell',desc:'Solution économique Incell testée en atelier.',price:incell});
            if(Number(aRow.ecran_compatible_oled)>0)out.push({id:'acomp_oled',name:'Écran Compatible OLED',desc:'Écran OLED : noirs profonds et rendu proche de l’origine.',price:Number(aRow.ecran_compatible_oled)});
            if(Number(aRow.ecran_service_pack)>0)out.push({id:'asp',name:'Écran Original (Service Pack)',desc:'Bloc écran constructeur d’origine.',price:Number(aRow.ecran_service_pack)});
          }else if(issue==='battery'){
            if(Number(aRow.batterie_compatible)>0)out.push({id:'bcomp',name:'Batterie Compatible',desc:'Solution économique garantie 6 mois.',price:Number(aRow.batterie_compatible)});
            if(Number(aRow.batterie_originale)>0)out.push({id:'borig',name:'Batterie Originale',desc:'Pièce constructeur d’origine.',price:Number(aRow.batterie_originale)});
          }else if(issue==='charge'&&Number(aRow.connecteur)>0){
            out.push({id:'clean10',name:'Nettoyage port USB-C',desc:'Suffit dans 9 cas sur 10.',price:10});
            out.push({id:'conn',name:'Remplacement connecteur',desc:'Pièce neuve + main-d’œuvre.',price:Number(aRow.connecteur)});
          }else if(issue==='back'&&Number(aRow.vitre_arriere)>0){
            out.push({id:'vback',name:'Vitre arrière',desc:'Pièce neuve + pose comprise.',price:Number(aRow.vitre_arriere)});
          }
          if(out.length)return out;
        }
      }
    }
    return [];
  };

  api.reloadCatalog=async()=>{
    const approved=approvedScreens();
    api.catalogRows={screen:approved,battery:[],android:[]};
    api.catalogState='loading';window.dispatchEvent(new Event('quote-catalog-update'));
    try{
      const response=await fetch('https://vps-8066c206.vps.ovh.net/api/public/catalog?resource=prices',{signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('catalogue');const data=await response.json();
      if(!Array.isArray(data.prices?.batteries))throw new Error('format');
      const liveScreens=Array.isArray(data.prices?.screens)&&data.prices.screens.length?data.prices.screens:approved;
      const liveAndroid=Array.isArray(data.prices?.android)?data.prices.android:[];
      api.catalogRows={screen:liveScreens,battery:data.prices.batteries,android:liveAndroid};api.catalogState='ready';
    }catch(error){api.catalogRows={screen:approved,battery:[],android:[]};api.catalogState='error'}
    window.dispatchEvent(new Event('quote-catalog-update'));
  };
  api.ready=api.reloadCatalog();
})();
