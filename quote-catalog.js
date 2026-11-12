(function(){
  'use strict';
  const api=window.SolutionPhoneQuote;if(!api)return;
  const screen=[['hd','HD','LCD économique : le choix du budget.'],['ltps','LTPS','Écran LCD (technologie des écrans classiques) : une alternative économique à l’OLED.'],['ltpsp','LTPS Prime','Écran LCD de gamme supérieure. Un écran LCD ne reproduit pas les noirs profonds d’un OLED.'],['oled','Soft OLED','OLED souple : noirs profonds et contraste élevé.'],['relife','ReLife','Dalle Apple d’origine reconditionnée, avec une vitre remplacée.']];
  const battery=[['compat','Compatible','Batterie compatible : solution économique.'],['ti','Compatible reconnue','Batterie compatible reconnue par l’iPhone selon le modèle. À confirmer avec l’équipe.'],['orig','Originale','Pièce d’origine, selon disponibilité.']];
  const clean=s=>String(s).toLowerCase().replace(/iphone/g,'').replace(/\+/g,' plus ').replace(/promax/g,'pro max').replace(/\b2020\b/g,'2').replace(/\b2022\b/g,'3').replace(/\s+/g,'').trim();
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
  api.catalogState='loading';api.catalogRows={screen:[],battery:[]};
  api.models=()=>[...new Set(Object.values(api.catalogRows).flat().map(r=>'iPhone '+r.modele))];
  api.prices=(model,issue)=>{
    const row=(api.catalogRows[issue]||[]).find(r=>clean(r.modele)===clean(model)||r.modele.split('/').some(part=>clean(part)===clean(model)));
    return row?(issue==='screen'?screen:battery).map((q,i)=>({id:q[0],name:q[1],desc:q[2],price:Number(row.prix[i])})).filter(q=>Number.isFinite(q.price)&&q.price>0):[];
  };
  api.reloadCatalog=async()=>{
    const approved=approvedScreens();
    api.catalogRows={screen:approved,battery:[]};
    api.catalogState='loading';window.dispatchEvent(new Event('quote-catalog-update'));
    try{
      const response=await fetch('https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog?resource=prices',{signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('catalogue');const data=await response.json();
      if(!Array.isArray(data.prices?.batteries))throw new Error('format');
      api.catalogRows={screen:approved,battery:data.prices.batteries};api.catalogState='ready';
    }catch(error){api.catalogRows={screen:approved,battery:[]};api.catalogState='error'}
    window.dispatchEvent(new Event('quote-catalog-update'));
  };
  api.ready=api.reloadCatalog();
})();
