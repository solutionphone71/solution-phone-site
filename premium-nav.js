(function(){
  function current(path){return location.pathname.endsWith('/'+path)||location.pathname.endsWith(path)}
  function init(){
    var iphoneBase=location.hostname==='localhost'?'http://localhost:4174/':'https://reparation-iphone-macon.fr/';
    document.querySelectorAll('#crispFloatBtn,#waFloatBtn,.wa-float,a.wa[style*="position:fixed"]').forEach(function(el){el.hidden=true;el.style.setProperty('display','none','important')});
    document.querySelectorAll('header.nav,header.sticky,nav#nav,#sp-burger,#sp-drawer').forEach(function(el){el.classList.add('sp-legacy-nav')});
    var header=document.createElement('header');
    header.className='sp-global-header';
    header.innerHTML='<div class="sp-global-inner">'+
      '<button class="sp-global-back" type="button" aria-label="Revenir à la page précédente"><span aria-hidden="true">←</span><b>Retour</b></button>'+
      '<a class="sp-global-brand" href="./"><span class="sp-global-mark">SP</span><span><strong>Solution Phone</strong><small>Atelier indépendant · Mâcon</small></span></a>'+
      '<nav class="sp-global-links" aria-label="Navigation principale">'+
        '<a href="'+iphoneBase+'">iPhone</a>'+
        '<a href="reparation-samsung.html">Android</a>'+
        '<a href="reconditionnes.html">Reconditionnés</a>'+
        '<a href="accessoires.html">Accessoires</a>'+
        '<a href="hydrogel.html">Protection écran</a>'+
        '<a href="atelier.html">L’atelier</a>'+
      '</nav>'+
      '<a class="sp-global-wa" href="https://wa.me/33783921884?text=Bonjour%2C%20je%20viens%20du%20site%20Solution%20Phone" target="_blank" rel="noopener">WhatsApp ↗</a>'+
      '<button class="sp-global-menu-button" type="button" aria-label="Ouvrir le menu" aria-expanded="false">☰</button>'+
    '</div>';
    document.body.insertBefore(header,document.body.firstChild);
    header.querySelector('.sp-global-back').addEventListener('click',function(){if(history.length>1)history.back();else location.href='./'});
    var panel=document.createElement('nav');
    panel.className='sp-global-panel';
    panel.setAttribute('aria-label','Menu mobile');
    panel.innerHTML='<a href="./">Accueil & devis</a><a href="'+iphoneBase+'">Réparation iPhone</a><a href="reparation-samsung.html">Réparation Android</a><a href="reconditionnes.html">Smartphones reconditionnés</a><a href="accessoires.html">Accessoires</a><a href="hydrogel.html">Protection écran</a><a href="faq.html">Questions fréquentes</a><a href="actualites.html">Conseils</a><a href="atelier.html">Atelier & contact</a><a href="https://wa.me/33783921884" target="_blank" rel="noopener">WhatsApp direct</a>';
    header.insertAdjacentElement('afterend',panel);
    var button=header.querySelector('.sp-global-menu-button');
    button.addEventListener('click',function(){var open=panel.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'×':'☰'});
    panel.addEventListener('click',function(e){if(e.target.closest('a')){panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰'}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰'}});
    var active=current('reconditionnes.html')?'reconditionnes.html':current('accessoires.html')?'accessoires.html':current('hydrogel.html')?'hydrogel.html':current('reparation-samsung.html')?'reparation-samsung.html':'';
    if(active)header.querySelectorAll('a').forEach(function(a){if((a.getAttribute('href')||'').indexOf(active)>-1)a.classList.add('active')});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
