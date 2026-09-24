/* Plan d’accès sans cookie tant que le visiteur ne l’a pas demandé.
   Chaque <div class="sp-map" data-map-src="…"> affiche l’adresse et un bouton ;
   la carte Google Maps n’est chargée qu’au clic (ou d’office si les cookies
   ont été acceptés sur solution-phone.fr). */
(function(){
  'use strict';
  var css='.sp-map{position:relative;display:grid;place-items:center;min-height:220px;height:100%;padding:22px;box-sizing:border-box;overflow:hidden;border-radius:inherit;background:#eef0f2 linear-gradient(0deg,transparent 47%,#fff 47% 53%,transparent 53%) 0 0/120px 120px,#eef0f2 linear-gradient(90deg,transparent 47%,#fff 47% 53%,transparent 53%) 0 0/120px 120px;font-family:inherit;color:#1d1d1f}'+
    '.sp-map-card{position:relative;max-width:340px;padding:18px 20px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12);text-align:center}'+
    '.sp-map-card b{display:block;font-size:1rem;letter-spacing:-.01em}.sp-map-card span{display:block;margin-top:4px;color:#6e6e73;font-size:.85rem}'+
    '.sp-map-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px}'+
    '.sp-map-actions button,.sp-map-actions a{min-height:44px;padding:0 18px;border-radius:980px;display:inline-flex;align-items:center;font:600 .9rem/1 inherit;cursor:pointer;text-decoration:none}'+
    '.sp-map-actions button{border:0;background:#0071e3;color:#fff}.sp-map-actions a{border:1px solid #0071e3;color:#0071e3;background:#fff}'+
    '.sp-map-actions button:focus-visible,.sp-map-actions a:focus-visible{outline:3px solid #0071e3;outline-offset:3px}'+
    '.sp-map-card small{display:block;margin-top:10px;color:#86868b;font-size:.72rem;line-height:1.4}'+
    '.sp-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}';
  var style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  function load(box){
    if(!box||box.querySelector('iframe'))return;
    var frame=document.createElement('iframe');
    frame.src=box.getAttribute('data-map-src');
    frame.title=box.getAttribute('data-map-title')||'Plan d’accès';
    frame.loading='lazy';frame.allowFullscreen=true;frame.referrerPolicy='no-referrer-when-downgrade';
    box.replaceChildren(frame);
  }
  document.addEventListener('click',function(event){
    var button=event.target.closest('.sp-map-load');
    if(button)load(button.closest('.sp-map'));
  });
  var accepted=false;
  try{accepted=localStorage.getItem('solution_phone_consent_v1')==='accepted';}catch(error){}
  if(accepted)document.querySelectorAll('.sp-map').forEach(load);
})();
