const YM_ID = 113840552;
let metricaLoaded = false;

function loadMetrica() {
  if (metricaLoaded) return;
  metricaLoaded = true;
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  window.ym(YM_ID, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
}

document.addEventListener('DOMContentLoaded', () => {
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted') {
    loadMetrica();
  } else if (!consent) {
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--card);padding:16px;border-top:2px solid var(--edge);display:flex;justify-content:space-between;align-items:center;z-index:9999;flex-wrap:wrap;gap:10px;box-shadow:0 -4px 10px rgba(0,0,0,.1);font-family:var(--f-body);';
    banner.innerHTML = `
      <p style="margin:0;font-size:15px;max-width:70%;">Мы используем cookie для аналитики (Яндекс.Метрика). Это помогает нам делать сайт лучше. <a href="/privacy.html" style="color:var(--blue);">Подробнее</a>.</p>
      <div style="display:flex;gap:10px;">
        <button id="cookie-reject" class="btn ghost" style="min-height:40px;font-size:14px;">Отклонить</button>
        <button id="cookie-accept" class="btn" style="min-height:40px;font-size:14px;">Принять</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById('cookie-accept').onclick = () => {
      localStorage.setItem('cookieConsent', 'accepted');
      banner.remove();
      loadMetrica();
    };
    document.getElementById('cookie-reject').onclick = () => {
      localStorage.setItem('cookieConsent', 'rejected');
      banner.remove();
    };
  }

  document.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('[data-lp="std"], [data-lp="pro"]');
    if (buyBtn && typeof window.ym !== 'undefined') {
      window.ym(YM_ID, 'reachGoal', 'click_buy');
    }
  });
});
