/* Переключатель темы. Выбор хранится в localStorage этого браузера (только на этом устройстве).
   Без выбора берётся тема устройства. Чтобы задать тему по умолчанию, впишите 'light' или 'dark' в DEFAULT. */
(function(){
  var K='tbl.theme',DEFAULT=null,R=document.documentElement,MQ=null;
  try{MQ=window.matchMedia('(prefers-color-scheme: dark)');}catch(e){}
  function saved(){try{var v=localStorage.getItem(K);return v==='dark'||v==='light'?v:null;}catch(e){return null;}}
  function sys(){return MQ&&MQ.matches?'dark':'light';}
  function set(t){
    R.setAttribute('data-theme',t);
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'#0E1629':'#2B59E6');
    var bs=document.querySelectorAll('[data-theme-toggle]');
    for(var i=0;i<bs.length;i++){var b=bs[i];
      b.setAttribute('aria-pressed',t==='dark'?'true':'false');
      b.setAttribute('aria-label',t==='dark'?'Включить светлую тему':'Включить тёмную тему');
      b.setAttribute('title',t==='dark'?'Включить светлую тему':'Включить тёмную тему');
      var s=b.querySelector('.theme-txt');if(s)s.textContent=t==='dark'?'Светлая':'Тёмная';}}
  set(saved()||DEFAULT||sys());
  if(MQ&&MQ.addEventListener)MQ.addEventListener('change',function(){if(!saved()&&!DEFAULT)set(sys());});
  document.addEventListener('DOMContentLoaded',function(){set(R.getAttribute('data-theme'));});
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-theme-toggle]');if(!b)return;
    var n=R.getAttribute('data-theme')==='dark'?'light':'dark';
    try{localStorage.setItem(K,n);}catch(x){}
    set(n);});
})();
