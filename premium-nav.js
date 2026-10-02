/* En-tête des pages secondaires de solution-phone.fr : charge le menu commun (menu-commun.js).
 * Si le menu commun ne se charge pas, un en-tête de secours (logo + téléphone) est affiché. */
(function(){
  function fallback(){
    if(document.getElementById('mc-root')||document.querySelector('.sp-fallback-header'))return;
    var h=document.createElement('div');h.className='sp-fallback-header';
    h.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#fff;border-bottom:1px solid rgba(0,0,0,.1);font:600 15px/1.2 -apple-system,BlinkMacSystemFont,Arial,sans-serif';
    h.innerHTML='<a href="/" style="display:flex;align-items:center;gap:8px;color:#1d1d1f;text-decoration:none"><img src="/img/logo-ui.webp" alt="" width="32" height="32">Solution Phone</a><a href="tel:+33385330689" style="color:#1d1d1f">03 85 33 06 89</a>';
    document.body.insertBefore(h,document.body.firstChild);
  }
  function loadMenu(){
    if(document.querySelector('script[src*="menu-commun.js"]'))return;
    var s=document.createElement('script');s.src='/menu-commun.js?v=4';s.setAttribute('data-site','phone');
    s.onerror=fallback;document.head.appendChild(s);
  }
  function init(){
    document.querySelectorAll('#crispFloatBtn,#waFloatBtn,.wa-float,a.wa[style*="position:fixed"]').forEach(function(el){el.hidden=true;el.style.setProperty('display','none','important')});
    document.querySelectorAll('header.nav,header.sticky,nav#nav,#sp-burger,#sp-drawer').forEach(function(el){el.classList.add('sp-legacy-nav')});
    loadMenu();
    window.addEventListener('load',function(){setTimeout(function(){if(!document.getElementById('mc-root'))fallback()},1500)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
