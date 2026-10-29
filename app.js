
(function(){
'use strict';
/* ---------- утилиты ---------- */
var app=document.getElementById('app');
function h(html){var t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[ri(0,a.length-1)];}
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- настройки сборки ---------- */
var PREVIEW=!!window.__PREVIEW__;
var PAYWALL=true;             /* три тарифа: бесплатный, Стандарт, Продвинутый */
var FREE_IDS={m1:1,m2:1,m4:1,m5:1,m6:1};   /* блоки бесплатного тарифа: смысл, ×1 и ×10, ×2, ×5 */
var FREE_MIN=10;              /* минут занятий в день на бесплатном тарифе */
var PRICE_STD='990 ₽',PRICE_PRO='1 990 ₽';
var PAY_URL_STD='https://example.com/pay?plan=standard';  /* страницы оплаты у платёжного агрегатора */
var PAY_URL_PRO='https://example.com/pay?plan=pro';
/* SHA-256 кодов доступа (см. README). Сейчас там тестовые коды TEST-STANDARD, TEST-PRO и 1111 (Продвинутый): перед запуском замените. */
var CODES_STD=["ca063870f27456c4764dc609ae1579f7a1fa8e6f497713a47ad4b90c98db7bb6"];
var CODES_PRO=["0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c","9617e38101e15005c55a48cf1116327a0bb611c344da66dce2799e30b954a446"];
var RANK={free:0,standard:1,pro:2},TIER_NAME={free:'Бесплатный',standard:'Стандарт',pro:'Продвинутый'};
/* какой тариф нужен для каждой возможности продвинутого режима */
var FEAT={anchors:'standard',story:'standard',mix:'standard',hard:'standard',compare:'standard',goals:'standard',final:'standard',
  pre:'pro',sr:'pro',pickx:'pro',say:'pro',games:'pro',stickers:'pro',tts:'pro',tips:'pro',week:'pro',print:'pro'};
function tier(){return RANK[P.tier]!==undefined?P.tier:'free';}
function can(f){return !!P.adv&&RANK[tier()]>=RANK[FEAT[f]];}

/* ---------- хранение прогресса: IndexedDB, запасной режим в памяти ---------- */
var SCHEMA=5,APP_ID='tablica-bez-zubrezhki',OLD_KEY='tbl.v1';
function freshP(){return {schemaVersion:SCHEMA,done:{},stars:{},attempts:{},stats:{},days:{},alts:{},access:false,onboarded:false,sessions:0,lastBackupAt:null,lastReminder:0,adv:false,sr:{},daily:{},final:[],told:{},notes:{},stk:{},tier:'free'};}
var P=freshP();
var storage={mode:'init',persist:'unknown',error:null};
var Store=(function(){
  var DB='tablica',ST='kv',KEY='progress',dbp=null;
  function open(){return new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error('IndexedDB недоступен'));return;}
    var r;try{r=indexedDB.open(DB,1);}catch(e){rej(e);return;}
    r.onupgradeneeded=function(){r.result.createObjectStore(ST);};
    r.onsuccess=function(){res(r.result);};
    r.onerror=function(){rej(r.error||new Error('IndexedDB: ошибка'));};
    r.onblocked=function(){rej(new Error('IndexedDB заблокирован'));};});}
  function db(){return dbp||(dbp=open());}
  return {
    get:function(){return db().then(function(d){return new Promise(function(res,rej){var q=d.transaction(ST,'readonly').objectStore(ST).get(KEY);q.onsuccess=function(){res(q.result);};q.onerror=function(){rej(q.error);};});});},
    put:function(v){return db().then(function(d){return new Promise(function(res,rej){var tx=d.transaction(ST,'readwrite');tx.objectStore(ST).put(v,KEY);tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};tx.onabort=function(){rej(tx.error||new Error('abort'));};});});}
  };})();
function adopt(o){var f=freshP();for(var k in f){if(o&&o[k]!==undefined&&o[k]!==null)f[k]=o[k];}
  if(o&&o.access===true&&o.tier===undefined)f.tier='standard';if(RANK[f.tier]===undefined)f.tier='free';
  ['done','stars','attempts','stats','days','alts','sr','daily','told','notes','stk'].forEach(function(k){if(!f[k]||typeof f[k]!=='object'||Array.isArray(f[k]))f[k]={};});if(!Array.isArray(f.final))f.final=[];
  f.schemaVersion=SCHEMA;return f;}
var saveT=null;
function flush(){saveT=null;if(storage.mode!=='idb')return;
  Store.put(JSON.parse(JSON.stringify(P))).catch(function(e){storage.mode='memory';storage.error=String(e&&e.message||e);if(view&&view.name==='parent')render();});}
function save(){if(saveT)return;saveT=setTimeout(flush,250);}
function askPersist(){
  if(storage.mode!=='idb')return;
  if(!(navigator.storage&&navigator.storage.persist&&navigator.storage.persisted)){storage.persist='unavailable';return;}
  navigator.storage.persisted().then(function(p){
    if(p){storage.persist='granted';return;}
    return navigator.storage.persist().then(function(g){storage.persist=g?'granted':'denied';if(view&&view.name==='parent')render();});
  }).catch(function(){storage.persist='unavailable';});}
function boot(){
  var legacy=null;
  try{var raw=localStorage.getItem(OLD_KEY);if(raw)legacy=JSON.parse(raw);}catch(e){}
  Store.get().then(function(v){
    storage.mode='idb';
    if(v){P=adopt(v);return;}
    if(legacy){P=adopt(legacy);return Store.put(JSON.parse(JSON.stringify(P))).then(function(){try{localStorage.removeItem(OLD_KEY);}catch(e){}});}
  }).catch(function(e){
    storage.mode='memory';storage.error=String(e&&e.message||e);
    if(legacy)P=adopt(legacy);
  }).then(function(){askPersist();route();});
}
function standalone(){try{return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}}
document.addEventListener('visibilitychange',function(){if(document.hidden){if(saveT){clearTimeout(saveT);}flush();}});
window.addEventListener('pagehide',function(){if(saveT){clearTimeout(saveT);}flush();});
function fk(f){return Math.min(f[0],f[1])+'×'+Math.max(f[0],f[1]);}
function rec(f,ok){if(!f)return;var k=fk(f);var s=P.stats[k]||(P.stats[k]={ok:0,bad:0});if(ok)s.ok++;else s.bad++;srUpdate(f,ok);save();}

/* ---------- наглядность ---------- */
function rect(a,b,o){o=o||{};var s='';for(var r=0;r<b;r++)for(var c=0;c<a;c++)s+='<i'+(((o.split&&c>=o.split)||(o.rowSplit&&r>=o.rowSplit))?' class="c2"':'')+'></i>';
  return '<div class="rect" style="--cols:'+a+'" role="img" aria-label="Прямоугольник: '+b+' рядов по '+a+' клеток">'+s+'</div>';}
function groups(a,b){var g='';for(var i=0;i<b;i++)g+='<div class="grp" style="--gc:'+Math.min(a,5)+'">'+'<b></b>'.repeat(a)+'</div>';
  return '<div class="groups" role="img" aria-label="'+b+' групп по '+a+'">'+g+'</div>';}
function sumLine(a,b){var x=a,t=b;if(b>6&&a<=6){x=b;t=a;}return Array(t).fill(x).join(' + ')+' = ?';}
function pyth(o){o=o||{};var s='<div class="pyth'+(o.live?'':' static')+'">';
  for(var i=0;i<=10;i++)for(var j=0;j<=10;j++){
    if(i===0&&j===0)s+='<span class="p0">×</span>';
    else if(i===0)s+='<span class="ph">'+j+'</span>';
    else if(j===0)s+='<span class="ph">'+i+'</span>';
    else{var c=[];if(i===o.r&&j===o.c)c.push('sel');else if(i===o.c&&j===o.r)c.push('mir');
      else{if(i===o.r)c.push('rowc');if(j===o.c)c.push('colc');}
      if(o.diag&&i===j&&!c.length)c.push('dg');
      s+='<button type="button" class="pc '+c.join(' ')+'" data-r="'+i+'" data-c="'+j+'"'+(o.live?'':' tabindex="-1" aria-hidden="true"')+'>'+(i*j)+'</button>';}
  }
  return s+'</div>';}

function stepper(label,min,max,val,cb){
  var w=h('<div class="stp"><span class="stp-l">'+label+'</span><button type="button" class="stp-b" aria-label="меньше">−</button><output class="stp-v">'+val+'</output><button type="button" class="stp-b" aria-label="больше">+</button></div>');
  var bs=w.querySelectorAll('button'),out=w.querySelector('output'),v=val;
  function set(n){v=Math.min(max,Math.max(min,n));out.textContent=v;cb(v);}
  bs[0].onclick=function(){set(v-1);};bs[1].onclick=function(){set(v+1);};
  return w;}
function seg(opts,cur,cb){
  var w=h('<div class="seg"></div>');
  function draw(){w.innerHTML='';opts.forEach(function(o,i){var b=h('<button type="button" aria-pressed="'+(i===cur)+'">'+o+'</button>');b.onclick=function(){cur=i;draw();cb(i);};w.appendChild(b);});}
  draw();return w;}
function row(){var d=h('<div class="stps"></div>');for(var i=0;i<arguments.length;i++)d.appendChild(arguments[i]);return d;}

/* ---------- демонстрации ---------- */
function mGroups(box){var a=4,b=2;var out=h('<div class="demo-out" style="display:grid;gap:12px"></div>');
  function draw(){var sum=b>1?Array(b).fill(a).join(' + ')+' = ':'';out.innerHTML=groups(a,b)+'<div class="eq sm">'+a+' × '+b+' = '+sum+'<b>'+(a*b)+'</b></div>';}
  box.append(row(stepper('Берём число',1,10,a,function(v){a=v;draw();}),stepper('Сколько раз',1,6,b,function(v){b=v;draw();})),out);draw();}
function mRectDemo(box){var a=4,b=2;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){out.innerHTML=rect(a,b)+'<div class="eq sm">В ряду '+a+', рядов '+b+'.<br>'+a+' × '+b+' = <b>'+(a*b)+'</b></div>';}
  box.append(row(stepper('Клеток в ряду',1,10,a,function(v){a=v;draw();}),stepper('Рядов',1,10,b,function(v){b=v;draw();})),out);draw();}
function mRotate(box){var P2=[[3,4],[2,7],[5,6]],i=0,flip=false;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){var a=P2[i][0],b=P2[i][1],x=flip?b:a,y=flip?a:b;
    out.innerHTML=rect(x,y)+'<div class="eq sm">'+x+' × '+y+' = <b>'+(a*b)+'</b></div>';}
  var btn=h('<button type="button" class="btn ghost">Повернуть</button>');btn.onclick=function(){flip=!flip;draw();};
  box.append(seg(P2.map(function(p){return p[0]+' и '+p[1];}),0,function(n){i=n;flip=false;draw();}),btn,out);draw();}
function mHalf55(box){box.append(h('<div class="meter"><div>Без перестановки<span><i style="width:100%"></i></span></div><div>С перестановкой<span><i style="width:55%"></i></span></div></div>'),
  h('<p class="small" style="margin:0">100 примеров превращаются в 55. Примеры вроде 7 × 7 стоят на диагонали: пары у них нет.</p>'));}
function mPyth(box,o){var r=0,c=0;var wrap=h('<div></div>');var rd=h('<p class="read" aria-live="polite">Нажми на любую клетку.</p>');
  function draw(){wrap.innerHTML=pyth({r:r,c:c,diag:o&&o.diag,live:true});var b=wrap.querySelector('[data-r="'+r+'"][data-c="'+c+'"]');if(r&&b)b.focus();}
  wrap.onclick=function(e){var b=e.target.closest('.pc');if(!b)return;r=+b.dataset.r;c=+b.dataset.c;draw();
    rd.innerHTML=r===c?'<b>'+r+' × '+c+' = '+r*c+'</b>. Это клетка на диагонали: ответ — квадрат числа.':'<b>'+r+' × '+c+' = '+r*c+'</b> и <b>'+c+' × '+r+' = '+r*c+'</b>. Жёлтые клетки — зеркальные пары.';};
  box.append(wrap,rd);draw();}
function mTen(box,mode){var n=3;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){out.innerHTML=mode==='one'
    ?groups(n,1)+'<div class="eq sm">'+n+' × 1 = <b>'+n+'</b></div><p class="small" style="margin:0">Одна группа по '+n+'. Сколько было, столько и осталось.</p>'
    :'<div class="chain"><span class="tile">'+n+'</span><span class="op">дописываем справа</span><span class="tile z">0</span></div><div class="eq sm">'+n+' × 10 = <b>'+n+'0</b></div><p class="small" style="margin:0">Десять групп по '+n+' — это '+n+' десятков.</p>';}
  box.append(row(stepper('Число',1,9,n,function(v){n=v;draw();})),out);draw();}
function mDouble(box){var n=3;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){out.innerHTML='<div class="chain"><span class="chip">'+n+'</span><span class="op">удвоить</span><span class="chip soft">'+2*n+'</span><span class="op">удвоить ещё раз</span><span class="chip hl">'+4*n+'</span></div><div class="eq sm">'+n+' × 2 = '+n+' + '+n+' = <b>'+2*n+'</b></div><div class="eq sm">'+n+' × 4 = '+2*n+' + '+2*n+' = <b>'+4*n+'</b></div>';}
  box.append(row(stepper('Число',1,10,n,function(v){n=v;draw();})),out);draw();}
function mHalf(box){var n=6;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){out.innerHTML='<div class="chain"><span class="chip">10 × '+n+' = '+10*n+'</span><span class="op">половина</span><span class="chip hl">5 × '+n+' = '+5*n+'</span></div><p class="read">'+(n%2===0?'Число '+n+' чётное, поэтому ответ оканчивается на 0.':'Число '+n+' нечётное, поэтому ответ оканчивается на 5.')+'</p>';}
  box.append(row(stepper('Число',1,10,n,function(v){n=v;draw();})),out);draw();}
function mFive(box){var s='';for(var i=1;i<=10;i++)s+='<span class="chip'+(i%2?'':' hl')+'">'+5*i+'</span>';
  box.append(h('<div class="chips" aria-label="Пятёрки">'+s+'</div>'),h('<p class="small" style="margin:0">Жёлтые оканчиваются на 0, остальные на 5. Так же идёт стрелка на часах: каждые 5 минут.</p>'));}
function mFingers(box){var H=[56,72,80,72,48,48,72,80,72,56],k=0;var hands=h('<div class="hands"></div>');var rd=h('<p class="read" aria-live="polite">Выбери число, на которое умножаем 9, и загни этот палец.</p>');
  function draw(){hands.innerHTML=H.map(function(hh,i){var n=i+1,f=n===k;return '<button type="button" class="fg'+(f?' fold':'')+'" data-k="'+n+'" style="--h:'+(f?24:hh)+'px" aria-pressed="'+f+'" aria-label="Палец '+n+'"><span>'+n+'</span></button>';}).join('');}
  hands.onclick=function(e){var b=e.target.closest('.fg');if(!b)return;k=+b.dataset.k;draw();
    rd.innerHTML='9 × '+k+'. Загнули палец '+k+'. Слева пальцев '+(k-1)+', это десятки. Справа '+(10-k)+', это единицы. Получилось <b>'+9*k+'</b>.';};
  box.append(hands,rd);draw();}
function mNine(box){var n=7;var out=h('<div style="display:grid;gap:12px"></div>');
  function ds(x){return String(x).split('').join(' + ');}
  function draw(){var p=9*n;out.innerHTML='<div class="eq sm">9 × '+n+' = 10 × '+n+' − '+n+' = '+10*n+' − '+n+' = <b>'+p+'</b></div><p class="read">Сумма цифр ответа: '+ds(p)+' = '+String(p).split('').reduce(function(s,d){return s+ +d;},0)+'. У девяток она всегда 9.</p>';}
  box.append(row(stepper('Число',1,10,n,function(v){n=v;draw();})),out);draw();}
function mSplit(box){var KS=[3,6,7,8],PT={3:[2,1],6:[5,1],7:[5,2],8:[4,4]},ki=2,n=6;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){var k=KS[ki],p=PT[k];out.innerHTML=rect(k,n,{split:p[0]})+'<div class="eq sm">'+k+' × '+n+' = '+p[0]+' × '+n+' + '+p[1]+' × '+n+' = '+p[0]*n+' + '+p[1]*n+' = <b>'+k*n+'</b></div><p class="small" style="margin:0">'+k+' = '+p[0]+' + '+p[1]+(k===8?'. Это то же самое, что удвоить 4 × '+n+'.':'. Обе части ты уже умеешь умножать.')+'</p>';}
  box.append(seg(['×3','×6','×7','×8'],ki,function(i){ki=i;draw();}),row(stepper('Число',2,10,n,function(v){n=v;draw();})),out);draw();}
function mDivide(box){var PR=[[12,3],[12,4],[20,5],[18,6],[24,8]],i=0,m=0;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){var n=PR[i][0],d=PR[i][1],q=n/d;
    out.innerHTML=(m===0?groups(d,q)+'<p class="read">Разложили '+n+' по '+d+'. Получилось групп: '+q+'.</p>':groups(q,d)+'<p class="read">Раздали '+n+' поровну на '+d+' части. В каждой по '+q+'.</p>')+'<div class="eq sm">'+n+' ÷ '+d+' = <b>'+q+'</b></div>';}
  box.append(seg(PR.map(function(p){return p[0]+' ÷ '+p[1];}),0,function(x){i=x;draw();}),seg(['Раскладываем по несколько','Делим поровну'],0,function(x){m=x;draw();}),out);draw();}
function mFamily(box){var PR=[[3,4],[6,7],[5,9],[8,6],[7,8]],i=0;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){var a=PR[i][0],b=PR[i][1],p=a*b;out.innerHTML='<div class="pair">'+rect(a,b)+'<div style="display:grid;gap:6px"><div class="eq sm">'+a+' × '+b+' = '+p+'</div><div class="eq sm">'+b+' × '+a+' = '+p+'</div><div class="eq sm">'+p+' ÷ '+a+' = '+b+'</div><div class="eq sm">'+p+' ÷ '+b+' = '+a+'</div></div></div>';}
  box.append(seg(PR.map(function(p){return p[0]+', '+p[1];}),0,function(x){i=x;draw();}),out);draw();}
function mAskMul(box){var PR=[[7,8],[6,9],[4,7]],i=0,st=0;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){var a=PR[i][0],b=PR[i][1],p=a*b;var s='<div class="eq sm">'+p+' ÷ '+a+' = ?</div>';
    if(st>=1)s+='<p class="read">Спроси себя: '+a+' × ? = '+p+'.</p>';
    if(st>=2)s+='<div class="eq sm">'+a+' × '+b+' = '+p+', значит '+p+' ÷ '+a+' = <b>'+b+'</b></div>';
    out.innerHTML=s;btn.textContent=st>=2?'Ещё раз':'Спросить умножение';}
  var btn=h('<button type="button" class="btn ghost"></button>');btn.onclick=function(){st=st>=2?0:st+1;draw();};
  box.append(seg(PR.map(function(p){return p[0]*p[1]+' ÷ '+p[0];}),0,function(x){i=x;st=0;draw();}),out,btn);draw();}

/* ---------- вопросы ---------- */
function Q(o){var d={vis:'',lead:'Сколько будет?',h:null,fact:null};for(var k in o)d[k]=o[k];return d;}
function Mul(a,b,o){var d={key:'m'+a+'x'+b,eq:a+' × '+b+' = ?',answer:a*b,meta:{t:'mul',a:a,b:b},fact:[a,b]};for(var k in (o||{}))d[k]=o[k];return Q(d);}
function Div(n,d,o){var x={key:'d'+n+':'+d,eq:n+' ÷ '+d+' = ?',answer:n/d,meta:{t:'div',n:n,d:d},fact:[d,n/d]};for(var k in (o||{}))x[k]=o[k];return Q(x);}
function Miss(x,b,o){var d={key:'x'+x+'x'+b,lead:'Какое число пропущено?',eq:'? × '+b+' = '+x*b,answer:x,meta:{t:'missing',x:x,b:b},fact:[x,b]};for(var k in (o||{}))d[k]=o[k];return Q(d);}
function build(pats,n){var out=[],seen={},t=0,i=0;while(out.length<n&&t<400){var q=pats[i%pats.length]();i++;t++;if(seen[q.key])continue;seen[q.key]=1;out.push(q);}return out;}

function strat(a,b){var pr=[1,10,9,5,2,4,3,6,8,7],k;for(var i=0;i<pr.length;i++){if(pr[i]===a||pr[i]===b){k=pr[i];break;}}
  if(k===undefined)k=a;var n=(k===a)?b:a;
  switch(k){
    case 1:return 'Умножить на 1. Число не меняется. '+n+' × 1 = '+n+'.';
    case 10:return 'Умножить на 10. Допиши ноль справа. К числу '+n+' допиши 0. Какое число получилось?';
    case 9:return '9 × '+n+' = 10 × '+n+' − '+n+'. Сначала 10 × '+n+' = '+10*n+'. Теперь вычти '+n+'. Сколько будет '+10*n+' − '+n+'?';
    case 5:return '5 × '+n+' — это половина от 10 × '+n+'. 10 × '+n+' = '+10*n+'. Чему равна половина от '+10*n+'?';
    case 2:return '2 × '+n+' = '+n+' + '+n+'. Сложи.';
    case 4:return '4 × '+n+'. Удвой '+n+', будет '+2*n+'. Удвой ещё раз. Сколько будет '+2*n+' + '+2*n+'?';
    case 3:return '3 × '+n+' = 2 × '+n+' + '+n+'. Сначала '+n+' + '+n+' = '+2*n+'. Теперь прибавь ещё '+n+'. Сколько будет '+2*n+' + '+n+'?';
    case 6:return '6 × '+n+' = 5 × '+n+' + '+n+'. 5 × '+n+' = '+5*n+'. Прибавь '+n+'. Сколько будет '+5*n+' + '+n+'?';
    case 8:return '8 × '+n+'. Сначала 4 × '+n+' = '+4*n+'. Удвой. Сколько будет '+4*n+' + '+4*n+'?';
    default:return '7 × '+n+' = 5 × '+n+' + 2 × '+n+'. 5 × '+n+' = '+5*n+', 2 × '+n+' = '+2*n+'. Сложи. Сколько будет '+5*n+' + '+2*n+'?';}}
function seq(d,upto){var s=[];for(var i=1;i<=Math.max(upto,1);i++)s.push(d*i);return s.join(', ');}
function hint(q,level){
  if(q.h&&q.h[level-1])return q.h[level-1]();
  var m=q.meta;
  if(m.t==='mul')return level===1?'<p>'+m.a+' × '+m.b+' значит: число '+m.a+' берём '+m.b+' раз. Вот '+m.b+' рядов по '+m.a+' клеток.</p>'+rect(m.a,m.b)+'<p class="mono">'+sumLine(m.a,m.b)+'</p>':'<p>'+strat(m.a,m.b)+'</p>';
  if(m.t==='div'){var qq=m.n/m.d;return level===1?'<p>Разложим '+m.n+' по '+m.d+'. Сколько групп получится? Посчитай их.</p>'+groups(m.d,qq):'<p>Считай по '+m.d+'. Скажи вслух: '+seq(m.d,qq-1)+', … Сколько раз по '+m.d+' нужно взять, чтобы получить '+m.n+'? Вспомни: '+m.d+' × ? = '+m.n+'.</p>';}
  if(m.t==='missing')return level===1?'<p>Поменяем множители местами: '+m.b+' × ? = '+m.x*m.b+'. Сколько раз по '+m.b+' нужно взять? Посчитай группы.</p>'+groups(m.b,m.x):'<p>Считай по '+m.b+'. Скажи вслух: '+seq(m.b,m.x-1)+', … Когда дойдёшь до '+m.x*m.b+', сколько раз ты взял '+m.b+'?</p>';
  return '';}

/* ---------- вспомогательное ---------- */
var ICON='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.5-5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function times(n){var a=n%10,b=n%100;return n+' '+((a>=2&&a<=4&&!(b>=12&&b<=14))?'раза':'раз');}
function simpleHint(q){var m=q.meta;
  if(q.h&&q.h[0])return q.h[0]();
  if(m.t==='mul')return '<p>Число '+m.a+' берём '+times(m.b)+'. Считаем вместе, по одному кружку.</p>'+groups(m.a,m.b);
  if(m.t==='div')return '<p>Разложим '+m.n+' кружков по '+m.d+'. Сколько кучек получилось?</p>'+groups(m.d,m.n/m.d);
  if(m.t==='missing')return '<p>Сколько кучек по '+m.b+' нужно, чтобы стало '+m.x*m.b+'?</p>'+groups(m.b,m.x);
  return hint(q,1);}
function mNeighbor(box){var a=4,n=5;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){out.innerHTML=rect(a,n+1,{rowSplit:n})+'<div class="chain"><span class="chip">'+a+' × '+n+' = '+a*n+'</span><span class="op">ещё одно число '+a+'</span><span class="chip hl">'+a+' × '+(n+1)+' = '+a*n+' + '+a+' = '+a*(n+1)+'</span></div>';}
  box.append(row(stepper('Число',2,9,a,function(v){a=v;draw();}),stepper('Знаю на',2,9,n,function(v){n=v;draw();})),out);draw();}
function nbQ(){var a=ri(3,9),n=ri(3,8);
  return Q({key:'nb'+a+'n'+n,lead:a+' × '+n+' = '+a*n+'. Значит '+a+' × '+(n+1)+' = '+a*n+' + '+a+' = ?',eq:'?',answer:a*(n+1),meta:{t:'mul',a:a,b:n+1},fact:[a,n+1],
    h:[function(){return '<p>Было '+a+' × '+n+' = '+a*n+'. Добавь ещё одно число '+a+'.</p>'+rect(a,n+1,{rowSplit:n});},function(){return '<p>'+a*n+' + '+a+' = ?</p>';}]});}

var TX={
'm1.0':{A:'Смотри: коробки. В каждой коробке по 4 конфеты. Коробок две. Сколько всего конфет? Нажимай плюс и минус: коробок станет больше. Когда коробки одинаковые, мы умножаем.',B:'Одинаковые коробки: в каждой по 4 конфеты, коробок две. Считать можно так: 4 и ещё 4. Это короткая запись: 4 × 2. Нажимай плюс и минус и смотри, как меняется ответ.',D:'Умножение — сокращённая запись суммы одинаковых слагаемых: 4 × 2 = 4 + 4. Первое число показывает, что повторяем, второе — сколько раз. Меняй числа и смотри, как растёт сумма.'},
'm1.1':{A:'Теперь конфеты лежат рядами, как плитка шоколада. В каждом ряду по 4 конфеты. Рядов два. Считаем все вместе. Нажимай плюс и минус.',B:'Те же конфеты можно выложить рядами, как шоколадку. 4 в ряду, рядов два. Всего столько, сколько в 4 × 2. Нажимай плюс и минус.',D:'Произведение a × b равно числу клеток прямоугольника: a клеток в ряду, b рядов. Так считают площадь. Меняй стороны и ищи закономерность.'},
'm2.0':{A:'Смотри на плитку шоколада. Положим её набок. Конфет стало больше или меньше? Столько же! Нажми «Повернуть».',B:'Повернём плитку набок. Было 3 ряда по 4, стало 4 ряда по 3. Конфет столько же. Нажми «Повернуть». Значит, 3 × 4 и 4 × 3 — одно и то же.',D:'Переместительное свойство: a × b = b × a. Поворот прямоугольника не меняет число клеток. Проверь на трёх парах.'},
'm2.1':{A:'Знаешь про одну плитку — знаешь и про повёрнутую. Учить нужно меньше. Это хорошо!',B:'Если знаешь 6 × 8, то знаешь и 8 × 6. Учить нужно почти вдвое меньше примеров. Здорово, правда?',D:'Из 100 примеров таблицы достаточно знать около 55. Остальные получаются перестановкой. Примеры на диагонали, вроде 7 × 7, пар не имеют.'},
'm3.0':{A:'Это большая плитка с числами. Нажми на любую клетку и увидишь число. Это число — сколько всего.',B:'Это квадрат с числами. Выбери клетку: число в ней — строка, умноженная на столбец. Нажми и посмотри.',D:'Квадрат Пифагора: на пересечении строки i и столбца j стоит i × j. Исследуй: в какой строке числа растут через 3?'},
'm3.1':{A:'Видишь зеркало? Жёлтая клетка и её зеркальная пара — одинаковые числа. Нажимай!',B:'Синяя линия — диагональ. По бокам от неё числа повторяются, как в зеркале. Нажми на клетку и найди пару.',D:'Таблица симметрична относительно диагонали, на которой стоят квадраты 1, 4, 9 и дальше. Используй симметрию: i × j = j × i.'},
'm4.0':{A:'Одна тарелка, на ней несколько печенек. Сколько всего? Столько же, сколько на тарелке. Выбери число.',B:'Одна коробка с 5 конфетами — это 5 конфет. Умножить на 1 — число не меняется. Выбери число.',D:'a × 1 = a, потому что слагаемое взято один раз. Проверь на нескольких числах.'},
'm4.1':{A:'Десять тарелок. На каждой по 3 печеньки. Много! Получается 30. Видишь, рядом с тройкой появился ноль?',B:'Десять коробок по 3 конфеты — это 30. К тройке дописали ноль справа. Так всегда: умножить на 10 — дописать 0.',D:'a × 10 — это «a десятков», то есть число a0. Цифра сдвигается на один разряд влево.'},
'm5.0':{A:'Пара носков. В паре два носка. Сколько носков в нескольких парах? Выбери число. Сколько было, столько и ещё столько.',B:'Умножить на 2 — взять число два раза: 3 + 3 = 6. Выбери число и смотри.',D:'a × 2 = a + a — это удвоение. Заметь: результат умножения на 2 всегда чётный.'},
'm5.1':{A:'Было 3, стало 6. Удвоили ещё раз — стало 12. Так считаем по четыре.',B:'Чтобы умножить на 4, удвой, а потом ещё раз удвой: 3, 6, 12.',D:'a × 4 = (a × 2) × 2. Двойное удвоение — быстрый путь для ×4, а для ×8 удвой ещё раз.'},
'm6.0':{A:'На одной ладошке 5 пальчиков. Сначала посчитаем десятки, а потом возьмём половину. Выбери число ладошек.',B:'Пять — это половина десяти. Умножаем на 10, потом берём половину. Выбери число.',D:'5 × n = (10 × n) ÷ 2. Последняя цифра результата: 0 при чётном n и 5 при нечётном.'},
'm6.1':{A:'Пятёрки заканчиваются на 0 или на 5. Жёлтые — на ноль. Как стрелка на часах.',B:'Все ответы в пятёрках оканчиваются на 0 или на 5. Жёлтые на 0, остальные на 5.',D:'Ряд ×5 чередует окончания 5 и 0. На часах он соответствует минутам: каждые пять минут.'},
'm7.0':{A:'Покажи десять пальчиков. Загни один пальчик — получится ответ! Слева пальцы — десятки, справа — единицы. Выбери палец.',B:'Фокус! Загни палец с номером числа, на которое умножаешь 9. Пальцы слева — десятки, справа — единицы.',D:'Метод пальцев работает, потому что 9k = 10(k − 1) + (10 − k). Проверь формулу на нескольких числах.'},
'm7.1':{A:'Девять — это десять без одного. Сначала десять, потом убрали один. Выбери число.',B:'9 × 7 — это 10 × 7 без одного 7. А сумма цифр в ответе всегда 9.',D:'9n = 10n − n. Сумма цифр у первых десяти кратных девяти равна 9. Так можно проверить ответ.'},
'm8.0':{A:'Если трудно, разбей на кусочки. Одна часть — синие клеточки, другая — жёлтые. Считаем сначала синие, потом жёлтые.',B:'Разбей число на две части. Каждую часть ты уже знаешь. Синие и жёлтые клетки — две части.',D:'Распределительное свойство: (p + q) × n = p × n + q × n. Разбивай множитель на знакомые числа.'},
'm8.1':{A:'Ты знаешь 4 × 5 = 20. А 4 × 6? Добавь ещё одну четвёрку: 20 и ещё 4.',B:'Знаешь 4 × 5 = 20? Тогда 4 × 6 — это 20 и ещё 4. Каждый шаг добавляет одно число.',D:''},
'm9.0':{A:'У тебя конфеты. Положим их в мешочки поровну. Сколько мешочков получится? Выбери пример.',B:'12 ÷ 3. Раскладываем 12 конфет по 3 в мешочек. Получается 4 мешочка. Выбери пример.',D:'Деление — разбиение на равные части: 12 ÷ 3 = 4 значит, что тройка помещается в 12 четыре раза. Исследуй примеры.'},
'm9.1':{A:'Теперь поделим поровну между друзьями. У каждого друга одинаково. Нажми «Делим поровну».',B:'Раздай 12 конфет 3 друзьям поровну. Каждому достанется 4. Нажми «Делим поровну».',D:'У деления два смысла: «сколько раз содержится» и «разделить на равные части». Результат одинаков.'},
'm10.0':{A:'Три числа — это четыре игры: две про умножение, две про деление. Выбери пару и смотри.',B:'Три числа — четыре примера: два на умножение и два на деление. Выбери пару.',D:'Умножение и деление взаимно обратны: из a × b = p следуют p ÷ a = b и p ÷ b = a. Проверь на разных числах.'},
'm10.1':{A:'Не помнишь деление? Спроси умножение! Нажми кнопку и увидишь.',B:'Чтобы разделить 56 на 7, спроси себя: 7 умножить на сколько будет 56? Нажми кнопку.',D:'Деление — поиск неизвестного множителя: p ÷ a = x равносильно a × x = p. Опирайся на таблицу умножения.'}
};
var ALT_A={
m1:'Вот 3 коробки. В каждой по 2 игрушки. Сколько игрушек всего? Посчитаем вместе: две, четыре, шесть. Всего шесть игрушек.',
m2:'Две корзинки по 3 яблока. А теперь три корзинки по 2 яблока. Яблок столько же! Поменялось только то, как мы их разложили.',
m3:'Это как шахматная доска. Положи один палец на строку, другой на столбец. Там, где пальцы встретились, живёт число.',
m4:'Одна коробка — сколько в ней, столько и всего. Десять коробок по 2 конфеты — двадцать. Ноль приклеился справа.',
m5:'Носки продают парами. 3 пары — это 6 носков. 4 пары — 8 носков. Столько и ещё столько.',
m6:'На одной руке 5 пальцев. На двух руках 10. На трёх руках 15. Это десять и ещё пять.',
m7:'Девять — почти десять. Было десять конфет, одну съели. Стало на одну меньше.',
m8:'Большую башню можно сложить из двух маленьких. Сначала посчитай одну, потом другую, потом обе вместе.',
m9:'Раздавай конфеты по очереди: тебе, маме, папе, снова тебе, маме, папе. Когда конфеты кончились, посмотри, сколько у каждого.',
m10:'Три пакета по 4 конфеты. Высыпали все — стало 12. Разложили обратно по 4 — опять 3 пакета. Туда и обратно.'
};

/* ---------- блоки курса ---------- */
function rotHints(a,b,t2){return [function(){return '<p>Поверни прямоугольник: клеток столько же.</p><div class="pair">'+rect(a,b)+rect(b,a)+'</div>';},function(){return '<p>'+t2+'</p>';}];}
function tblHints(r,c){return [function(){return '<p>Найди строку '+r+' и столбец '+c+'. Клетка на пересечении — наша.</p>'+pyth({r:r,c:c,diag:true});},function(){return '<p>Строка '+r+', столбец '+c+'. Это '+r+' × '+c+'. Если забыл, вспомни зеркальную пару '+c+' × '+r+'.</p>';}];}

var MODS=[
{id:'m1',tag:'4 × 2',title:'Что значит «умножить»',goal:'Понять: умножение — это короткая запись сложения одинаковых чисел.',
 steps:[
  {title:'Складываем одинаковое',text:'Когда одно и то же число берём несколько раз, сложение получается длинным. Умножение — короткая запись. 4 × 2 значит: число 4 берём 2 раза, то есть 4 + 4. Покрути числа сам.',mount:mGroups},
  {title:'Клеточки',text:'То же самое можно выложить прямоугольником. В ряду 4 клетки, рядов 2. Всего клеток столько же, сколько в 4 × 2. Меняй числа и смотри, как растёт прямоугольник.',mount:mRectDemo}],
 alt:{text:'Представь мешки с яблоками. В каждом мешке по 3 яблока, мешков 4. Сначала пишем, что в одном мешке, потом сколько мешков: 3 × 4. Считаем: 3 + 3 + 3 + 3 = 12.',mount:function(b){b.append(h(groups(3,4)));}},
 practice:function(){return build([function(){var a=ri(2,5),b=ri(2,3);return Mul(a,b,{lead:'Сколько всего кружков?',vis:groups(a,b)});},function(){var a=ri(2,6),b=ri(2,4);return Mul(a,b,{key:'s'+a+'s'+b,lead:'Сколько раз взяли число '+a+'?',eq:Array(b).fill(a).join(' + ')+' = ? × '+a,answer:b,fact:null,h:[function(){return '<p>Посчитай, сколько раз написано число '+a+'.</p>'+groups(a,b);},function(){return '<p>Каждая группа — это одно число '+a+'. Сколько групп?</p>';}]});}],3);},
 test:function(){return build([function(){var a=ri(2,5),b=ri(2,4);return Mul(a,b,{key:'v'+a+'v'+b,lead:'Сколько всего кружков?',vis:groups(a,b)});},function(){var a=ri(2,9),b=ri(2,5);return Mul(a,b,{key:'s'+a+'s'+b,lead:'Сколько раз взяли число '+a+'?',eq:Array(b).fill(a).join(' + ')+' = ? × '+a,answer:b,fact:null,h:[function(){return '<p>Посчитай, сколько раз написано число '+a+'.</p>'+groups(a,b);},function(){return '<p>Каждая группа — это одно число '+a+'. Сколько групп?</p>';}]});},function(){return Mul(ri(2,6),ri(2,5));}],5);}},

{id:'m2',tag:'3 × 4 = 4 × 3',title:'Переставь — не изменится',goal:'Узнать: множители можно менять местами, и учить придётся вдвое меньше.',
 steps:[
  {title:'Поверни прямоугольник',text:'Нажми «Повернуть». Клеток не стало ни больше, ни меньше. Поэтому 3 × 4 = 4 × 3. Это называется переместительное свойство.',mount:mRotate},
  {title:'Учить вдвое меньше',text:'Знаешь 6 × 8, значит знаешь и 8 × 6. Вместо 100 примеров остаётся около 55.',mount:mHalf55}],
 alt:{text:'Книжный шкаф: 3 полки, на каждой по 4 книги. Если встать сбоку, видно 4 полки по 3 книги. Книг столько же, ведь шкаф тот же.',mount:function(b){b.append(h('<div class="pair">'+rect(4,3)+rect(3,4)+'</div>'));}},
 practice:function(){return build([function(){var a=ri(2,6),b=ri(2,6);return Q({key:'p'+a+'p'+b,lead:'Подумай и ответь.',eq:a+' × '+b+' = '+a*b+'. Значит '+b+' × '+a+' = ?',answer:a*b,meta:{t:'rot',a:a,b:b},h:rotHints(a,b,'Числа поменялись местами, а ответ остался тем же.')});}],3);},
 test:function(){return build([function(){var a=ri(2,9),b=ri(2,9);return Q({key:'p'+a+'p'+b,eq:a+' × '+b+' = '+a*b+'. Значит '+b+' × '+a+' = ?',lead:'Подумай и ответь.',answer:a*b,meta:{t:'rot',a:a,b:b},h:rotHints(a,b,'Числа поменялись местами, а ответ остался тем же.')});},function(){var a=ri(2,9),b=ri(2,9);return Q({key:'q'+a+'q'+b,lead:'Какое число пропущено?',eq:a+' × '+b+' = ? × '+a,answer:b,meta:{t:'rot',a:a,b:b},h:rotHints(a,b,'Слева '+a+' × '+b+'. Справа тот же пример, только множители поменялись местами.')});}],5);}},

{id:'m3',tag:'квадрат',title:'Квадрат Пифагора',goal:'Увидеть таблицу целиком: диагональ из квадратов и зеркальные пары.',
 steps:[
  {title:'Строка, столбец, клетка',text:'Это вся таблица умножения на одном листе. Нажми на клетку: число в ней равно строке, умноженной на столбец.',mount:function(b){mPyth(b,{});}},
  {title:'Диагональ и зеркало',text:'По диагонали стоят квадраты: 1, 4, 9, 16 и дальше. Слева и справа от диагонали числа повторяются зеркально. Нажми на клетку и найди пару.',mount:function(b){mPyth(b,{diag:true});}}],
 alt:{text:'Сложи квадрат пополам по диагонали. Каждое число ляжет на такое же. Значит достаточно знать только одну половину.',mount:function(b){b.append(h(pyth({r:3,c:7,diag:true})));}},
 practice:function(){return build([function(){var r=ri(2,6),c=ri(2,6);return Q({key:'c'+r+'c'+c,lead:'Строка '+r+', столбец '+c+'. Какое число в клетке?',eq:r+' × '+c+' = ?',answer:r*c,meta:{t:'tbl',r:r,c:c},fact:[r,c],h:tblHints(r,c)});}],3);},
 test:function(){return build([function(){var r=ri(2,9),c=ri(2,9);return Q({key:'c'+r+'c'+c,lead:'Строка '+r+', столбец '+c+'. Какое число в клетке?',eq:r+' × '+c+' = ?',answer:r*c,meta:{t:'tbl',r:r,c:c},fact:[r,c],h:tblHints(r,c)});},function(){var r=ri(2,9),c=ri(2,9);if(r===c)c=r===9?8:r+1;return Q({key:'z'+r+'z'+c,lead:'В клетке (строка '+r+', столбец '+c+') стоит '+r*c+'. Что стоит в зеркальной клетке (строка '+c+', столбец '+r+')?',eq:'?',answer:r*c,meta:{t:'tbl',r:r,c:c},h:tblHints(r,c)});},function(){var r=ri(2,9);return Q({key:'g'+r,lead:'Какое число стоит на диагонали в строке '+r+'?',eq:r+' × '+r+' = ?',answer:r*r,meta:{t:'tbl',r:r,c:r},fact:[r,r],h:tblHints(r,r)});}],5);}},

{id:'m4',tag:'× 1, × 10',title:'Умножаем на 1 и на 10',goal:'Запомнить два самых простых правила: ×1 не меняет число, ×10 приписывает ноль.',
 steps:[
  {title:'Умножить на 1',text:'Одна группа по 5 — это всего 5. Число не меняется. Выбери любое число.',mount:function(b){mTen(b,'one');}},
  {title:'Умножить на 10',text:'Справа дописывается ноль. Десять групп по 3 — это 3 десятка, то есть 30.',mount:function(b){mTen(b,'ten');}}],
 alt:{text:'Монеты по 10 рублей. 3 монеты — это 30 рублей, 7 монет — 70 рублей. Умножить на 10 значит посчитать десятки: 3 десятка — это 30.',mount:function(b){b.append(h('<div class="chips"><span class="chip">3 × 10 = 30</span><span class="chip">7 × 10 = 70</span><span class="chip">9 × 10 = 90</span></div>'));}},
 practice:function(){return build([function(){return Mul(ri(2,9),pick([1,10]));},function(){return Mul(pick([1,10]),ri(2,9));}],3);},
 test:function(){return build([function(){return Mul(ri(2,10),1);},function(){return Mul(10,ri(2,10));},function(){return Mul(ri(2,10),10);},function(){return Mul(1,ri(2,10));},function(){return Miss(ri(2,9),10);}],5);}},

{id:'m5',tag:'× 2, × 4',title:'Удвоение: ×2 и ×4',goal:'Понять: ×2 — это сложить число с самим собой, ×4 — удвоить два раза.',
 steps:[
  {title:'Удвоить',text:'Умножить на 2 — значит сложить число с самим собой. Выбери число и смотри, как оно удваивается.',mount:mDouble},
  {title:'Ещё раз удвоить',text:'Умножить на 4 — это удвоить, а потом удвоить ещё раз. 4 × 3. Сначала 6, потом 12.',mount:mDouble}],
 alt:{text:'Носки продают парами. В паре 2 носка. В 6 парах будет 6 × 2 = 12 носков. А четыре пары перчаток — это 4 пары по 2, потом ещё раз по 2. Всё те же удвоения.',mount:function(b){b.append(h(groups(2,6)));}},
 practice:function(){return build([function(){return Mul(2,ri(2,9));},function(){return Mul(4,ri(2,6));}],3);},
 test:function(){return build([function(){return Mul(2,ri(2,10));},function(){return Mul(ri(2,10),2);},function(){return Mul(4,ri(2,10));},function(){return Mul(ri(2,10),4);},function(){var n=ri(2,10);return Mul(4,n,{key:'dd'+n,lead:'Удвой число '+n+', потом удвой результат. Что получилось?',eq:'?',fact:[4,n]});}],5);}},

{id:'m6',tag:'× 5',title:'Пятёрка — половина десятки',goal:'Считать ×5 через ×10. Берём половину.',
 steps:[
  {title:'Половина от ×10',text:'5 — это половина от 10. Поэтому 5 × 6 — половина от 10 × 6. Покрути число.',mount:mHalf},
  {title:'Конец на 0 или на 5',text:'Все ответы в пятёрках оканчиваются на 0 или на 5. Жёлтые оканчиваются на 0.',mount:mFive}],
 alt:{text:'На одной руке 5 пальцев. 3 руки — это 3 × 5 = 15 пальцев. 6 рук — 30 пальцев: как половина от 60.',mount:function(b){b.append(h(groups(5,3)));}},
 practice:function(){return build([function(){return Mul(5,ri(2,9));}],3);},
 test:function(){return build([function(){return Mul(5,ri(2,10));},function(){return Mul(ri(2,10),5);},function(){var n=ri(2,10);return Mul(5,n,{key:'hf'+n,lead:'10 × '+n+' = '+10*n+'. Чему равна половина этого числа?',eq:'?',fact:[5,n]});},function(){return Miss(ri(2,10),5);}],5);}},

{id:'m7',tag:'× 9',title:'Девятка на пальцах',goal:'Научиться находить ×9 пальцами и через ×10 минус число.',
 steps:[
  {title:'Фокус с пальцами',text:'Положи обе руки перед собой. Чтобы умножить 9 на число, загни этот палец. Пальцы слева — десятки, справа — единицы.',mount:mFingers},
  {title:'Десять минус один',text:'9 × 7 — это 10 × 7 без одного 7. А ещё у ответов в девятке сумма цифр равна 9. Так можно проверить себя.',mount:mNine}],
 alt:{text:'Ряд девяток: 9, 18, 27, 36, 45, 54, 63, 72, 81, 90. Десятки растут на 1, единицы уменьшаются на 1. Сумма цифр везде 9.',mount:function(b){var s='';for(var i=1;i<=10;i++)s+='<span class="chip'+(i%2?'':' hl')+'">'+9*i+'</span>';b.append(h('<div class="chips">'+s+'</div>'));}},
 practice:function(){return build([function(){return Mul(9,ri(2,9));}],3);},
 test:function(){return build([function(){return Mul(9,ri(2,10));},function(){return Mul(ri(2,10),9);},function(){var n=ri(2,10);return Mul(9,n,{key:'tn'+n,lead:'10 × '+n+' = '+10*n+'. Значит 9 × '+n+' = '+10*n+' − '+n+' = ?',eq:'?',fact:[9,n]});},function(){return Miss(ri(2,10),9);}],5);}},

{id:'m8',tag:'× 3, 6, 7, 8',title:'Остальные: разбиваем на знакомое',goal:'Находить ×3, ×6, ×7, ×8 через то, что уже знаешь.',
 steps:[
  {title:'Разбей число на две части',text:'3 = 2 + 1, 6 = 5 + 1, 7 = 5 + 2, 8 = 4 + 4. Каждую часть ты уже умеешь умножать. Синие и жёлтые клетки показывают две части.',mount:mSplit},
  {title:'Шаг от соседнего примера',text:'Не помнишь 4 × 6? Возьми соседний пример: 4 × 5 = 20. Шаг вперёд — прибавь 4. Будет 20 + 4 = 24.',mount:mNeighbor}],
 alt:{text:'Не помнишь 7 × 6? Не страшно. 5 × 6 = 30 ты знаешь, 2 × 6 = 12 тоже. Сложи: 30 + 12 = 42. Любой пример можно собрать из знакомых.',mount:function(b){b.append(h(rect(7,6,{split:5})));}},
 practice:function(){return build([function(){return Mul(pick([3,6]),ri(2,9));},nbQ],3);},
 test:function(){return build([function(){return Mul(pick([3,6,7,8]),ri(2,10));},function(){return Mul(ri(2,10),pick([3,6,7,8]));},function(){var n=ri(2,9);return Mul(6,n,{key:'s6'+n,lead:'6 × '+n+' = 5 × '+n+' + '+n+' = '+5*n+' + '+n+' = ?',eq:'?',fact:[6,n]});},function(){var n=ri(2,9);return Mul(7,n,{key:'s7'+n,lead:'7 × '+n+' = 5 × '+n+' + 2 × '+n+' = '+5*n+' + '+2*n+' = ?',eq:'?',fact:[7,n]});},nbQ],5);}},

{id:'m9',tag:'12 ÷ 3',title:'Деление: раздаём поровну',goal:'Понять деление как раскладывание на равные группы.',
 steps:[
  {title:'Раскладываем',text:'12 ÷ 3. Берём 12 предметов и раскладываем по 3. Получается 4 группы. Попробуй другие примеры.',mount:mDivide},
  {title:'Делим поровну',text:'Переключи на «Делим поровну». Теперь 12 раздали 3 частям, и в каждой по 4. Ответ тот же, а вопрос другой.',mount:mDivide}],
 alt:{text:'У тебя 12 конфет. Если сложить в пакеты по 3, пакетов будет 4. Если раздать 3 друзьям поровну, каждому достанется 4. Оба раза 12 ÷ 3 = 4.',mount:function(b){b.append(h(groups(3,4)));}},
 practice:function(){return build([function(){var d=ri(2,4),q=ri(2,4);return Div(d*q,d,{lead:'Раздели поровну. Сколько получится?',vis:groups(d,q)});}],3);},
 test:function(){return build([function(){var d=ri(2,5),q=ri(2,5);return Div(d*q,d,{key:'dv'+d+'dv'+q,lead:'Раздели поровну.',vis:groups(d,q)});},function(){var d=ri(2,6),q=ri(2,6);return Div(d*q,d,{key:'w1'+d+'w'+q,lead:d*q+' конфет разложили по '+d+' в пакеты. Сколько пакетов?',eq:'?'});},function(){var d=ri(2,6),q=ri(2,6);return Div(d*q,d,{key:'w2'+d+'w'+q,lead:d*q+' яблок раздали поровну '+d+' детям. Сколько яблок у каждого?',eq:'?'});}],5);}},

{id:'m10',tag:'3×4 ↔ 12÷3',title:'Умножение и деление — родственники',goal:'Научиться делить через умножение: 56 ÷ 7 — это 7 × ? = 56.',
 steps:[
  {title:'Одна семья из четырёх примеров',text:'Три числа дают четыре записи. Выбери пару и посмотри, как умножение превращается в деление.',mount:mFamily},
  {title:'Не помнишь деление — спроси умножение',text:'56 ÷ 7. Спроси себя, 7 умножить на что даст 56. Нажми кнопку и посмотри.',mount:mAskMul}],
 alt:{text:'Деление — это умножение наоборот. Если 6 × 7 = 42, то из 42 можно снова получить 6 и 7. Вот так: 42 ÷ 6 = 7 и 42 ÷ 7 = 6.',mount:function(b){b.append(h(rect(6,7)));}},
 practice:function(){return build([function(){var a=ri(2,6),b=ri(2,6);return Div(a*b,a);}],3);},
 test:function(){return build([function(){var a=ri(2,9),b=ri(2,9);return Div(a*b,a);},function(){return Miss(ri(2,9),ri(2,9));},function(){var a=ri(2,9),b=ri(2,9);return Div(a*b,a,{key:'fm'+a+'f'+b,lead:a+' × '+b+' = '+a*b+'. Значит '+a*b+' ÷ '+a+' = ?',eq:'?'});}],5);}}
];

/* ---------- тренажёр: подбор примеров ---------- */
function allowedFacts(){
  var S={};
  function add(a){a.forEach(function(x){S[x]=1;});}
  if(P.done.m4)add([10]);if(P.done.m5)add([2,4]);if(P.done.m6)add([5]);if(P.done.m7)add([9]);if(P.done.m8)add([3,6,7,8]);
  var any=Object.keys(S).length>0,out=[];
  for(var a=2;a<=10;a++)for(var b=a;b<=10;b++){
    var base=(b<=5);
    if(base||(any&&(S[a]||S[b])))out.push([a,b]);}
  return out;}
function pickTrain(n){
  var facts=allowedFacts();
  function w(f){var s=P.stats[fk(f)]||{ok:0,bad:0};return 1+5*s.bad/(s.ok+s.bad+1);}
  var kinds=['mul','mul'];if(P.done.m2)kinds.push('miss');if(P.done.m9)kinds.push('div','div');
  var out=[],seen={},t=0;
  while(out.length<n&&t<400){t++;var tot=0;facts.forEach(function(f){tot+=w(f);});var r=Math.random()*tot,f=facts[0];
    for(var i=0;i<facts.length;i++){r-=w(facts[i]);if(r<=0){f=facts[i];break;}}
    var a2=f[0],b2=f[1];if(Math.random()<.5){var x=a2;a2=b2;b2=x;}
    var kind=pick(kinds),q;
    if(kind==='mul')q=Mul(a2,b2);else if(kind==='div')q=Div(a2*b2,a2);else q=Miss(a2,b2);
    if(seen[q.key])continue;seen[q.key]=1;out.push(q);}
  return out;}

/* ---------- маршрутизация ---------- */
var view={name:'home'},R=null;
var NAMES={home:'home',run:'home',train:'train',table:'table',parent:'parent',doc:'',buy:'home',games:'games',hard:'home',stickers:'stickers'};
function dl(k){return PREVIEW?'#'+k:k+'.html';}
function go(v){view=v;render();window.scrollTo(0,0);}
function render(){
  document.querySelectorAll('.nav button').forEach(function(b){if(b.dataset.v===NAMES[view.name])b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(gTimer){clearInterval(gTimer);gTimer=null;}
  if(tier()==='free'&&(view.name==='run'||view.name==='train')&&(P.days[dayKey()]||0)>=FREE_MIN*60)view={name:'buy',why:'limit'};
  syncChrome();
  app.innerHTML='';
  ({home:rHome,run:rRun,train:rTrainStart,table:rTable,parent:rParent,doc:rDoc,buy:rBuy,games:rGames,hard:rHard,stickers:rStickers})[view.name]();}
function route(){var hs=(location.hash||'').replace('#','');
  if(window.__DOCS__&&window.__DOCS__[hs]){view={name:'doc',key:hs};}else if(hs==='buy'){view={name:'buy',why:'plans'};}else if(hs==='parent'){view={name:'parent'};}else if(view.name==='doc'){view={name:'home'};}
  render();}
function starsStr(n){return '★'.repeat(n)+'☆'.repeat(3-n);}

/* ---------- главная ---------- */
function reminderDue(){return P.onboarded&&!standalone()&&!P.lastBackupAt&&P.sessions>=5&&P.sessions-P.lastReminder>=5;}
function banners(){
  var o='';
  if(storage.mode==='memory')o+='<div class="note warn" role="status"><b>Прогресс не сохранится.</b> Браузер не разрешает хранить данные, возможно, включён приватный режим. Откройте сервис в обычном окне.</div>';
  if(!P.onboarded)o+='<section class="note" id="onb"><h3>Твой прогресс хранится в этом браузере</h3><p>Чтобы он не потерялся, добавь сервис на экран «Домой» (кнопка «Поделиться», затем «На экран “Домой”») или сохрани файл прогресса в разделе «Для родителя».</p><details><summary>Как добавить на экран «Домой»</summary><ul class="tips"><li><b>iPhone и iPad, Safari.</b> Нажми «Поделиться» (квадрат со стрелкой), затем «На экран “Домой”», затем «Добавить».</li><li><b>Android, Chrome.</b> Открой меню (три точки) и выбери «Установить приложение» или «Добавить на главный экран».</li><li><b>Компьютер, Chrome или Edge.</b> Нажми значок установки справа в адресной строке или открой меню и выбери «Установить».</li><li><b>Firefox на компьютере.</b> Установки нет, поэтому сохраняй файл прогресса.</li></ul></details><div class="row" style="margin-top:12px"><button type="button" class="btn" data-act="onb-ok">Понятно</button><button type="button" class="btn ghost" data-v="parent">Сохранить файл прогресса</button></div><p class="small" style="margin:10px 0 0"><a href="'+dl('how')+'">Как хранятся данные</a></p></section>';
  else if(reminderDue())o+='<section class="note" role="status"><h3>Напоминание</h3><p>Прогресс хранится только в этом браузере. Добавь сервис на экран «Домой» или сохрани файл прогресса.</p><div class="row"><button type="button" class="btn" data-v="parent">Сохранить файл</button><button type="button" class="btn ghost" data-act="rem-later">Напомнить позже</button></div></section>';
  return o;}
function locked(i){return PAYWALL&&tier()==='free'&&!FREE_IDS[MODS[i].id];}
function lockSvg(){return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';}
/* ---------- картинки к блокам уроков (встроенные SVG) ---------- */
function ensureSprite(){if(!document.getElementById('f-apple'))document.body.insertAdjacentHTML('beforeend',SPRITE);}
function fu(k,x,y,s){return '<use href="#f-'+k+'" x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'"/>';}
function fgrid(k,x,y,cols,rows,s,g){var o='';for(var j=0;j<rows;j++)for(var i=0;i<cols;i++)o+=fu(k,x+i*(s+g),y+j*(s+g),s);return o;}
function bsk(x,y,w){return '<path d="M'+x+' '+y+'h'+w+'l-6 22h-'+(w-12)+'z" fill="#C98A46"/><rect x="'+(x-3)+'" y="'+(y-3)+'" width="'+(w+6)+'" height="7" rx="3.500" fill="#A86E2F"/>';}
function tx(x,y,t,s,c){return '<text x="'+x+'" y="'+y+'" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="'+s+'" fill="'+(c||'#fff')+'" text-anchor="middle">'+t+'</text>';}
var ART_BG={m1:['#2B59E6','#5B7FF0'],m2:['#7A2FC4','#B05CF0'],m3:['#0E8F6A','#2FC79A'],m4:['#E8590C','#FF9A3D'],m5:['#C2255C','#FF6F91'],m6:['#0B6E99','#35B2E0'],m7:['#2E6F40','#58B878'],m8:['#4B3FD0','#7C6BF0'],m9:['#B8541E','#F08A4B'],m10:['#1E3FB8','#4B7BFF']};
function modArt(id){
  var bg=ART_BG[id];if(!bg)return '';ensureSprite();var o='';
  if(id==='m1'){o=bsk(30,70,100)+fgrid('apple',42,38,4,1,20,4)+bsk(170,70,100)+fgrid('apple',182,38,4,1,20,4)+tx(150,34,'4 × 2',24)+tx(150,112,'4 + 4 = 8',16,'#FFE9A8');}
  else if(id==='m2'){o=fgrid('pear',30,6,4,3,24,3)+tx(160,56,'↔',36,'#FFE9A8')+fgrid('pear',200,4,3,4,20,3)+tx(75,112,'3 × 4',18)+tx(235,112,'4 × 3',18);}
  else if(id==='m3'){var c=['#fff','#FFE9A8'];for(var j=0;j<5;j++)for(var i=0;i<5;i++)o+='<rect x="'+(30+i*30)+'" y="'+(8+j*21)+'" width="26" height="18" rx="4" fill="'+c[(i+j)%2]+'" opacity=".9"/>';o+=tx(240,66,'5×5',34)+tx(240,96,'= 25',22,'#FFE9A8');}
  else if(id==='m4'){o=fu('apple',30,36,36)+tx(48,100,'× 1',20)+fgrid('orange',110,14,5,2,30,4)+tx(210,112,'× 10',22,'#FFE9A8');}
  else if(id==='m5'){o=fu('melon',24,28,40)+fu('melon',70,28,40)+tx(66,100,'× 2',20)+fgrid('melon',150,10,2,2,34,4)+fgrid('melon',210,10,2,2,34,4)+tx(210,112,'× 4',22,'#FFE9A8');}
  else if(id==='m6'){o=fgrid('apple',24,20,5,1,34,4)+fgrid('apple',24,64,5,1,34,4)+tx(236,56,'× 5',34)+tx(236,92,'= 10',20,'#FFE9A8');}
  else if(id==='m7'){for(var i=0;i<10;i++){var h=i===3?26:[44,58,68,60,60,68,58,44,44,44][i]*1;var hh=i===3?26:h;o+='<rect x="'+(24+i*24)+'" y="'+(100-hh)+'" width="18" height="'+hh+'" rx="9" fill="'+(i===3?'#E8B98A':'#FFD9B0')+'"/>';}o+='<rect x="14" y="84" width="256" height="30" rx="14" fill="#FFD9B0"/>'+tx(150,112,'9 × 4 = 36',0,'#fff');o+=tx(285,30,'9×',22)}
  else if(id==='m8'){o=tx(60,76,'7',72,'#FFE9A8')+tx(130,76,'8',72)+fgrid('pear',190,14,5,3,18,4)+tx(150,112,'3 · 6 · 7 · 8',16);}
  else if(id==='m9'){o=fgrid('pear',20,12,6,2,22,3)+bsk(20,80,70)+bsk(115,80,70)+bsk(210,80,70)+fgrid('pear',27,60,3,1,18,3)+fgrid('pear',122,60,3,1,18,3)+fgrid('pear',217,60,3,1,18,3)+tx(250,32,'12 ÷ 3',20,'#fff');}
  else if(id==='m10'){o=fgrid('apple',24,18,4,3,24,4)+tx(165,50,'⇄',46,'#FFE9A8')+tx(235,48,'3 × 4 = 12',15)+tx(235,78,'12 ÷ 3 = 4',15)+tx(235,100,'12 ÷ 4 = 3',15,'#FFE9A8');}
  return '<svg class="modart" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false"><defs><linearGradient id="ag-'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient></defs><rect width="300" height="120" fill="url(#ag-'+id+')"/><circle cx="270" cy="10" r="46" fill="#fff" opacity=".1"/>'+o+'</svg>';}
function rHome(){
  var next=null,idx=-1;for(var i=0;i<MODS.length;i++){if(!P.done[MODS[i].id]&&!locked(i)){next=MODS[i];idx=i;break;}}
  var freeDone=!next&&MODS.some(function(m,i){return locked(i);});
  var cards=MODS.map(function(m,i){var d=P.done[m.id];
    var st=d?'<span class="stars" aria-label="'+(P.stars[m.id]||2)+' из 3">'+starsStr(P.stars[m.id]||2)+'</span> пройдено':(locked(i)?lockSvg()+'Стандарт и выше':(next&&next.id===m.id?'Следующий':'Новое'));
    return '<button type="button" class="mod'+(d?' done':'')+'" data-start="'+m.id+'">'+modArt(m.id)+'<span class="mod-n">Блок '+(i+1)+'</span><span class="mod-tag">'+m.tag+'</span><span class="mod-t">'+m.title+'</span><span class="mod-s">'+st+'</span></button>';}).join('');
  var today=next?'<div><b>Сегодня: блок '+(idx+1)+'</b><span>'+next.title+'. Хватит 5–10 минут.</span></div><button type="button" class="btn" data-start="'+next.id+'">'+(idx===0&&!Object.keys(P.done).length?'Начать':'Продолжить')+'</button>':'<div><b>Все блоки пройдены</b><span>Тренажёр подберёт примеры, которые пока даются труднее.</span></div><button type="button" class="btn" data-v="train">В тренажёр</button>';
  if(freeDone)today='<div><b>Бесплатные блоки пройдены</b><span>Остальные блоки откроет Стандарт.</span></div><button type="button" class="btn" data-v="buy">Открыть все блоки</button>';
  app.innerHTML=banners()+'<section class="card lift"><p class="kicker">Умножение и деление</p><h1>Таблица без зубрёжки</h1><p class="lead" style="margin-top:12px">Сначала понимаем, потом запоминаем. В каждом блоке коротко объясняем, даём несколько задач и проверку. Не понял? Нажми «Объясни по-другому». Ошибка здесь часть учёбы.</p><div class="today">'+today+'</div></section><h2>Блоки</h2><div class="mods">'+cards+'</div><p class="small" style="margin-top:18px">Один блок удобно проходить 3–7 дней: в первый день урок и проверка, потом по 5 минут в тренажёре.</p>';homeAdv();}

/* ---------- прохождение блока ---------- */
function startModule(id){
  var i=-1;MODS.forEach(function(x,k){if(x.id===id)i=k;});if(i<0)return;
  if(locked(i)){go({name:'buy',id:id});return;}
  var m=MODS[i],items=[];
  if(can('pre')&&PRE[m.id])items.push({kind:'pre',mod:m});
  m.steps.forEach(function(s,k){items.push({kind:'explain',step:s,mod:m,first:k===0,idx:k});});
  if(can('anchors')&&EXTRA[m.id])items.push(extraItem(m));
  m.practice().forEach(function(q){items.push({kind:'ask',q:q,scored:false,phase:'Пробуем'});});
  if(can('pickx')&&PICKX[m.id])items.push(pickxItem(PICKX[m.id]));
  if(can('story'))items.push({kind:'ask',q:storyFor(m),scored:false,phase:'Задача'});
  items.push({kind:'break'});
  m.test().forEach(function(q){items.push({kind:'ask',q:q,scored:true,phase:'Проверка'});});
  R={mode:'lesson',mod:m,items:items,i:0,retries:0};NAMES.run='home';go({name:'run'});}
function barHtml(){var s='';R.items.forEach(function(_,i){s+='<i class="'+(i<R.i?'on':(i===R.i?'now':''))+'"></i>';});return '<div class="bar" aria-hidden="true">'+s+'</div>';}
function restNote(){var mins=(P.days[dayKey()]||0)/60;return mins>=10?'<div class="rest">Ты занимаешься уже 10 минут. Можно закончить на сегодня: всё сохранено. <button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px;margin-left:6px" data-v="home">Закончить на сегодня</button></div>':'';}
function countAlt(){if(R&&R.mod){P.alts[R.mod.id]=(P.alts[R.mod.id]||0)+1;save();}}
function rRun(){
  if(!R){go({name:'home'});return;}
  if(R.i>=R.items.length){finish();return;}
  var it=R.items[R.i];
  if(it.kind==='explain')rExplain(it);else if(it.kind==='break')rBreak(it);else if(it.kind==='pre')rPre(it);else if(it.kind==='choice')rChoice(it);else if(it.kind==='final')rFinalQ(it);else if(it.kind==='pickx')rPickx(it);else rAsk(it);}

function variantsFor(it){
  if(it.variants)return it.variants;
  var tx=TX[it.mod.id+'.'+it.idx]||{},v=[tx.B,it.step.text,tx.A];
  return v.filter(function(t,i){return t&&v.indexOf(t)===i;});}
function rExplain(it){
  var vs=variantsFor(it);if(it.v===undefined)it.v=0;
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">'+(it.alt?'Посмотрим по-другому':'Узнаём')+'</div>'+((can('stickers')&&it.first&&!it.alt)?hero(it.mod.id,64):'')+((it.first&&!it.alt)?modArt(it.mod.id):'')+((it.first&&!it.alt)?'<p class="goal">'+it.mod.goal+'</p>':'')+'<h3>'+it.step.title+'</h3><p class="expl" id="expl" aria-live="polite"></p><p class="vcap small" id="vcap"></p><div class="demo"></div><div class="row act"></div>';
  function paint(){card.querySelector('#expl').textContent=vs[it.v%vs.length];card.querySelector('#vcap').textContent=vs.length>1?'Объяснение '+(it.v%vs.length+1)+' из '+vs.length:'';}
  paint();
  it.step.mount(card.querySelector('.demo'));sayBox(card,it);
  var rw=card.querySelector('.row');
  if(R.i>0&&R.items[R.i-1].kind==='explain'){var back=h('<button type="button" class="btn ghost">Назад</button>');back.onclick=function(){R.i--;render();};rw.appendChild(back);}
  if(vs.length>1){var al=h('<button type="button" class="btn ghost alt">'+ICON+'Объясни по-другому</button>');
    al.onclick=function(){it.v++;countAlt();paint();var e=card.querySelector('#expl');e.classList.remove('swap');void e.offsetWidth;e.classList.add('swap');};rw.appendChild(al);}
  if(can('tts')){var sp=ttsBtn(function(){return it.step.title+'. '+vs[it.v%vs.length];});if(sp)rw.appendChild(sp);}
  if(VIS_MOD[it.mod.id]){var vw=visWidget(function(){return VIS_MOD[it.mod.id];},true);rw.appendChild(vw.btn);rw.parentNode.insertBefore(vw.panel,rw);}
  var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);
  app.appendChild(card);app.insertAdjacentHTML('beforeend',restNote());}

var OKS=['Верно!','Да, точно!','Правильно!','Отлично!'];
var TRY=['Почти. Давай посмотрим вместе.','Хорошая попытка. Вот подсказка.','Тут легко запутаться. Смотри.'];
/* ---------- «Показать визуально»: инфографика с корзинками и фруктами ---------- */
var FRUITS=[['apple','яблоки'],['pear','груши'],['melon','арбузы'],['orange','апельсины']];
var SPRITE='<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
 +'<symbol id="f-apple" viewBox="0 0 24 24"><path d="M12 6.5c-2-1.6-7-1.4-7 4.6 0 4.6 3 9.4 5.2 9.4 1 0 1.2-.6 1.8-.6s.8.6 1.8.6c2.2 0 5.2-4.800 5.200-9.400 0-6-5-6.200-7-4.600z" fill="#E5383B"/><path d="M12 6.500c0-2 1-3.500 2.800-4" stroke="#6B4423" stroke-width="1.600" fill="none" stroke-linecap="round"/><path d="M13 5c1.500-1.800 3.500-1.800 4.500-1-1 1.800-3 2.400-4.500 1z" fill="#3DBE7A"/></symbol>'
 +'<symbol id="f-pear" viewBox="0 0 24 24"><path d="M12 5c-2 0-2.600 2.200-3 3.600C8.400 10.600 5 12 5 16c0 3.400 3 5.500 7 5.500s7-2.100 7-5.500c0-4-3.400-5.400-4-7.400C14.600 7.200 14 5 12 5z" fill="#A9D43C"/><path d="M12 5c0-1.600.8-2.800 2-3.400" stroke="#6B4423" stroke-width="1.600" fill="none" stroke-linecap="round"/><path d="M9 14c0 2 .8 3.400 2 4" stroke="#fff" stroke-opacity=".5" stroke-width="1.600" fill="none" stroke-linecap="round"/></symbol>'
 +'<symbol id="f-melon" viewBox="0 0 24 24"><path d="M2.500 9a9.500 9.500 0 0 0 19 0z" fill="#E5383B"/><path d="M2.500 9h19a9.500 9.500 0 0 1-.4 2.800H2.900A9.500 9.500 0 0 1 2.500 9z" fill="#3DBE7A"/><path d="M2.900 11.800h18.200" stroke="#E9F7C8" stroke-width="1.200"/><circle cx="8" cy="14.500" r=".9" fill="#222"/><circle cx="12" cy="16.500" r=".9" fill="#222"/><circle cx="16" cy="14.500" r=".9" fill="#222"/></symbol>'
 +'<symbol id="f-orange" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8.500" fill="#FF9A1F"/><path d="M12 4.500c0-1.200.6-2 1.600-2.500" stroke="#6B4423" stroke-width="1.400" fill="none" stroke-linecap="round"/><path d="M12.500 5c1.600-1.600 4-1.400 5-.4-1.400 1.600-3.600 1.800-5 .4z" fill="#3DBE7A"/><path d="M7.500 11c.6-1.800 2-3 3.800-3.200" stroke="#fff" stroke-opacity=".45" stroke-width="1.600" fill="none" stroke-linecap="round"/></symbol>'
 +'</defs></svg>';
var VISICON='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M12 5c-5 0-9 4.500-10 7 1 2.500 5 7 10 7s9-4.500 10-7c-1-2.500-5-7-10-7z" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.200" fill="currentColor"/></svg>';
var VIS_MOD={m1:[{t:'mul',a:4,b:2},{t:'mul',a:3,b:4},{t:'mul',a:5,b:3}],m2:[{t:'mul',a:3,b:4},{t:'mul',a:4,b:3},{t:'mul',a:2,b:5},{t:'mul',a:5,b:2}],m3:[{t:'mul',a:3,b:3},{t:'mul',a:4,b:4},{t:'mul',a:5,b:5}],
 m4:[{t:'mul',a:6,b:1},{t:'mul',a:10,b:3},{t:'mul',a:10,b:4}],m5:[{t:'mul',a:2,b:6},{t:'mul',a:4,b:3},{t:'mul',a:4,b:5}],m6:[{t:'mul',a:5,b:4},{t:'mul',a:5,b:6},{t:'mul',a:10,b:3}],
 m7:[{t:'mul',a:9,b:3},{t:'mul',a:9,b:4},{t:'mul',a:9,b:2}],m8:[{t:'mul',a:3,b:6},{t:'mul',a:7,b:3},{t:'mul',a:6,b:4}],m9:[{t:'div',n:12,d:3},{t:'div',n:20,d:4},{t:'div',n:15,d:5}],m10:[{t:'div',n:12,d:3},{t:'div',n:18,d:3},{t:'div',n:24,d:4}]};
function visSpec(q){var m=q&&q.meta;if(!m)return null;
  if(m.t==='mul'&&m.a>=1&&m.b>=1&&m.a<=10&&m.b<=10)return {t:'mul',a:m.a,b:m.b};
  if(m.t==='div'&&m.d>=2&&m.d<=10&&m.n/m.d<=10&&m.n%m.d===0)return {t:'div',n:m.n,d:m.d};return null;}
function fIcons(k,n,cls){var s='';for(var i=0;i<n;i++)s+='<svg class="vf" viewBox="0 0 24 24" aria-hidden="true"><use href="#f-'+k+'"/></svg>';return '<div class="'+cls+'">'+s+'</div>';}
function visHtml(s,reveal){
  var fr=FRUITS[((s.a||s.n)+(s.b||s.d))%4],k=fr[0],out='',per=s.t==='mul'?s.a:s.n/s.d,cnt=s.t==='mul'?s.b:s.d,tot=s.t==='mul'?s.a*s.b:s.n;
  var baskets='';
  for(var i=0;i<cnt;i++){
    var inner=(s.t==='div'&&!reveal)?'<div class="vfs vempty"><span>?</span></div>':fIcons(k,per,'vfs');
    baskets+='<div class="vbk">'+inner+'<div class="vb"><span>'+((s.t==='div'&&!reveal)?'?':per)+'</span></div></div>';}
  out+='<p class="vis-t">Считаем '+fr[1]+'</p>';
  if(s.t==='div')out+='<div class="vis-pile" aria-label="Всего '+s.n+'">'+fIcons(k,s.n,'vfs')+'<span class="vtot">Всего '+s.n+'</span></div>';
  out+='<div class="vis-baskets" role="img" aria-label="'+cnt+' корзинок, в каждой '+per+'">'+baskets+'</div>';
  if(s.t==='mul'){
    var sum=cnt<=7?Array(cnt).fill(per).join(' + '):per+' + '+per+' + … ('+cnt+' раз)';
    out+='<p class="vis-x"><b>Корзинок: '+cnt+'.</b> В каждой: '+per+' <svg class="vf vf-i" viewBox="0 0 24 24" aria-hidden="true"><use href="#f-'+k+'"/></svg></p>'
      +'<p class="vis-eq">'+sum+' = <b>'+(reveal?tot:'?')+'</b></p>'
      +'<p class="vis-eq">Короче: '+s.a+' × '+s.b+' = <b>'+(reveal?tot:'?')+'</b></p>'
      +(reveal&&s.a!==s.b?'<p class="vis-x">Переставим: '+s.b+' корзинок по '+s.a+'? Нет, теперь корзинок '+s.a+', а в каждой '+s.b+'. Всего всё равно '+tot+'.</p>':'')
      +(!reveal?'<p class="vis-x">Сосчитай фрукты в одной корзинке и сложи столько раз, сколько корзинок.</p>':'');
  }else{
    out+='<p class="vis-x"><b>Раскладываем '+s.n+' поровну в '+s.d+' корзинок.</b></p>'
      +'<p class="vis-eq">'+s.n+' ÷ '+s.d+' = <b>'+(reveal?per:'?')+'</b></p>'
      +'<p class="vis-eq">Проверим умножением: '+s.d+' × '+(reveal?per:'?')+' = '+s.n+'</p>';}
  return out;}
function visWidget(getSpecs,reveal){
  var btn=h('<button type="button" class="btn ghost vis-btn" aria-expanded="false">'+VISICON+'<span>Показать визуально</span></button>'),
      panel=h('<div class="vis-panel" hidden></div>'),k=0,specs=null;
  if(!document.getElementById('f-apple'))document.body.insertAdjacentHTML('beforeend',SPRITE);
  function paint(){panel.innerHTML=visHtml(specs[k%specs.length],reveal)+(specs.length>1?'<button type="button" class="btn ghost vis-next">Другой пример</button>':'');
    var n=panel.querySelector('.vis-next');if(n)n.onclick=function(){k++;paint();};}
  btn.onclick=function(){specs=specs||getSpecs();var open=panel.hidden;panel.hidden=!open;btn.setAttribute('aria-expanded',open?'true':'false');btn.querySelector('span').textContent=open?'Скрыть картинку':'Показать визуально';if(open)paint();};
  return {btn:btn,panel:panel};}
function rAsk(it){
  var q=it.q;if(it.w===undefined)it.w=0;
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">'+(R.mode==='train'?'Тренажёр':it.phase)+'</div><p class="ask-lead">'+q.lead+'</p>'+(q.vis||'')+'<div class="eq">'+q.eq+'</div><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div><div id="fb" aria-live="polite"></div><div class="row" style="margin-top:14px"><button type="button" class="btn ghost alt" id="alt">'+ICON+'Объясни по-другому</button></div>';
  app.appendChild(card);app.insertAdjacentHTML('beforeend',restNote());
  var inp=card.querySelector('#ans'),chk=card.querySelector('#chk'),fb=card.querySelector('#fb'),alt=card.querySelector('#alt');
  inp.focus({preventScroll:true});
  var vsp=visSpec(q);if(vsp){var vq=visWidget(function(){return [vsp];},false),rq=card.querySelector('.row');rq.appendChild(vq.btn);rq.parentNode.insertBefore(vq.panel,rq);}
  if(can('tts')){var sp2=ttsBtn(function(){return q.lead+' '+q.eq;});if(sp2)card.querySelector('.row').appendChild(sp2);}
  function next(){R.i++;render();window.scrollTo(0,0);}
  function done(msg){
    it.done=true;if(it.w===0)it.first=true;
    if(q.fact)rec(q.fact,it.first===true);bump('ex');
    inp.disabled=true;alt.hidden=true;chk.textContent='Дальше';chk.disabled=false;chk.onclick=next;chk.focus();
    fb.innerHTML=msg;}
  alt.onclick=function(){
    if(it.done)return;
    var raw=[hint(q,1),hint(q,2),simpleHint(q)],list=raw.filter(function(t,i){return t&&raw.indexOf(t)===i;});
    it.hv=it.hv||0;
    fb.innerHTML='<div class="fb try"><strong>Вот другое объяснение.</strong><div class="hint">'+list[it.hv%list.length]+'</div><span>Попробуй ответить.</span></div>';
    it.hv++;countAlt();inp.focus();};
  function check(){
    if(it.done){next();return;}
    var v=parseInt(inp.value.replace(/\s/g,''),10);if(isNaN(v)){inp.focus();return;}
    if(v===q.answer){
      var withHelp=it.w>0;
      done('<div class="fb ok"><strong>'+(withHelp?'Получилось!':pick(OKS))+'</strong>'+(withHelp?'<span>Вот так и учатся: сначала подсказка, потом сам.</span>':'')+'</div>');return;}
    it.w++;inp.select();
    if(it.w>=3){
      done('<div class="fb try"><strong>Ответ: '+q.answer+'.</strong><span>Ничего страшного. Этот пример мы ещё повторим.</span><div class="hint">'+hint(q,2)+'</div></div>');return;}
    if(it.w===2){
      fb.innerHTML='<div class="fb try"><strong>Давай объясню по-другому.</strong><div class="hint">'+simpleHint(q)+'</div><span>Попробуй ещё раз.</span></div>';inp.focus();return;}
    fb.innerHTML='<div class="fb try"><strong>'+TRY[(it.w-1)%TRY.length]+'</strong><div class="hint">'+hint(q,it.w)+'</div>'+(can('compare')?compareHtml(q,v):'')+'<span>Попробуй ещё раз.</span></div>';inp.focus();}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)check();};}

/* перемена: проба Струпа, без баллов и без таймера */
var SC=[['красный','var(--c-red)'],['синий','var(--c-blue)'],['зелёный','var(--c-green)'],['фиолетовый','var(--c-purple)']];
function rBreak(it){
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">Перемена</div><h3>Разомни глаза</h3><p class="expl">Назови цвет букв, а не само слово. Всего 4 раза.</p><div class="stroop" id="st"></div><div class="row act"></div>';
  var st=card.querySelector('#st'),rw=card.querySelector('.row'),round=0,total=4;
  var nx=h('<button type="button" class="btn ghost">Пропустить</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);
  function draw(){
    if(round>=total){st.innerHTML='<p class="expl">Отлично! Теперь с новыми силами.</p>';nx.textContent='К проверке';nx.className='btn';return;}
    var wi=ri(0,3),ci;do{ci=ri(0,3);}while(ci===wi);
    st.innerHTML='<div class="sw" style="color:'+SC[ci][1]+'">'+SC[wi][0].toUpperCase()+'</div><div class="seg sc">'+SC.map(function(c,i){return '<button type="button" data-c="'+i+'"><i style="background:'+c[1]+'"></i>'+c[0]+'</button>';}).join('')+'</div><p class="read" id="sr"></p>';
    st.querySelectorAll('button').forEach(function(b){b.onclick=function(){if(+b.dataset.c===ci){round++;draw();}else{st.querySelector('#sr').textContent='Почти. Смотри на цвет букв, а не на слово.';}};});}
  draw();app.appendChild(card);}

function missedFacts(){var seen={},out=[];R.items.forEach(function(it){if(it.kind==='ask'&&!it.first&&it.q.fact){var f=it.q.fact,k=fk(f);if(!seen[k]){seen[k]=1;out.push(f[0]+' × '+f[1]+' = '+f[0]*f[1]);}}});return out;}
function chipsHtml(ms){return ms.length?'<div class="chips" style="margin-bottom:12px">'+ms.map(function(x){return '<span class="chip">'+x+'</span>';}).join('')+'</div>':'';}
function finish(){
  if(R.mode==='final'){finishFinal();return;}
  if(R.mode==='train'){bump('rev');
    var asks=R.items.filter(function(x){return x.kind==='ask';});var ok=asks.filter(function(x){return x.first;}).length;var ms=missedFacts();
    app.innerHTML='<section class="card lift"><div class="phase">Итог</div><h2 style="margin:0 0 10px">С первого раза: '+ok+' из '+asks.length+'</h2><p>'+(ms.length?'Эти примеры мы покажем чаще:':'Все примеры получились. Так держать.')+'</p>'+chipsHtml(ms)+'<div class="row"><button type="button" class="btn" data-v="train">Ещё раз</button><button type="button" class="btn ghost" data-v="home">К урокам</button></div></section>';return;}
  var m=R.mod;var sc=R.items.filter(function(x){return x.scored&&x.first;}).length;var tot=R.items.filter(function(x){return x.scored;}).length;
  P.attempts[m.id]=(P.attempts[m.id]||0)+1;save();
  var ms2=missedFacts();
  if(sc>=tot-1){
    var st=sc===tot?3:2;var firstDone=!P.done[m.id];P.done[m.id]=true;P.stars[m.id]=Math.max(P.stars[m.id]||0,st);save();
    var nx=MODS[MODS.indexOf(m)+1];
    app.innerHTML='<section class="card lift"><div class="phase">Проверка пройдена</div><div class="big-stars" aria-label="'+st+' из 3">'+starsStr(st)+'</div><h2 style="margin:14px 0 10px">Ты разобрался в этой теме</h2><p>С первого раза верно: '+sc+' из '+tot+'. '+(ms2.length?'Эти примеры вернутся в тренажёре:':'')+'</p>'+chipsHtml(ms2)+'<p class="small">Чтобы тема закрепилась, вернись к ней в тренажёре через день. На сегодня этого достаточно.</p><div class="row">'+(nx?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий блок</button>':'')+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">Закончить</button></div></section>';
    if(can('stickers')||can('tips')){app.querySelector('section').insertAdjacentHTML('beforeend',(can('stickers')?stickerNote(m.id,firstDone):'')+(can('tips')?tipHtml():''));}
  }else{
    var again=R.retries>=1;
    app.innerHTML='<section class="card lift"><div class="phase">Пока не получилось</div><h2 style="margin:0 0 10px">Это нормально. Посмотрим иначе</h2><p>С первого раза верно: '+sc+' из '+tot+'. Тема новая, и объяснить её можно по-разному. Сейчас покажу другой способ, а потом ты попробуешь новые примеры.</p>'+chipsHtml(ms2)+(again?'<p class="small">Если устал, закончи на сегодня. Прогресс сохранится, а завтра будет проще.</p>':'')+'<div class="row"><button type="button" class="btn" id="re">Объяснить по-другому</button><button type="button" class="btn ghost" data-v="home">Позже</button></div></section>';
    document.getElementById('re').onclick=function(){
      var vars=[m.alt.text];if(ALT_A[m.id])vars.push(ALT_A[m.id]);if(R.retries%2===1)vars.reverse();
      var items=[{kind:'explain',alt:true,mod:m,step:{title:'Посмотрим по-другому',mount:m.alt.mount},variants:vars}];
      m.test().forEach(function(q){items.push({kind:'ask',q:q,scored:true,phase:'Пересдача'});});
      R.items=items;R.i=0;R.retries++;countAlt();render();window.scrollTo(0,0);};}}

/* ---------- доступ (оплата у агрегатора, без форм на сайте) ---------- */
function sha256hex(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2);}).join('');});}
function tryCode(code,msg,ok){
  if(!(window.crypto&&crypto.subtle)){msg.textContent='Проверка кода недоступна в этом браузере.';return;}
  if(!CODES_STD.length&&!CODES_PRO.length){msg.textContent='Коды доступа ещё не настроены.';return;}
  sha256hex(String(code).trim().toUpperCase()).then(function(hx){
    var t=CODES_PRO.indexOf(hx)>=0?'pro':(CODES_STD.indexOf(hx)>=0?'standard':null);
    if(!t){msg.textContent='Код не подошёл. Проверьте, нет ли лишних символов.';return;}
    if(RANK[t]<=RANK[tier()]){msg.textContent='Этот код ничего не добавит: у вас уже открыт тариф «'+TIER_NAME[tier()]+'».';return;}
    P.tier=t;P.adv=true;save();ok();
  }).catch(function(){msg.textContent='Не удалось проверить код.';});}
function codeForm(){return '<div class="answer"><input class="ans" style="width:14ch;font-size:24px" id="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Код доступа"><button type="button" class="btn" id="codego">Открыть доступ</button></div><p class="small" id="codemsg" aria-live="polite"></p>';}
function wireCode(after){var inp=document.getElementById('code'),msg=document.getElementById('codemsg');
  function go2(){tryCode(inp.value,msg,after);}
  document.getElementById('codego').onclick=go2;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)go2();};}
function planHtml(name,price,url,items,pro){
  return '<div class="plan'+(pro?' pro':'')+'"><h3>'+name+'</h3><p class="price">'+price+' <span class="small">один раз</span></p><ul>'+items.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul><a class="btn'+(pro?'':' ghost')+'" href="'+url+'" rel="noopener" target="_blank">Купить '+name+'</a></div>';}
function plansHtml(){
  return '<div class="plans">'
   +planHtml('Стандарт',PRICE_STD,PAY_URL_STD,['Все блоки и деление','Без ограничения по времени','Чередование примеров и текстовые задачи','Итоговая проверка','Трудные примеры, цели на день'],false)
   +planHtml('Продвинутый',PRICE_PRO,PAY_URL_PRO,['Всё из Стандарта','Повторения через 1, 3, 7 дней','Игры, награды, озвучка','«Расскажи родителю», печатные карточки','Расширенный отчёт'],true)+'</div>';}
function rBuy(){
  var why=view.why||'block',title,lead;
  if(why==='limit'){title='На сегодня всё!';lead='Бесплатный доступ: '+FREE_MIN+' минут занятий в день. Прогресс сохранён. Чтобы заниматься без ограничений, выберите Стандарт. Завтра бесплатные минуты появятся снова.';}
  else if(why==='feature'){title=(view.title||'Эта возможность')+' входит в тариф «'+(view.need==='pro'?'Продвинутый':'Стандарт')+'»';lead='Сначала можно пользоваться бесплатной версией, потом открыть нужный тариф. Оплата один раз, без подписки.';}
  else if(why==='plans'){title='Тарифы';lead='Бесплатная версия остаётся навсегда: пять блоков и '+FREE_MIN+' минут в день. Платные тарифы оплачиваются один раз, без подписки.';}
  else{title='Этот блок входит в платные тарифы';lead='В бесплатной версии открыты блоки про смысл умножения, ×1, ×2, ×5 и ×10. Остальные блоки откроет Стандарт или Продвинутый.';}
  app.innerHTML='<section class="card lift"><h1 style="margin:0 0 10px">'+title+'</h1><p class="lead">'+lead+'</p></section>'+plansHtml()
   +'<section class="card" style="margin-top:14px"><h3>У меня есть код</h3>'+codeForm()+'<p class="small">Оплата проходит на странице платёжного сервиса. Здесь мы не просим данные карты, имя, почту или телефон. После оплаты на странице успеха появится код доступа. Введите его здесь.</p></section><p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">Назад</button></p>';
  wireCode(function(){var id=view.id;go({name:'home'});if(id)startModule(id);});}
/* закрытая возможность: покупка тарифа или включение режима */
function gate(f,title){
  if(can(f))return false;
  if(RANK[tier()]<RANK[FEAT[f]]){view={name:'buy',why:'feature',need:FEAT[f],title:title};rBuy();return true;}
  app.innerHTML='<section class="card lift"><h1>'+title+'</h1><p class="lead" style="margin:12px 0">Этот раздел работает в продвинутом режиме.</p><button type="button" class="btn" data-act="adv">Включить продвинутый режим</button></section>';return true;}

/* ---------- тренажёр, квадрат ---------- */
function rTrainStart(){
  var any=Object.keys(P.done).length>0;
  app.innerHTML='<section class="card lift"><p class="kicker">5–10 минут в день</p><h1>Тренажёр</h1><p class="lead" style="margin-top:12px">'+(can('mix')?'Около десяти заданий: повторы по расписанию, задачи и выбор приёма. ':'Восемь примеров. ')+'Берём только то, что ты уже прошёл'+(any?'':', а пока самые простые, с числами до 5')+'. Чаще попадаются те, где раньше были сложности. Таймера нет, спешить не нужно. Если ответ не получается, появится подсказка.</p><div class="row" style="margin-top:16px"><button type="button" class="btn" id="go">Начать</button></div></section>';
  document.getElementById('go').onclick=function(){R={mode:'train',mod:null,items:trainItems(),i:0,retries:0};NAMES.run='train';go({name:'run'});};}
function rTable(){
  app.innerHTML='<section class="card lift"><h1>Квадрат Пифагора</h1><p class="lead" style="margin:12px 0">Вся таблица умножения на одном листе. Нажми на клетку: строка × столбец. Зеркальная пара подсветится жёлтым, а диагональ из квадратов окрашена синим.</p><div class="demo" id="tb"></div></section>';
  mPyth(document.getElementById('tb'),{diag:true});}
function rDoc(){var d=window.__DOCS__&&window.__DOCS__[view.key];
  if(!d){go({name:'home'});return;}
  app.innerHTML='<article class="card doc">'+d+'</article><p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">← К тренажёру</button></p>';}

/* ---------- сохранение файла и импорт ---------- */
function pad(n){return (n<10?'0':'')+n;}
function exportText(){return JSON.stringify({app:APP_ID,schemaVersion:SCHEMA,exportedAt:new Date().toISOString(),progress:{done:P.done,stars:P.stars,attempts:P.attempts,stats:P.stats,days:P.days,alts:P.alts,access:tier()!=='free',tier:tier(),adv:P.adv===true,sr:P.sr,daily:P.daily,final:P.final,told:P.told,notes:P.notes,stk:P.stk}},null,2);}
function isInt(x,a,b){return typeof x==='number'&&isFinite(x)&&Math.floor(x)===x&&x>=a&&x<=b;}
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x);}
function validateImport(txt){
  var o;try{o=JSON.parse(txt);}catch(e){return {err:'Файл повреждён: это не JSON. Выберите файл progress-….json, который сохранил сервис.'};}
  if(!isObj(o)||o.app!==APP_ID)return {err:'Это не файл прогресса этого сервиса.'};
  if(!isInt(o.schemaVersion,1,1000))return {err:'В файле нет версии схемы. Он повреждён или чужой.'};
  if(o.schemaVersion>SCHEMA)return {err:'Файл сохранён более новой версией сервиса (v'+o.schemaVersion+'). Обновите страницу и попробуйте снова.'};
  var p=o.progress;if(!isObj(p))return {err:'В файле нет данных прогресса.'};
  var ids={};MODS.forEach(function(m){ids[m.id]=1;});
  var out={done:{},stars:{},attempts:{},stats:{},days:{},alts:{},sr:{},daily:{},final:[],told:{},access:p.access===true},k;
  if(p.done!==undefined){if(!isObj(p.done))return {err:'Раздел «done» повреждён.'};for(k in p.done){if(!ids[k]||typeof p.done[k]!=='boolean')return {err:'Неизвестный блок «'+k+'» в файле.'};out.done[k]=p.done[k];}}
  var sets=[['stars',0,3],['attempts',0,100000],['alts',0,1000000],['told',0,1000000]];
  for(var i=0;i<sets.length;i++){var nm=sets[i][0];if(p[nm]!==undefined){if(!isObj(p[nm]))return {err:'Раздел «'+nm+'» повреждён.'};for(k in p[nm]){if(!ids[k]||!isInt(p[nm][k],sets[i][1],sets[i][2]))return {err:'Раздел «'+nm+'» содержит неверные значения.'};out[nm][k]=p[nm][k];}}}
  if(p.stats!==undefined){if(!isObj(p.stats))return {err:'Раздел «stats» повреждён.'};for(k in p.stats){var s=p.stats[k];if(!/^\d{1,2}×\d{1,2}$/.test(k)||!isObj(s)||!isInt(s.ok,0,1000000)||!isInt(s.bad,0,1000000))return {err:'Раздел «stats» содержит неверные значения.'};out.stats[k]={ok:s.ok,bad:s.bad};}}
  if(p.days!==undefined){if(!isObj(p.days))return {err:'Раздел «days» повреждён.'};for(k in p.days){var v=p.days[k];if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)||typeof v!=='number'||!isFinite(v)||v<0||v>86400)return {err:'Раздел «days» содержит неверные значения.'};out.days[k]=v;}}
  if(p.sr!==undefined){if(!isObj(p.sr))return {err:'Раздел «sr» повреждён.'};for(k in p.sr){var e=p.sr[k];if(!/^\d{1,2}×\d{1,2}$/.test(k)||!isObj(e)||!isInt(e.box,0,5)||typeof e.due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.due))return {err:'Раздел «sr» содержит неверные значения.'};out.sr[k]={box:e.box,due:e.due};if(typeof e.k4==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.k4))out.sr[k].k4=e.k4;}}
  if(p.daily!==undefined){if(!isObj(p.daily))return {err:'Раздел «daily» повреждён.'};for(k in p.daily){var g=p.daily[k];if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!isObj(g)||!isInt(g.ex||0,0,100000)||!isInt(g.rev||0,0,100000)||!isInt(g.game||0,0,100000))return {err:'Раздел «daily» содержит неверные значения.'};out.daily[k]={ex:g.ex||0,rev:g.rev||0,game:g.game||0};}}
  if(p.final!==undefined){if(!Array.isArray(p.final)||p.final.length>200)return {err:'Раздел «final» повреждён.'};for(var j=0;j<p.final.length;j++){var r=p.final[j];if(!isObj(r)||typeof r.d!=='string'||r.d.length>40||isNaN(Date.parse(r.d))||!isInt(r.n,1,200)||!isInt(r.ok,0,200)||r.ok>r.n)return {err:'Раздел «final» содержит неверные значения.'};out.final.push({d:r.d,ok:r.ok,n:r.n});}}
  if(p.tier!==undefined&&(typeof p.tier!=='string'||RANK[p.tier]===undefined))return {err:'Раздел «tier» повреждён.'};
  out.tier=p.tier!==undefined?p.tier:(p.access===true?'standard':'free');
  out.notes={};out.stk={};
  if(p.notes!==undefined){if(!isObj(p.notes))return {err:'Раздел «notes» повреждён.'};for(k in p.notes){if(!/^\d{1,2}×\d{1,2}$/.test(k)||typeof p.notes[k]!=='string'||p.notes[k].length>100)return {err:'Раздел «notes» содержит неверные значения.'};out.notes[k]=p.notes[k];}}
  if(p.stk!==undefined){if(!isObj(p.stk))return {err:'Раздел «stk» повреждён.'};for(k in p.stk){if(!/^g_[a-z]+$/.test(k)||typeof p.stk[k]!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.stk[k]))return {err:'Раздел «stk» содержит неверные значения.'};out.stk[k]=p.stk[k];}}
  return {data:out};}
function mergeInfo(inc){var r={newDone:0,stars:0,statsNew:0,statsUp:0,days:0,access:false},k;
  for(k in inc.done)if(inc.done[k]&&!P.done[k])r.newDone++;
  for(k in inc.stars)if(inc.stars[k]>(P.stars[k]||0))r.stars++;
  for(k in inc.stats){var s=P.stats[k];if(!s)r.statsNew++;else if(inc.stats[k].ok>s.ok||inc.stats[k].bad>s.bad)r.statsUp++;}
  for(k in inc.days)if(inc.days[k]>(P.days[k]||0))r.days++;
  r.access=RANK[inc.tier]>RANK[tier()];r.sr=0;for(k in inc.sr)if(!P.sr[k]||inc.sr[k].box>P.sr[k].box)r.sr++;
  r.fin=0;inc.final.forEach(function(x){if(!P.final.some(function(y){return y.d===x.d&&y.ok===x.ok&&y.n===x.n;}))r.fin++;});return r;}
function applyMerge(inc){var k;
  for(k in inc.done)if(inc.done[k])P.done[k]=true;
  ['stars','attempts','alts'].forEach(function(n){for(k in inc[n])P[n][k]=Math.max(P[n][k]||0,inc[n][k]);});
  for(k in inc.stats){var s=P.stats[k]||(P.stats[k]={ok:0,bad:0});s.ok=Math.max(s.ok,inc.stats[k].ok);s.bad=Math.max(s.bad,inc.stats[k].bad);}
  for(k in inc.days)P.days[k]=Math.max(P.days[k]||0,inc.days[k]);
  for(k in inc.sr){var c=P.sr[k],n=inc.sr[k];if(!c||n.box>c.box||(n.box===c.box&&n.due>c.due))P.sr[k]={box:n.box,due:n.due};if(n.k4)P.sr[k].k4=n.k4;}
  for(k in inc.daily){var d0=P.daily[k]||{ex:0,rev:0,game:0},d1=inc.daily[k];P.daily[k]={ex:Math.max(d0.ex||0,d1.ex),rev:Math.max(d0.rev||0,d1.rev),game:Math.max(d0.game||0,d1.game)};}
  inc.final.forEach(function(x){if(!P.final.some(function(y){return y.d===x.d&&y.ok===x.ok&&y.n===x.n;}))P.final.push(x);});
  P.final.sort(function(a,b){return Date.parse(a.d)-Date.parse(b.d);});if(P.final.length>50)P.final=P.final.slice(-50);
  for(k in inc.told)P.told[k]=Math.max(P.told[k]||0,inc.told[k]);
  for(k in inc.notes)if(!P.notes[k])P.notes[k]=inc.notes[k];
  for(k in inc.stk)if(!P.stk[k]||inc.stk[k]<P.stk[k])P.stk[k]=inc.stk[k];
  if(RANK[inc.tier]>RANK[tier()])P.tier=inc.tier;save();}
function wireBackup(){
  var msg=document.getElementById('imsg'),pend=null;
  function copyTxt(el,btn){try{navigator.clipboard.writeText(el.value).then(function(){btn.textContent='Скопировано';}).catch(function(){el.select();});}catch(e){el.select();}}
  document.getElementById('dl').onclick=function(){
    var txt=exportText(),d=new Date(),name='progress-'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'.json';
    try{var b=new Blob([txt],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},2000);}catch(e){}
    P.lastBackupAt=new Date().toISOString();save();
    document.getElementById('exptext').value=txt;
    document.getElementById('dlmsg').textContent='Файл '+name+' сохранён. Если он не появился в загрузках, скопируйте текст ниже.';};
  document.getElementById('exptext').value=exportText();
  document.getElementById('cpy').onclick=function(){copyTxt(document.getElementById('exptext'),this);};
  function show(txt){
    var v=validateImport(txt);pend=null;
    if(v.err){msg.innerHTML='<div class="fb try"><strong>Не получилось.</strong><span>'+v.err+'</span></div>';return;}
    var r=mergeInfo(v.data);pend=v.data;
    msg.innerHTML='<div class="fb"><strong>Что изменится</strong><ul class="tips"><li>Новых пройденных блоков: '+r.newDone+'</li><li>Блоков с более высокой оценкой: '+r.stars+'</li><li>Новых примеров в статистике: '+r.statsNew+', обновится: '+r.statsUp+'</li><li>Дней занятий добавится или обновится: '+r.days+'</li>'+(r.sr?'<li>Расписание повторений: '+r.sr+'</li>':'')+(r.fin?'<li>Итоговых проверок: '+r.fin+'</li>':'')+(r.access?'<li>Откроется полный доступ</li>':'')+'</ul><span class="small">Текущий прогресс не удаляется: берётся лучшее из двух вариантов.</span><div class="row"><button type="button" class="btn" id="apply">Объединить</button><button type="button" class="btn ghost" id="cancel">Отмена</button></div></div>';
    document.getElementById('apply').onclick=function(){applyMerge(pend);pend=null;msg.innerHTML='<div class="fb ok"><strong>Готово. Прогресс объединён.</strong></div>';setTimeout(render,900);};
    document.getElementById('cancel').onclick=function(){pend=null;msg.innerHTML='';};}
  document.getElementById('imp').onchange=function(e){var f=e.target.files&&e.target.files[0];if(!f)return;
    if(f.size>2000000){msg.innerHTML='<div class="fb try"><strong>Файл слишком большой для файла прогресса.</strong></div>';return;}
    var fr=new FileReader();fr.onload=function(){show(String(fr.result));};fr.onerror=function(){msg.innerHTML='<div class="fb try"><strong>Не удалось прочитать файл.</strong></div>';};fr.readAsText(f);};
  document.getElementById('impgo').onclick=function(){show(document.getElementById('imptext').value);};}

/* ---------- родителям ---------- */
function rParent(){
  var today=dayKey(),mins=Math.round((P.days[today]||0)/60*10)/10;
  var wk='',max=15;for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var mm=(P.days[dayKey(d)]||0)/60;var hh=Math.round(Math.min(mm,max)/max*100);
    wk+='<div'+(i===0?' class="today-col"':'')+'><i style="height:'+hh+'px" title="'+Math.round(mm)+' мин"></i><span>'+['вс','пн','вт','ср','чт','пт','сб'][d.getDay()]+'</span></div>';}
  var blocks=MODS.map(function(m,i){return '<div><span>Блок '+(i+1)+'. '+m.title+'</span><span>'+(P.done[m.id]?'<span class="stars">'+starsStr(P.stars[m.id]||2)+'</span>':'ещё не пройден')+(P.attempts[m.id]?' · проверок: '+P.attempts[m.id]:'')+(P.alts[m.id]?' · «по-другому»: '+P.alts[m.id]:'')+'</span></div>';}).join('');
  var weak=Object.keys(P.stats).map(function(k){var s=P.stats[k];return {k:k,bad:s.bad,n:s.ok+s.bad};}).filter(function(x){return x.bad>0;}).sort(function(a,b){return b.bad/b.n-a.bad/a.n||b.bad-a.bad;}).slice(0,8);
  var weakH=weak.length?'<div class="bars">'+weak.map(function(x){var p=x.k.split('×');return '<div><span class="mono">'+p[0]+' × '+p[1]+' = '+p[0]*p[1]+'</span><span class="small">ошибок: '+x.bad+' из '+x.n+'</span></div>';}).join('')+'</div>':'<p class="small">Пока нет данных о сложных примерах. Они появятся после первых занятий.</p>';
  var map='';for(var a=1;a<=10;a++)for(var b=1;b<=10;b++){var s=P.stats[Math.min(a,b)+'×'+Math.max(a,b)];var c=s?(s.bad>0?'w':'k'):'';map+='<i class="'+c+'">'+a*b+'</i>';}
  var altTot=0;for(var kk in P.alts)altTot+=P.alts[kk];
  var stTxt=storage.mode==='idb'?'Прогресс хранится в браузере этого устройства (IndexedDB). '+({granted:'Хранилище постоянное: браузер не должен очищать его сам.',denied:'Браузер не обещает хранить данные вечно, поэтому сохраняйте файл прогресса.',unavailable:'Постоянное хранение здесь не поддерживается, поэтому сохраняйте файл прогресса.',unknown:''}[storage.persist]||''):'<b>Сейчас прогресс хранится только в памяти страницы и пропадёт при закрытии.</b> Откройте сервис в обычном окне браузера.';
  var inst=standalone()?'Сервис установлен на устройство.':'Сервис открыт в браузере. Установка на экран «Домой» делает хранение надёжнее.';
  var last=P.lastBackupAt?'Последний файл прогресса сохранён: '+new Date(P.lastBackupAt).toLocaleDateString('ru-RU')+'.':'Файл прогресса ещё не сохранялся.';
  app.innerHTML='<h1 style="margin-top:14px">Родителям</h1>'
  +'<div class="grid2" style="margin-top:14px"><section class="card"><h3>Сегодня</h3><p class="eq" style="margin:8px 0 4px">'+mins+' мин</p><p class="small">Лучше всего 5–10 минут каждый день, чем час раз в неделю. После 10 минут сервис мягко предложит закончить.</p><div class="week" aria-label="Минуты за последние 7 дней"><span class="band" aria-hidden="true"></span>'+wk+'</div><p class="small" style="margin:6px 0 0">Зелёная полоса: 5–10 минут.</p></section>'
  +'<section class="card"><h3>Как помочь</h3><ul class="tips"><li>Спросите: «Как ты это посчитал?». Объяснение вслух показывает, понял ли ребёнок.</li><li>Не торопите и не засекайте время. Скорость придёт сама после понимания.</li><li>Если блок не получается с двух попыток, подождите день и вернитесь.</li><li>Играйте: карточки с примерами, настольные игры с кубиками, клеточки в тетради.</li></ul></section></div>'
  +'<h2>Кнопка «Объясни по-другому»</h2><section class="card"><p>У каждого шага есть три объяснения: через предметы, через клеточки и самое простое. Ребёнок нажимает кнопку и получает другое. Пример для темы «Что значит умножить»:</p><div class="ex"><b>Через предметы</b><span>Представь: 3 тарелки, на каждой по 2 яблока. Сколько яблок всего? Можно считать так: 2 + 2 + 2 = 6. А можно короче: 2 × 3 = 6.</span></div><div class="ex"><b>Через клеточки</b><span>Нарисуй прямоугольник: 2 клетки в ширину и 3 в высоту. Сколько клеток внутри? 2 × 3 = 6. Умножение быстро говорит, сколько клеток в таком прямоугольнике.</span></div><p class="small" style="margin:10px 0 0">Кнопку нажимали: '+altTot+' раз. Если это часто происходит в одном блоке, он ему пока труден. Вернитесь к нему через день.</p></section>'
  +'<h2>Блоки</h2><section class="card"><div class="bars">'+blocks+'</div></section>'
  +'<div class="grid2"><div><h2>Над чем поработать</h2><section class="card">'+weakH+'</section></div><div><h2>Карта таблицы</h2><section class="card"><div class="map" aria-label="Карта освоенных примеров">'+map+'</div><div class="legend"><span class="k">верно с первого раза</span><span class="w">были ошибки</span><span>ещё не встречались</span></div></section></div></div>'
  +advParent()
  +'<h2>Сохранить прогресс</h2><section class="card" id="bk"><p>'+stTxt+'</p><p class="small">'+inst+' '+last+'</p>'
  +'<div class="row" style="margin:12px 0"><button type="button" class="btn" id="dl">Экспортировать прогресс</button><label class="btn ghost" for="imp" style="cursor:pointer">Импортировать прогресс</label><input type="file" id="imp" accept=".json,application/json" hidden></div><p class="small" id="dlmsg" aria-live="polite"></p><div id="imsg" aria-live="polite"></div>'
  +'<details><summary>Не скачался файл? Скопируйте текст</summary><textarea class="ta" id="exptext" rows="5" readonly aria-label="Текст файла прогресса"></textarea><button type="button" class="btn ghost" id="cpy" style="min-height:40px;font-size:15px">Скопировать</button></details>'
  +'<details><summary>Вставить текст вместо файла</summary><textarea class="ta" id="imptext" rows="4" aria-label="Вставьте текст файла прогресса"></textarea><button type="button" class="btn ghost" id="impgo" style="min-height:40px;font-size:15px">Проверить</button></details>'
  +'<p class="small" style="margin-top:12px"><a href="'+dl('how')+'">Как хранятся данные</a></p></section>'
  +'<h2>Доступ</h2><section class="card" id="acc"><p>Сейчас открыт тариф: <b>'+TIER_NAME[tier()]+'</b>.</p>'+(tier()==='pro'?'<p class="small">Все возможности открыты. Доступ сохранится вместе с файлом прогресса.</p>':'<div class="row" style="margin:12px 0"><button type="button" class="btn" data-v="buy">Посмотреть тарифы</button></div><h3 style="font-size:19px;margin:8px 0">У меня есть код</h3>'+codeForm())+'</section>'
  +'<p class="small" style="margin-top:20px"><span id="rs"><button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px" id="reset">Сбросить прогресс</button></span></p>';
  wireBackup();
  if(tier()!=='pro'&&document.getElementById('code'))wireCode(function(){render();});
  document.getElementById('reset').onclick=function(){document.getElementById('rs').innerHTML='Точно сбросить всё? <button type="button" class="btn" style="min-height:40px;padding:4px 14px;font-size:15px" id="yes">Да, сбросить</button> <button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px" id="no">Отмена</button>';
    document.getElementById('yes').onclick=function(){var a=P.tier,ad=P.adv;P=freshP();P.tier=a;P.adv=ad;P.onboarded=true;save();render();};
    document.getElementById('no').onclick=function(){render();};};}

/* ---------- продвинутый режим ---------- */
var FINAL_N=30,FINAL_PASS=90,SR_INT=[0,1,3,7,14,30],gTimer=null;
function iso(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function addDays(n){var d=new Date();d.setDate(d.getDate()+n);return iso(d);}
function dailyNow(){return P.daily[iso()]||{ex:0,rev:0,game:0};}
function bump(f){var k=iso(),d=P.daily[k]||(P.daily[k]={ex:0,rev:0,game:0});d[f]=(d[f]||0)+1;save();}
function srUpdate(f,ok){var k=fk(f),e=P.sr[k]||(P.sr[k]={box:0,due:iso()});e.box=ok?Math.min(5,e.box+1):0;e.due=addDays(SR_INT[e.box]);if(e.box>=4){if(!e.k4)e.k4=iso();}else delete e.k4;}
function dueList(){var t=iso(),o=[];for(var k in P.sr){if(P.sr[k].due<=t){var p=k.split('×');o.push([+p[0],+p[1]]);}}
  return o.sort(function(x,y){return P.sr[fk(x)].box-P.sr[fk(y)].box;});}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=ri(0,i),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function syncChrome(){var sw=document.querySelector('.adv-sw');if(sw)sw.setAttribute('aria-checked',P.adv?'true':'false');
  var g=document.querySelector('.nav [data-v="games"]');if(g)g.hidden=!can('games');var sk=document.querySelector('.nav [data-v="stickers"]');if(sk)sk.hidden=!can('stickers');}
function setAdv(on){if(on&&tier()==='free'){go({name:'buy',why:'feature',need:'standard',title:'Продвинутый режим'});return;}
  P.adv=!!on;if(!P.adv&&['games','hard','stickers'].indexOf(view.name)>=0)view={name:'home'};save();syncChrome();render();}

/* что вспомнить до объяснения и что рассказать после */
var PICKX={m2:1,m4:2,m5:5,m6:4,m7:3,m8:7,m9:6,m10:6};
var PRE={
 m1:{lead:'Сколько будет?',eq:'3 + 3 + 3 = ?',ans:9},
 m2:{lead:'Угадай.',eq:'Если 2 × 3 = 6, то 3 × 2 = ?',ans:6},
 m3:{lead:'Угадай.',eq:'5 × 5 = ?',ans:25},
 m4:{lead:'Угадай.',eq:'3 × 10 = ?',ans:30},
 m5:{lead:'Сколько будет?',eq:'6 + 6 = ?',ans:12},
 m6:{lead:'Угадай.',eq:'Если 10 × 4 = 40, то 5 × 4 = ?',ans:20},
 m7:{lead:'Угадай.',eq:'Если 10 × 3 = 30, то 9 × 3 = ?',ans:27},
 m8:{lead:'Угадай.',eq:'Если 5 × 6 = 30, то 6 × 6 = ?',ans:36},
 m9:{lead:'Угадай.',eq:'6 конфет разложили поровну в 2 пакета. Сколько в каждом?',ans:3},
 m10:{lead:'Угадай.',eq:'3 × 4 = 12. Значит 12 ÷ 3 = ?',ans:4}};
var SAY={
 m1:{say:'Расскажи, что значит 4 × 3. Покажи на картинке.',parent:'Спросите: «А как записать 4 + 4 + 4 короче?»'},
 m2:{say:'Объясни, почему 3 × 4 и 4 × 3 одинаковые. Поверни прямоугольник.',parent:'Спросите: «Сколько примеров можно не учить, если знаешь это?»'},
 m3:{say:'Покажи в квадрате пару 6 × 7 и 7 × 6.',parent:'Спросите: «Что ты замечаешь на диагонали?»'},
 m4:{say:'Скажи, что происходит с числом, когда его умножаешь на 1 и на 10.',parent:'Спросите: «Почему при умножении на 10 дописывается ноль?»'},
 m5:{say:'Объясни, как умножить на 4, если знаешь умножение на 2.',parent:'Спросите: «А как умножить на 8?»'},
 m6:{say:'Расскажи, как найти 5 × 8 через 10 × 8.',parent:'Спросите: «Почему ответы оканчиваются на 0 или на 5?»'},
 m7:{say:'Покажи фокус с пальцами для 9 × 4 и объясни, что значат пальцы слева и справа.',parent:'Спросите: «Как проверить ответ девятки по сумме цифр?»'},
 m8:{say:'Разбей 7 × 6 на два знакомых примера и расскажи, как получилось.',parent:'Спросите: «А можно разбить по-другому?»'},
 m9:{say:'Придумай историю про 12 конфет, которые делят поровну.',parent:'Спросите: «Чем отличается «разложить по 3» от «раздать троим»?»'},
 m10:{say:'Расскажи, как узнать 56 ÷ 7, если помнишь 7 × 8.',parent:'Спросите: «Какие ещё три примера получатся из 3 × 4 = 12?»'}};

/* задачи с историей */
var ITEMS=[{o:'карандаш',f:'карандаша',m:'карандашей'},{o:'яблоко',f:'яблока',m:'яблок'},{o:'конфета',f:'конфеты',m:'конфет'},{o:'наклейка',f:'наклейки',m:'наклеек'},{o:'монета',f:'монеты',m:'монет'}];
var CONT=[{n:'Коробок',g:'коробок',p:'коробке',e:'ой'},{n:'Тарелок',g:'тарелок',p:'тарелке',e:'ой'},{n:'Корзин',g:'корзин',p:'корзине',e:'ой'},{n:'Полок',g:'полок',p:'полке',e:'ой'},{n:'Пакетов',g:'пакетов',p:'пакете',e:'ом'}];
function form(it,n){var a=n%10,b=n%100;return (a===1&&b!==11)?it.o:((a>=2&&a<=4&&!(b>=12&&b<=14))?it.f:it.m);}
function story(f,mode){var a=f[0],b=f[1];if(Math.random()<.5){var x=a;a=b;b=x;}
  var it=pick(ITEMS),c=pick(CONT),N=a*b,t=mode==='div'?pick(['divc','divs']):(mode==='mul'?'mul':pick(['mul','mul','divc','divs']));
  var per=' В кажд'+c.e+' '+c.p+' по '+b+' '+form(it,b)+'.';
  if(t==='mul')return Mul(a,b,{key:'st'+a+'x'+b+it.o,lead:c.n+' было '+a+'.'+per+' Сколько '+it.m+' всего?',eq:'?',fact:[a,b]});
  if(t==='divc')return Div(N,b,{key:'sd'+N+'c'+b+it.o,lead:'Всего '+N+' '+form(it,N)+'.'+per+' Сколько '+c.g+'?',eq:'?',fact:[a,b]});
  return Div(N,a,{key:'ss'+N+'k'+a+it.o,lead:N+' '+form(it,N)+' раздали поровну '+a+' детям. Сколько '+it.m+' у каждого?',eq:'?',fact:[a,b]});}
function storyFor(m){var id=m.id,f;
  if(id==='m4')f=[10,ri(2,5)];else if(id==='m5')f=[pick([2,4]),ri(2,5)];else if(id==='m6')f=[5,ri(2,6)];
  else if(id==='m7')f=[9,ri(2,5)];else if(id==='m8')f=[pick([3,6,7,8]),ri(2,5)];else f=[ri(2,5),ri(2,5)];
  var q=story(f,(id==='m9'||id==='m10')?'div':'mul');q.lead='Задача. '+q.lead;return q;}

/* выбор приёма */
var STR_LBL={'1':'Число не меняется','10':'Дописать ноль справа','9':'Умножить на 10 и вычесть число','5':'Взять половину от умножения на 10','2':'Удвоить число','4':'Удвоить два раза','s':'Разбить на два знакомых примера'};
function stratKeys(a,b){var o={};[a,b].forEach(function(x){o[(x>=3&&x<=8&&x!==4&&x!==5)?'s':String(x)]=1;});return o;}
function choiceItem(f){var a=f[0],b=f[1],valid=stratKeys(a,b),vk=Object.keys(valid),bad=Object.keys(STR_LBL).filter(function(k){return !valid[k];});
  var opts=[pick(vk)].concat(shuffle(bad).slice(0,2));shuffle(opts);
  return {kind:'choice',f:f,valid:valid,opts:opts.map(function(k){return {k:k,t:STR_LBL[k]};})};}
function rChoice(it){
  var a=it.f[0],b=it.f[1],card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">Выбери приём</div><p class="ask-lead">Как удобнее посчитать?</p><div class="eq">'+a+' × '+b+'</div><div class="opts" id="ch"></div><div id="fb" aria-live="polite"></div><div class="row act" style="margin-top:14px"></div>';
  var ch=card.querySelector('#ch'),fb=card.querySelector('#fb'),rw=card.querySelector('.row'),miss=0,done=false;
  it.opts.forEach(function(o){var bt=h('<button type="button" class="opt">'+o.t+'</button>');
    bt.onclick=function(){if(done)return;
      if(it.valid[o.k]){done=true;ch.querySelectorAll('button').forEach(function(x){x.disabled=true;});bt.classList.add('good');
        fb.innerHTML='<div class="fb ok"><strong>Подходит.</strong><span>Вот один из способов рассуждать:</span><div class="hint"><p>'+strat(a,b)+'</p></div></div>';
        var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);nx.focus();}
      else{miss++;bt.classList.add('bad');bt.disabled=true;fb.innerHTML='<div class="fb try"><strong>Не совсем подходит.</strong><span>Попробуй другой приём.</span>'+(miss>=2?'<div class="hint"><p>'+strat(a,b)+'</p></div>':'')+'</div>';}};
    ch.appendChild(bt);});
  app.appendChild(card);}

/* вопрос «что ты помнишь» до объяснения */
function rPre(it){
  var d=PRE[it.mod.id],card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">Сначала вспомним</div><p class="ask-lead">'+d.lead+'</p><div class="eq sm">'+d.eq+'</div><p class="small">Угадай. Ошибиться не страшно: сейчас всё разберём.</p><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Ответить</button><button type="button" class="btn ghost" id="idk">Не знаю</button></div><div id="fb" aria-live="polite"></div>';
  app.appendChild(card);
  var inp=card.querySelector('#ans'),chk=card.querySelector('#chk'),idk=card.querySelector('#idk'),fb=card.querySelector('#fb'),done=false;
  inp.focus({preventScroll:true});
  function next(){R.i++;render();window.scrollTo(0,0);}
  function fin(msg){done=true;inp.disabled=true;idk.hidden=true;chk.textContent='Дальше';chk.onclick=next;chk.focus();fb.innerHTML=msg;}
  function check(){if(done){next();return;}var v=parseInt(inp.value,10);if(isNaN(v)){inp.focus();return;}
    fin(v===d.ans?'<div class="fb ok"><strong>Ты уже многое знаешь!</strong><span>Сейчас разберёмся, почему так.</span></div>':'<div class="fb"><strong>Правильный ответ: '+d.ans+'.</strong><span>Сейчас разберёмся, как к нему прийти.</span></div>');}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)check();};
  idk.onclick=function(){fin('<div class="fb"><strong>Ничего страшного.</strong><span>Правильный ответ: '+d.ans+'. Сейчас разберёмся, как к нему прийти.</span></div>');};}

/* объяснить вслух */
function sayBox(card,it){
  if(!can('say')||it.alt)return;var m=it.mod;if(it.idx!==m.steps.length-1)return;var s=SAY[m.id];if(!s)return;
  card.querySelector('.demo').insertAdjacentHTML('afterend','<div class="say"><b>Расскажи вслух</b><p>'+s.say+'</p><p class="small">Родителю. '+s.parent+'</p><button type="button" class="btn ghost" style="min-height:40px;font-size:15px">Я рассказал(а)</button></div>');
  var b=card.querySelector('.say button');b.onclick=function(){P.told[m.id]=(P.told[m.id]||0)+1;save();b.textContent='Записано';b.disabled=true;};}

/* тренажёр: повторения по расписанию, чередование, задачи, выбор приёма */
function qFor(f,kind){var a=f[0],b=f[1];if(Math.random()<.5){var x=a;a=b;b=x;}
  if(kind==='div')return Div(a*b,a);if(kind==='miss')return Miss(a,b);return Mul(a,b);}
function trainItems(){
  if(!can('mix'))return pickTrain(8).map(function(q){return {kind:'ask',q:q,scored:true,phase:'Тренажёр'};});
  var facts=allowedFacts(),map={},picked=[],used={};
  facts.forEach(function(f){map[fk(f)]=f;});
  function add(f){var k=fk(f);if(used[k]||!map[k])return false;used[k]=1;picked.push(map[k]);return true;}
  if(can('sr'))dueList().slice(0,4).forEach(add);
  shuffle(facts.filter(function(f){return !P.sr[fk(f)];})).slice(0,2).forEach(add);
  function w(f){var s=P.stats[fk(f)]||{ok:0,bad:0};return 1+5*s.bad/(s.ok+s.bad+1);}
  var guard=0;
  while(picked.length<8&&guard++<400){var tot=0;facts.forEach(function(f){tot+=w(f);});var r=Math.random()*tot,f=facts[0];
    for(var i=0;i<facts.length;i++){r-=w(facts[i]);if(r<=0){f=facts[i];break;}}add(f);}
  shuffle(picked);
  var kinds=['mul','mul'];if(P.done.m2)kinds.push('miss');if(P.done.m9)kinds.push('div','div');
  var strategies=!!(P.done.m4||P.done.m5||P.done.m6||P.done.m7||P.done.m8),storyAt={},choiceAt={};
  if(can('story')&&picked.length>2){storyAt[ri(0,picked.length-1)]=1;}
  if(strategies){while(Object.keys(choiceAt).length<2&&Object.keys(choiceAt).length<picked.length)choiceAt[ri(0,picked.length-1)]=1;}
  var items=[];
  picked.forEach(function(f,i){
    if(choiceAt[i])items.push(choiceItem(f));
    if(storyAt[i]){var sq=story(f,P.done.m9?null:'mul');items.push({kind:'ask',q:sq,scored:true,phase:'Задача'});}
    else items.push({kind:'ask',q:qFor(f,pick(kinds)),scored:true,phase:'Тренажёр'});});
  return items;}

/* итоговая проверка */
function startFinal(){
  var facts=allowedFactsAll(),items=[];
  shuffle(facts).slice(0,FINAL_N).forEach(function(f,i){var kind=i%4===0?'miss':(i%3===0?'div':'mul');items.push({kind:'final',q:qFor(f,kind)});});
  R={mode:'final',mod:null,items:items,i:0,retries:0};NAMES.run='home';go({name:'run'});}
function allowedFactsAll(){var o=[];for(var a=2;a<=10;a++)for(var b=a;b<=10;b++)o.push([a,b]);return o;}
function rFinalQ(it){
  var q=it.q,last=R.i===R.items.length-1,card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">Итоговая проверка</div><p class="step-n">Задание '+(R.i+1)+' из '+R.items.length+'</p><p class="ask-lead">'+q.lead+'</p><div class="eq">'+q.eq+'</div><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">'+(last?'Закончить':'Дальше')+'</button></div><p class="small">Здесь нет подсказок: так видно, что ты знаешь сам. Если не знаешь, оставь поле пустым и нажми кнопку.</p>';
  app.appendChild(card);
  var inp=card.querySelector('#ans');inp.value=it.val===undefined||it.val===null?'':String(it.val);inp.focus({preventScroll:true});
  function go2(){var v=parseInt(inp.value,10);it.val=isNaN(v)?null:v;R.i++;render();window.scrollTo(0,0);}
  card.querySelector('#chk').onclick=go2;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)go2();};}
function finishFinal(){
  var ok=0,wrong=[];
  R.items.forEach(function(it){var q=it.q,good=it.val===q.answer;if(good)ok++;else wrong.push(q);if(q.fact)rec(q.fact,good);});
  var finalPassedBefore=finalPassed();
  var n=R.items.length,pct=Math.round(ok/n*100);
  P.final.push({d:new Date().toISOString(),ok:ok,n:n});if(P.final.length>50)P.final=P.final.slice(-50);save();
  var pass=pct>=FINAL_PASS;
  app.innerHTML='<section class="card lift"><div class="phase">Итоговая проверка</div><div class="big-stars" aria-label="Результат">'+ok+' из '+n+'</div><h2 style="margin:14px 0 10px">'+(pass?'Цель достигнута: '+pct+'%':'Результат: '+pct+'%')+'</h2><p>'+(pass?'Ты хорошо знаешь таблицу умножения и деления.':'Цель: '+FINAL_PASS+'% и выше. Это не страшно: поработай в тренажёре над слабыми примерами и попробуй снова через несколько дней.')+'</p>'+(wrong.length?'<p class="small">Где были ошибки:</p><div class="chips" style="margin-bottom:14px">'+wrong.map(function(q){return '<span class="chip">'+q.eq.replace('?',q.answer)+'</span>';}).join('')+'</div>':'')+'<div class="row"><button type="button" class="btn" data-v="train">В тренажёр</button><button type="button" class="btn ghost" data-v="home">На главную</button></div></section>';
  if(pass&&(can('stickers')||can('tips'))){app.querySelector('section').insertAdjacentHTML('beforeend',(can('stickers')?stickerNote('final',!finalPassedBefore):'')+(can('tips')?tipHtml():''));}}

/* игры */
var GAMES=[{id:'pairs',t:'Найди пару',d:'Открывай по две карточки. Найди пример и его ответ.',run:gPairs},{id:'odd',t:'Найди ошибку',d:'Среди четырёх равенств одно неверное. Найди его.',run:gOdd},{id:'rect',t:'Собери прямоугольник',d:'Подбери длину и ширину, чтобы получилась нужная площадь.',run:gRect},{id:'rhythm',t:'Счёт шагами',d:'Лягушка прыгает по кочкам. Считай её прыжки вслух.',run:gRhythm}];
function rGames(){
  if(gate('games','Игры'))return;
  var g=view.g;
  if(!g){app.innerHTML='<section class="card lift"><p class="kicker">Продвинутый режим</p><h1>Игры</h1><p class="lead" style="margin-top:12px">Короткие игры на 2–3 минуты. Без таймера и очков.</p></section><h2>Выбери игру</h2><div class="mods">'+GAMES.map(function(x){return '<button type="button" class="mod" data-g="'+x.id+'"><span class="mod-tag">'+x.t+'</span><span class="mod-s">'+x.d+'</span></button>';}).join('')+'</div>';return;}
  var def=GAMES.filter(function(x){return x.id===g;})[0];if(!def){go({name:'games'});return;}
  var card=h('<section class="card lift"><div class="phase">Игра</div><h2 style="margin:0 0 6px">'+def.t+'</h2><p class="lead" style="margin-bottom:12px">'+def.d+'</p><div class="demo" id="gbox"></div><div id="gend" aria-live="polite"></div><div class="row act" style="margin-top:14px"><button type="button" class="btn ghost" data-g="'+g+'">Заново</button><button type="button" class="btn ghost" data-g="">К играм</button></div></section>');
  app.appendChild(card);var finished=false;
  def.run(card.querySelector('#gbox'),function(){if(finished)return;finished=true;bump('game');var newS=award('g_'+g);card.querySelector('#gend').innerHTML='<div class="fb ok" style="margin-top:12px"><strong>Игра пройдена!</strong><span>Засчитано в цели на сегодня.</span></div>'+stickerNote('g_'+g,newS);});}
function gPairs(box,done){
  var fs=shuffle(allowedFacts().slice()),six=[],prod={};
  for(var i=0;i<fs.length&&six.length<6;i++){var p=fs[i][0]*fs[i][1];if(!prod[p]){prod[p]=1;six.push(fs[i]);}}
  var cards=[];six.forEach(function(f,i){var a=Math.random()<.5?f:[f[1],f[0]];cards.push({id:i,t:a[0]+' × '+a[1]});cards.push({id:i,t:String(f[0]*f[1])});});
  shuffle(cards);
  box.innerHTML='<div class="gcs"></div><p class="read" id="gm" aria-live="polite">Открой две карточки.</p>';
  var grid=box.querySelector('.gcs'),msg=box.querySelector('#gm'),open=[],lock=false,matched=0,moves=0;
  cards.forEach(function(c){
    var b=h('<button type="button" class="gc" aria-label="Закрытая карточка"><span>?</span></button>');b.dataset.t=c.t;b.dataset.id=c.id;
    b.onclick=function(){
      if(lock||b.classList.contains('open')||b.classList.contains('ok'))return;
      b.classList.add('open');b.firstChild.textContent=c.t;b.setAttribute('aria-label',c.t);open.push({b:b,c:c});
      if(open.length===2){moves++;var x=open[0],y=open[1];
        if(x.c.id===y.c.id){x.b.classList.add('ok');y.b.classList.add('ok');open=[];matched++;
          if(matched===six.length){msg.textContent='Все пары найдены. Ходов: '+moves+'.';done();}else msg.textContent='Есть пара! Осталось: '+(six.length-matched);}
        else{lock=true;msg.textContent='Не пара. Запомни и попробуй снова.';setTimeout(function(){[x,y].forEach(function(o){o.b.classList.remove('open');o.b.firstChild.textContent='?';o.b.setAttribute('aria-label','Закрытая карточка');});open=[];lock=false;},900);}}};
    grid.appendChild(b);});}
function gOdd(box,done){
  var round=0,total=5;
  function draw(){
    if(round>=total){box.innerHTML='<p class="read">Все раунды пройдены.</p>';done();return;}
    var fs=shuffle(allowedFacts().slice()).slice(0,4),bad=ri(0,3);
    var eqs=fs.map(function(f,i){var r=f[0]*f[1];if(i===bad){var d;do{d=pick([-3,-2,-1,1,2,3,10,-10]);}while(r+d<1);r+=d;}return {t:f[0]+' × '+f[1]+' = '+r,ok:i!==bad,f:f};});
    box.innerHTML='<p class="step-n">Задание '+(round+1)+' из '+total+'</p><p class="ask-lead">Найди неверное равенство.</p><div class="opts" id="ch"></div><p class="read" id="gm" aria-live="polite"></p><div class="row" id="gn"></div>';
    var ch=box.querySelector('#ch'),msg=box.querySelector('#gm'),finish=false;
    eqs.forEach(function(e){var b=h('<button type="button" class="opt">'+e.t+'</button>');
      b.onclick=function(){if(finish)return;
        if(!e.ok){finish=true;b.classList.add('good');ch.querySelectorAll('button').forEach(function(x){x.disabled=true;});msg.textContent='Верно! '+e.f[0]+' × '+e.f[1]+' = '+e.f[0]*e.f[1]+'.';
          var nx=h('<button type="button" class="btn">'+(round+1>=total?'Закончить':'Дальше')+'</button>');nx.onclick=function(){round++;draw();};box.querySelector('#gn').appendChild(nx);nx.focus();}
        else{b.classList.add('bad');b.disabled=true;msg.textContent='Это равенство верное. Ищи дальше.';}};
      ch.appendChild(b);});}
  draw();}
function gRect(box,done){
  var T=shuffle([12,16,18,20,24,30,36]).slice(0,4),round=0,w=3,hh=2;
  function draw(){
    if(round>=T.length){box.innerHTML='<p class="read">Все прямоугольники собраны.</p>';done();return;}
    var N=T[round];
    box.innerHTML='<p class="step-n">Задание '+(round+1)+' из '+T.length+'</p><p class="ask-lead">Собери прямоугольник из '+N+' клеток.</p><div id="rs"></div><div id="rv"></div><p class="read" id="gm" aria-live="polite"></p><div class="row" id="gb"></div>';
    var rs=box.querySelector('#rs'),rv=box.querySelector('#rv'),msg=box.querySelector('#gm'),gb=box.querySelector('#gb'),solved=false;
    function view2(){rv.innerHTML=rect(w,hh)+'<div class="eq sm" style="margin-top:8px">'+w+' × '+hh+' = '+w*hh+'</div>';}
    rs.appendChild(row(stepper('Клеток в ряду',1,10,w,function(v){w=v;if(!solved)msg.textContent='';view2();}),stepper('Рядов',1,10,hh,function(v){hh=v;if(!solved)msg.textContent='';view2();})));
    view2();
    var chk=h('<button type="button" class="btn">Проверить</button>');gb.appendChild(chk);
    chk.onclick=function(){
      if(solved){round++;draw();return;}
      if(w*hh===N){solved=true;var ways=[];for(var d=1;d<=10;d++){if(N%d===0&&N/d<=10&&d<=N/d&&!((d===w&&N/d===hh)||(d===hh&&N/d===w)))ways.push(d+' × '+N/d);}
        msg.innerHTML=ways.length?'Верно! Ещё способы для числа '+N+'.<br>'+ways.join(' или ')+'.':'Верно! Для числа '+N+' других способов с числами до 10 нет.';chk.textContent=round+1>=T.length?'Закончить':'Дальше';}
      else{msg.textContent='Сейчас клеток: '+w*hh+'. Нужно '+N+'. Измени длину или ширину.';}};}
  draw();}
function gRhythm(box,done){
  var step=2,pos=0,v=0,fin=false,JUMPS=6;
  var cap=h('<div></div>'),body=h('<div></div>');
  function list(sx){var o=[];for(var i=1;i<=5;i++)o.push(sx*i);return o.join(', ');}
  function txt(){
    if(v===0)return step===2?'Муравей идёт по одной кочке: 1, 2, 3, 4, 5. А лягушка прыгает через одну и садится на 2, 4, 6, 8, 10. Это счёт через два.':'Муравей идёт по одной кочке: 1, 2, 3, 4, 5. А лягушка прыгает сразу вперёд на '+step+'. Она садится только на числа '+list(step)+'. Это счёт шагами по '+step+'.';
    if(v===1)return step===2?'Встань на лесенку. Наступи на вторую ступеньку, потом на четвёртую, на шестую. Ты перешагиваешь через одну ступеньку. Это и есть счёт через два.':'Представь лесенку. Мы поднимаемся не по одной ступеньке, а сразу на '+step+'. Наступаем на ступеньки '+list(step)+'. Остальные перешагиваем.';
    if(step===2)return 'Возьми носки или обувь. Посчитаем парами, а не по одному: 2, 4, 6, 8. В каждой паре по два.';
    if(step===5)return 'Покажи ладошку. На одной руке 5 пальцев. Считаем руками: 5 (одна рука), 10 (две руки), 15 (три руки).';
    return 'Возьми предметы кучками по '+step+'. Считаем кучками: '+list(step)+'. Каждая кучка добавляет по '+step+'.';}
  function stop(){if(gTimer){clearInterval(gTimer);gTimer=null;}}
  function jump(){if(pos<JUMPS){pos++;draw();}if(pos>=JUMPS){stop();draw();if(!fin){fin=true;done();}}}
  function head(){
    cap.innerHTML='<p class="expl" aria-live="polite">'+txt()+'</p><p class="vcap small">Объяснение '+(v+1)+' из 3</p><div class="row"><button type="button" class="btn ghost alt" id="alt2">'+ICON+'Объясни по-другому</button></div>';
    cap.querySelector('#alt2').onclick=function(){v=(v+1)%3;head();draw();};}
  function draw(){
    var total=step*JUMPS,said=[],i,out='';
    for(i=1;i<=pos;i++)said.push(step*i);
    if(v===2){out=pos>0?groups(step,pos):'<p class="small">Нажми «Прыжок»: появится ещё одна кучка.</p>';}
    else{
      var cells='';
      for(i=0;i<=total;i++){var land=i>0&&i%step===0&&i<=pos*step,cls=i===pos*step?' now':(land?' on':'');cells+='<span class="kc'+cls+'">'+i+'</span>';}
      out='<div class="track" role="img" aria-label="Кочки от 0 до '+total+'">'+cells+'</div><p class="small" style="margin:0 0 8px">'+(v===1?'Яркие числа: на какие ступеньки мы наступили. Бледные числа: которые перешагнули.':'Яркие числа: куда села лягушка. Бледные числа: через них она перепрыгнула.')+'</p>';}
    body.innerHTML=out+'<p class="read" aria-live="polite">'+(pos===0?'Нажми «Прыжок». Лягушка прыгнет вперёд на '+step+'.':'Прыжок '+pos+'. Лягушка села на '+step*pos+'.<br>Скажи вслух: '+said.join(', ')+'.<br>'+step+' × '+pos+' = '+step*pos)+'</p><div class="row"><button type="button" class="btn" id="jp">Прыжок</button><button type="button" class="btn ghost" id="au">'+(gTimer?'Стоп':(pos>=JUMPS?'Сначала':'Автоматом'))+'</button></div>';
    body.querySelector('#jp').onclick=function(){stop();jump();};
    body.querySelector('#au').onclick=function(){if(gTimer){stop();draw();return;}if(pos>=JUMPS){pos=0;}gTimer=setInterval(jump,1000);draw();};}
  box.append(row(stepper('Прыгаем по',2,10,step,function(n){stop();step=n;pos=0;head();draw();})),cap,body);head();draw();}

/* главная и родительский раздел */
/* ---------- продвинутый режим, этап 2 ---------- */
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* картинки-герои и наклейки */
function gridSvg(){var s='';for(var r=0;r<3;r++)for(var c=0;c<3;c++)s+='<rect class="'+(r===1&&c===1?'b':'a')+'" x="'+(8+c*13)+'" y="'+(8+r*13)+'" width="11" height="11" rx="2"/>';return s;}
var HERO={
 m1:'<rect class="c" x="6" y="22" width="44" height="28" rx="4"/><circle class="b" cx="18" cy="36" r="5"/><circle class="b" cx="38" cy="36" r="5"/><path class="l" d="M6 22l8-8h28l8 8"/>',
 m2:'<rect class="a" x="6" y="8" width="30" height="22" rx="3"/><rect class="b" x="22" y="22" width="22" height="30" rx="3"/>',
 m3:gridSvg(),
 m4:'<circle class="b" cx="28" cy="28" r="22"/><text x="28" y="35" text-anchor="middle" font-size="20">10</text>',
 m5:'<ellipse class="g" cx="28" cy="38" rx="20" ry="13"/><circle class="g" cx="17" cy="23" r="8"/><circle class="g" cx="39" cy="23" r="8"/><circle class="c" cx="17" cy="23" r="4"/><circle class="c" cx="39" cy="23" r="4"/><circle class="k" cx="17" cy="23" r="1.8"/><circle class="k" cx="39" cy="23" r="1.8"/><path class="l" d="M19 40q9 6 18 0"/>',
 m6:'<ellipse class="c" cx="19" cy="14" rx="5" ry="12"/><ellipse class="c" cx="37" cy="14" rx="5" ry="12"/><circle class="c" cx="28" cy="37" r="16"/><circle class="k" cx="22" cy="34" r="2"/><circle class="k" cx="34" cy="34" r="2"/><circle class="b" cx="28" cy="41" r="2.5"/>',
 m7:'<rect class="a" x="12" y="30" width="32" height="22" rx="8"/><rect class="a" x="12" y="10" width="6" height="26" rx="3"/><rect class="a" x="20" y="6" width="6" height="30" rx="3"/><rect class="a" x="28" y="6" width="6" height="30" rx="3"/><rect class="a" x="36" y="10" width="6" height="26" rx="3"/>',
 m8:'<rect class="a" x="6" y="14" width="26" height="28" rx="3"/><rect class="b" x="24" y="14" width="26" height="28" rx="3"/><circle class="b" cx="30" cy="28" r="5"/>',
 m9:'<path class="c" d="M16 20h24l6 28q0 4-4 4H14q-4 0-4-4z"/><path class="l" d="M20 20q8-10 16 0"/><circle class="b" cx="22" cy="38" r="3.5"/><circle class="a" cx="34" cy="38" r="3.5"/><circle class="b" cx="28" cy="45" r="3.5"/>',
 m10:'<circle class="a" cx="17" cy="28" r="13"/><circle class="b" cx="39" cy="28" r="13"/><text x="17" y="34" text-anchor="middle" font-size="18">×</text><text x="39" y="34" text-anchor="middle" font-size="18">÷</text>',
 g_pairs:'<rect class="a" x="6" y="12" width="22" height="30" rx="3"/><rect class="b" x="26" y="18" width="22" height="30" rx="3"/><text x="37" y="39" text-anchor="middle" font-size="16">?</text>',
 g_odd:'<circle class="c" cx="24" cy="24" r="15"/><path class="l" d="M35 35l14 14"/><path class="l" d="M17 21h14M17 28h14"/>',
 g_rect:'<rect class="a" x="6" y="14" width="40" height="28" rx="3"/><path class="l" d="M19 14v28M32 14v28M6 28h40"/>',
 g_rhythm:'<circle class="g" cx="10" cy="44" r="5"/><circle class="g" cx="28" cy="18" r="5"/><circle class="g" cx="46" cy="44" r="5"/><path class="l" d="M10 40q18-34 36 0"/>',
 final:'<polygon class="b" points="28,6 34,21 50,22 38,33 42,49 28,40 14,49 18,33 6,22 22,21"/>'};
function hero(id,size){return HERO[id]?'<svg class="hero" viewBox="0 0 56 56" width="'+size+'" height="'+size+'" aria-hidden="true" focusable="false">'+HERO[id]+'</svg>':'';}
function finalPassed(){return P.final.some(function(r){return r.ok/r.n*100>=FINAL_PASS;});}
function award(id){if(P.stk[id])return false;P.stk[id]=iso();save();return true;}
function stickerList(){return MODS.map(function(m){return {id:m.id,t:m.title,ok:!!P.done[m.id]};}).concat(GAMES.map(function(g){return {id:'g_'+g.id,t:g.t,ok:!!P.stk['g_'+g.id]};})).concat([{id:'final',t:'Итоговая проверка',ok:finalPassed()}]);}
function stickerNote(id,first){return '<div class="stk-note">'+hero(id,56)+'<div><b>'+(first?'Новая наклейка!':'Эта наклейка уже в коллекции.')+'</b><br><span class="small">Все награды лежат в разделе «Награды» на главной.</span></div></div>';}
function rStickers(){
  if(gate('stickers','Награды'))return;
  var L=stickerList(),n=L.filter(function(x){return x.ok;}).length;
  app.innerHTML='<section class="card lift"><p class="kicker">Твоя коллекция</p><h1>Награды</h1><p class="lead" style="margin-top:12px">Наклейка даётся за каждый пройденный блок, каждую игру и за итоговую проверку. Собрано: '+n+' из '+L.length+'. Спешить не нужно.</p></section><div class="stks">'+L.map(function(x){return '<div class="stk'+(x.ok?' got':'')+'">'+hero(x.id,64)+'<b>'+esc(x.t)+'</b><span class="small">'+(x.ok?'Получена':'Ещё не получена')+'</span></div>';}).join('')+'</div><p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">На главную</button></p>';}

/* озвучка (встроенный голос браузера, ничего не отправляется) */
var SPK='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function ttsOk(){return typeof window.speechSynthesis!=='undefined'&&typeof window.SpeechSynthesisUtterance!=='undefined';}
function ttsRu(){try{var v=speechSynthesis.getVoices();for(var i=0;i<v.length;i++){if(/^ru/i.test(v[i].lang))return v[i];}}catch(e){}return null;}
function speechText(t){return String(t).replace(/<[^>]*>/g,' ').replace(/×/g,' умножить на ').replace(/÷/g,' разделить на ').replace(/−/g,' минус ').replace(/\+/g,' плюс ').replace(/=/g,' равно ').replace(/(^|\s)\?(?=\s|$|\.)/g,' сколько ').replace(/\s+/g,' ').trim();}
function speak(t){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(speechText(t));u.lang='ru-RU';var v=ttsRu();if(v)u.voice=v;u.rate=.9;speechSynthesis.speak(u);}catch(e){}}
function ttsBtn(getText){if(!ttsOk())return null;var b=h('<button type="button" class="btn ghost alt">'+SPK+'Прочитать вслух</button>');b.onclick=function(){speak(getText());};return b;}

/* примеры из жизни: деньги, колёса, часы */
function clockSvg(n){
  var s='<svg class="clock" viewBox="0 0 140 140" width="180" height="180" role="img" aria-label="Часы. Минутная стрелка на числе '+n+'"><circle cx="70" cy="70" r="64" style="fill:var(--card);stroke:var(--edge);stroke-width:3"/>';
  for(var i=1;i<=12;i++){var a=i*Math.PI/6;s+='<text x="'+(70+Math.sin(a)*50).toFixed(1)+'" y="'+(70-Math.cos(a)*50+5).toFixed(1)+'" text-anchor="middle" style="font:700 14px Rubik,system-ui,sans-serif;fill:var(--ink)">'+i+'</text>';}
  var b=n*Math.PI/6;
  s+='<line x1="70" y1="70" x2="'+(70+Math.sin(b)*40).toFixed(1)+'" y2="'+(70-Math.cos(b)*40).toFixed(1)+'" style="stroke:var(--blue);stroke-width:5;stroke-linecap:round"/><circle cx="70" cy="70" r="5" style="fill:var(--edge)"/></svg>';
  return s;}
function mClock(box){var n=3,out=h('<div style="display:grid;gap:10px;justify-items:start"></div>');
  function draw(){out.innerHTML=clockSvg(n)+'<div class="eq sm">'+n+' × 5 = <b>'+n*5+'</b></div><p class="read" style="min-height:0">Стрелка на числе '+n+'. Прошло '+n*5+' минут.</p>';}
  box.append(row(stepper('Число на часах',1,12,n,function(v){n=v;draw();})),out);draw();}
function coinSvg(){return '<svg class="coin" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="17" style="fill:var(--yellow);stroke:var(--edge);stroke-width:2"/><text x="20" y="25" text-anchor="middle" style="font:700 14px Rubik,system-ui,sans-serif;fill:var(--on-yellow)">10</text></svg>';}
function mCoins(box){var n=3,out=h('<div style="display:grid;gap:10px"></div>');
  function draw(){var c='';for(var i=0;i<n;i++)c+=coinSvg();out.innerHTML='<div class="coins">'+c+'</div><div class="eq sm">'+n+' × 10 = <b>'+n*10+'</b> рублей</div>';}
  box.append(row(stepper('Монет по 10 рублей',1,9,n,function(v){n=v;draw();})),out);draw();}
function mWheels(box){var n=3,w=1,out=h('<div style="display:grid;gap:10px"></div>');
  function draw(){var per=w===0?2:4;out.innerHTML=groups(per,n)+'<div class="eq sm">'+n+' × '+per+' = <b>'+n*per+'</b> колёс</div>';}
  box.append(seg(['Велосипеды, 2 колеса','Машины, 4 колеса'],1,function(i){w=i===0?0:1;draw();}),row(stepper('Сколько штук',1,6,n,function(v){n=v;draw();})),out);draw();}
var EXTRA={
 m4:{title:'Деньги',v:['Монеты по 10 рублей. 3 монеты — это 30 рублей. Умножить на 10 — значит посчитать десятки.','Сколько стоят 4 игрушки по 10 рублей? Считаем десятками: 10, 20, 30, 40. Это 4 × 10 = 40.'],mount:mCoins},
 m5:{title:'Колёса',v:['У велосипеда 2 колеса, у машины 4. Три машины — это 3 × 4 колеса. Считаем: 4, 8, 12.','Колёса бывают парами. Одна пара — это ×2, а две пары — это ×4.'],mount:mWheels},
 m6:{title:'Часы',v:['На часах стрелка перепрыгивает на 5 минут от числа к числу. Число 3 — это 15 минут, число 6 — 30 минут.','Каждое число на часах — это ещё пять минут. Поэтому 5 × 3 = 15, 5 × 6 = 30 и 5 × 12 = 60.'],mount:mClock}};
function extraItem(m){var e=EXTRA[m.id];return {kind:'explain',mod:m,first:false,idx:m.steps.length,variants:e.v,step:{title:e.title,text:e.v[0],mount:e.mount}};}

/* трудные примеры */
var HARD=[[6,7],[6,8],[7,8],[7,9],[8,9]];
var MNEMO={'6×7':'Посчитай так. 5 × 7 = 35. Прибавь ещё одну семёрку. Получится 42.','6×8':'Сначала 6 × 4 = 24. Потом удвой. 24 + 24 = 48.','7×8':'Запомни ряд чисел 5, 6, 7, 8. Первые два числа 5 и 6 дают 56. Последние два числа 7 и 8 — это множители.','7×9':'10 × 7 = 70. Вычти 7. Получится 63. Сумма цифр 6 + 3 = 9.','8×9':'10 × 8 = 80. Вычти 8. Получится 72. Сумма цифр 7 + 2 = 9.'};
function weakKeys(){var o=[],k;for(k in P.stats){var s=P.stats[k],n=s.ok+s.bad;if(s.bad>=2&&s.bad/n>=.4&&!HARD.some(function(h2){return fk(h2)===k;}))o.push([k,s.bad/n]);}
  return o.sort(function(a,b){return b[1]-a[1];}).slice(0,3).map(function(x){return x[0];});}
function weakFact(){var best=null,br=0,k;for(k in P.stats){var s=P.stats[k],n=s.ok+s.bad;if(s.bad>=2&&s.bad/n>br){br=s.bad/n;best=k;}}return best;}
function split5(x,y){if(x<=5)return y+' × '+x+' = '+y*x;return y+' × '+x+' = '+y+' × 5 + '+y+' × '+(x-5)+' = '+y*5+' + '+y*(x-5)+' = '+y*x;}
function hardKeys(){return HARD.map(fk).concat(weakKeys());}
function hardStatus(k){var e=P.sr[k];if(e&&e.box>=4)return 'Знаю надёжно';var s=P.stats[k];return s&&s.bad?'Нужно потренировать':'Ещё не пробовал';}
function rHard(){
  if(gate('hard','Трудные примеры'))return;
  var k=view.k;
  if(!k){
    var wk=weakKeys();
    app.innerHTML='<section class="card lift"><p class="kicker">Чаще всего путают</p><h1>Трудные примеры</h1><p class="lead" style="margin-top:12px">Для каждого есть картинка, подсказка и своя заметка. Сначала попробуй вспомнить ответ сам.</p></section><h2>Пять трудных</h2><div class="mods">'+HARD.map(function(f){var kk=fk(f);return '<button type="button" class="mod" data-hard="'+kk+'"><span class="mod-tag">'+f[0]+' × '+f[1]+'</span><span class="mod-s">'+hardStatus(kk)+'</span></button>';}).join('')+'</div>'
      +(wk.length?'<h2>Твои сложные примеры</h2><div class="mods">'+wk.map(function(kk){var p=kk.split('×');return '<button type="button" class="mod" data-hard="'+kk+'"><span class="mod-tag">'+p[0]+' × '+p[1]+'</span><span class="mod-s">'+hardStatus(kk)+'</span></button>';}).join('')+'</div>':'');
    return;}
  var p=k.split('×'),a=+p[0],b=+p[1],x=Math.max(a,b),y=Math.min(a,b),ans=a*b;
  if(!(a>=2&&b>=2&&a<=10&&b<=10)){go({name:'hard'});return;}
  var tip=MNEMO[k]||strat(a,b);
  var card=h('<section class="card lift"><div class="phase">Трудный пример</div><div class="eq">'+y+' × '+x+'</div><div class="row"><button type="button" class="btn ghost" id="sh">Показать ответ</button></div><div id="sol" hidden><div class="eq">'+y+' × '+x+' = <b>'+ans+'</b></div><div class="demo">'+rect(y,x,{rowSplit:5})+'<div class="eq sm">'+split5(x,y)+'</div></div><p class="expl">'+tip+'</p></div><div class="say"><b>Твоя подсказка</b><label class="small" for="nt">Придумай свою подсказку. Она сохранится только на этом устройстве.</label><textarea class="ta" id="nt" rows="2" maxlength="100"></textarea><button type="button" class="btn ghost" id="ns" style="min-height:40px;font-size:15px">Сохранить подсказку</button><p class="small" id="nm" aria-live="polite" style="margin:0"></p></div><div class="row" style="margin-top:14px"><button type="button" class="btn" id="tr">Потренируем</button><button type="button" class="btn ghost" data-hard="">К списку</button></div></section>');
  app.appendChild(card);
  var nt=card.querySelector('#nt'),nm=card.querySelector('#nm');nt.value=P.notes[k]||'';
  card.querySelector('#sh').onclick=function(){var s=card.querySelector('#sol');s.hidden=!s.hidden;this.textContent=s.hidden?'Показать ответ':'Скрыть ответ';};
  card.querySelector('#ns').onclick=function(){var t=nt.value.trim().slice(0,100);if(t)P.notes[k]=t;else delete P.notes[k];save();nm.textContent=t?'Подсказка сохранена.':'Подсказка удалена.';};
  card.querySelector('#tr').onclick=function(){
    var qs=[Mul(a,b),Div(a*b,a),Mul(b,a),Miss(a,b),Div(a*b,b)];
    R={mode:'train',mod:null,items:qs.map(function(q){return {kind:'ask',q:q,scored:true,phase:'Трудный пример'};}),i:0,retries:0};NAMES.run='home';go({name:'run'});};}

/* «Объясни Мише»: выбери верное объяснение */
function pickxItem(gk){
  var g=gk||pick([1,2,3,4,5,6,7]),a,b,n,lead,good,bads,why;
  if(g===1){a=ri(3,8);b=ri(3,8);if(a===b)b=a+1;lead='Миша знает, что '+a+' × '+b+' = '+a*b+'. Почему тогда и '+b+' × '+a+' = '+a*b+'?';good='Если повернуть прямоугольник, клеток останется столько же.';bads=['Потому что эти числа похожи.','Потому что '+Math.max(a,b)+' больше '+Math.min(a,b)+'.'];why='Прямоугольник из клеток можно повернуть. Число клеток не меняется.';}
  else if(g===2){n=ri(3,9);lead='Почему '+n+' × 10 = '+n*10+'?';good='Десять групп по '+n+' — это '+n+' десятков, то есть '+n*10+'.';bads=['Потому что 10 — круглое число.','Нужно сложить '+n+' и 10.'];why='Десять групп по '+n+' дают '+n+' десятков.';}
  else if(g===3){n=ri(3,9);lead='Как быстро найти 9 × '+n+'?';good='10 × '+n+' = '+10*n+', потом вычесть '+n+'. Получится '+9*n+'.';bads=['Сложить 9 и '+n+'.','Дописать ноль к девятке.'];why='Девять — это десять без одного. Поэтому из 10 × '+n+' вычитаем '+n+'.';}
  else if(g===4){n=ri(2,9);lead='Как найти 5 × '+n+'?';good='Взять половину от 10 × '+n+'. Половина от '+10*n+' — это '+5*n+'.';bads=['Сложить 5 и '+n+' и дописать ноль.','Умножить '+n+' на 2.'];why='Пять — это половина от десяти.';}
  else if(g===5){n=ri(3,9);lead='Как найти 4 × '+n+'?';good='Удвоить '+n+', будет '+2*n+'. Потом удвоить ещё раз, будет '+4*n+'.';bads=['Прибавить 4 к '+n+'.','Удвоить '+n+' только один раз.'];why='Четыре — это дважды два. Поэтому удваиваем два раза.';}
  else if(g===6){a=ri(3,9);b=ri(3,9);lead='Как узнать '+a*b+' ÷ '+a+'?';good='Спросить себя: '+a+' × ? = '+a*b+'. Ответ '+b+'.';bads=['Вычесть '+a+' из '+a*b+'.','Сложить цифры числа '+a*b+'.'];why='Деление — это умножение наоборот.';}
  else{a=pick([6,7,8]);n=ri(3,9);lead='Как найти '+a+' × '+n+', если не помнишь?';good='5 × '+n+' = '+5*n+' и '+(a-5)+' × '+n+' = '+(a-5)*n+'. Сложить: '+a*n+'.';bads=['Сложить '+a+' и '+n+'.','Умножить '+a+' на 10 и ничего не вычитать.'];why='Число '+a+' можно разбить на 5 и '+(a-5)+'. Эти части умножать легче.';}
  var opts=shuffle([{t:good,ok:true},{t:bads[0]},{t:bads[1]}]);
  return {kind:'pickx',lead:lead,opts:opts,why:why};}
function rPickx(it){
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">Объясни Мише</div><p class="ask-lead">'+it.lead+'</p><p class="small">Выбери объяснение, которое поймёт Миша.</p><div class="opts" id="ch"></div><div id="fb" aria-live="polite"></div><div class="row act" style="margin-top:14px"></div>';
  var ch=card.querySelector('#ch'),fb=card.querySelector('#fb'),rw=card.querySelector('.row'),miss=0,done=false;
  it.opts.forEach(function(o){var b=h('<button type="button" class="opt">'+esc(o.t)+'</button>');
    b.onclick=function(){if(done)return;
      if(o.ok){done=true;ch.querySelectorAll('button').forEach(function(x){x.disabled=true;});b.classList.add('good');fb.innerHTML='<div class="fb ok"><strong>Верно!</strong><span>'+esc(it.why)+'</span></div>';var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);nx.focus();}
      else{miss++;b.classList.add('bad');b.disabled=true;fb.innerHTML='<div class="fb try"><strong>Миша так не поймёт.</strong><span>Попробуй другое объяснение.</span></div>';
        if(miss>=2){var g=[].slice.call(ch.querySelectorAll('button')).filter(function(x,i){return it.opts[i].ok;})[0];if(g)g.classList.add('good');}}};
    ch.appendChild(b);});
  app.appendChild(card);}

/* сравнение при ошибке, когда ответ похож на соседний пример */
function compareHtml(q,v){
  var m=q.meta;if(!m||m.t!=='mul'||!isFinite(v))return '';
  var a=m.a,b=m.b,c=[[a,b+1],[a,b-1],[a+1,b],[a-1,b]],X,Y;
  for(var i=0;i<c.length;i++){if(c[i][0]>=1&&c[i][1]>=1&&c[i][0]<=10&&c[i][1]<=10&&c[i][0]*c[i][1]===v){X=c[i][0];Y=c[i][1];break;}}
  if(X===undefined||v===a*b)return '';
  var diff=Math.abs(v-a*b),k=(X===a)?a:b;
  return '<div class="cmp"><p>Ты ответил(а) '+v+'. Это ответ другого примера. Сравни.</p><div class="pair">'+rect(a,b)+rect(X,Y)+'</div><p class="mono">'+a+' × '+b+' = '+a*b+'<br>'+X+' × '+Y+' = '+v+'</p><p>Разница между ними '+diff+'. Это одна лишняя группа по '+k+'.</p></div>';}

/* совет родителю и строка за неделю */
var TIPS=['Спросите за ужином: «Сколько будет 6 × 7?» Если не помнит, напомните про 5 × 7 и ещё одно число.','Поиграйте в счёт шагами. Считайте вместе по 3 до 30 и обратно.','Попросите показать, как посчитать 9 × 4 на пальцах, и объяснить вам фокус.','Положите на стол 12 монет и спросите, как их можно разложить поровну.','Спросите: «Что больше, 6 × 7 или 7 × 6?» Пусть ребёнок покажет на клеточках.','Посмотрите вместе на часы. Сколько минут между числами 3 и 6?','Пусть ребёнок придумает вам задачу про яблоки и корзины, а вы её решите.','Найдите дома предметы парами или по пять штук и посчитайте их шагами.','Спросите про любимый пример и почему он лёгкий.','Нарисуйте вместе прямоугольник на клетчатой бумаге и посчитайте клетки двумя способами.'];
function parentTip(){
  var wk=weakFact();if(wk){var p=wk.split('×');return 'Сегодня спросите про '+p[0]+' × '+p[1]+'. Пусть ребёнок объяснит, как он это считает.';}
  var d=new Date(),day=Math.floor((d-new Date(d.getFullYear(),0,0))/86400000);return TIPS[day%TIPS.length];}
function tipHtml(){return '<p class="small tip"><b>Для родителя.</b> '+esc(parentTip())+'</p>';}
function weekLine(){
  var n=0,i,k,k4=0,from=addDays(-6);
  for(i=0;i<7;i++){var d=new Date();d.setDate(d.getDate()-i);if((P.days[dayKey(d)]||0)>=60)n++;}
  for(k in P.sr)if(P.sr[k].k4&&P.sr[k].k4>=from)k4++;
  var wk=weakFact(),w=wk?wk.split('×'):null;
  if(!n)return 'За неделю занятий не было. Хватит даже 5 минут сегодня.';
  return 'За неделю: занятий '+n+', новых надёжных примеров '+k4+(w?', самый трудный пример сейчас '+w[0]+' × '+w[1]:'')+'.';}

/* главная и родительский раздел */
function freeLeft(){return Math.max(0,FREE_MIN-Math.floor((P.days[dayKey()]||0)/60));}
function homeAdv(){
  var hero0=app.querySelector('section.card.lift');if(!hero0)return;var html='';
  if(tier()==='free'){
    html='<section class="note"><h3>Бесплатный доступ</h3><p>Открыты пять блоков: смысл умножения, ×1, ×2, ×5 и ×10. Занятия до '+FREE_MIN+' минут в день, сегодня осталось '+freeLeft()+' мин.</p><div class="row"><button type="button" class="btn" data-v="buy">Открыть все блоки</button></div></section>';}
  else if(!P.adv){html='<section class="note"><h3>Продвинутый режим</h3><p>Включите переключатель вверху страницы. Появятся '+(tier()==='pro'?'повторения через дни, трудные примеры, игры, награды, озвучка и итоговая проверка.':'чередование примеров, текстовые задачи, трудные примеры и итоговая проверка.')+'</p><div class="row"><button type="button" class="btn ghost" data-act="adv">Включить</button></div></section>';}
  else{
    var d=dailyNow(),due=dueList().length,last=P.final.length?P.final[P.final.length-1]:null;
    function row2(ok,txt,v){return '<button type="button" class="grow'+(ok?' done':'')+'" data-v="'+v+'"><i class="tick" aria-hidden="true">'+(ok?'✓':'')+'</i><span>'+txt+'</span></button>';}
    var goals=row2(d.ex>=5,'Примеры: '+Math.min(d.ex,5)+' из 5','train')+(can('sr')?row2(d.rev>=1,'Повтор в тренажёре'+(due?' (ждут: '+due+')':''),'train'):'')+(can('games')?row2(d.game>=1,'Одна игра','games'):'');
    var L=stickerList(),n=L.filter(function(x){return x.ok;}).length,wk=weakKeys()[0],hint2='';
    if(wk&&can('hard')){var p=wk.split('×');hint2='<p class="small" style="margin:10px 0 0">Давай потренируем '+p[0]+' × '+p[1]+'. <button type="button" class="linkb" data-hard="'+wk+'">Открыть</button></p>';}
    function tile(v,t,s2,ok){return '<button type="button" class="mod" data-v="'+v+'"><span class="mod-tag">'+t+'</span><span class="mod-s">'+(ok?s2:lockSvg()+'Тариф «Продвинутый»')+'</span></button>';}
    html='<section class="card goals"><h3>Цели на сегодня</h3><div class="goal-list">'+goals+'</div></section>'
     +'<section class="note"><h3>Итоговая проверка</h3><p>'+FINAL_N+' примеров без подсказок и таймера. Цель: '+FINAL_PASS+'% и выше.'+(last?' Последний результат: '+last.ok+' из '+last.n+'.':'')+'</p><div class="row"><button type="button" class="btn ghost" data-act="final">Пройти итоговую проверку</button></div></section>'
     +'<section class="note"><h3>Ещё можно</h3><div class="mods">'+tile('hard','Трудные примеры','Пять самых сложных',true)+tile('games','Игры','Четыре короткие игры',can('games'))+tile('stickers','Награды','Наклеек: '+n+' из '+L.length,can('stickers'))+'</div>'+hint2+'</section>';}
  hero0.insertAdjacentHTML('afterend',html);}
function weekCount(){var n=0,i;for(i=0;i<7;i++){var d=new Date();d.setDate(d.getDate()-i);if((P.days[dayKey(d)]||0)>=60)n++;}return n;}
function advParent(){
  if(tier()==='free')return '<h2>Продвинутый режим</h2><section class="card"><p>Входит в тарифы «Стандарт» и «Продвинутый»: чередование примеров, текстовые задачи, итоговая проверка и другое.</p><div class="row" style="margin-top:12px"><button type="button" class="btn" data-v="buy">Посмотреть тарифы</button></div></section>';
  if(!P.adv)return '<h2>Продвинутый режим</h2><section class="card"><p>Выключен. Включите, чтобы открыть возможности вашего тарифа.</p><div class="row" style="margin-top:12px"><button type="button" class="btn" data-act="adv">Включить</button></div></section>';
  var due=dueList().length,known=0,tot=0,k;for(k in P.sr){tot++;if(P.sr[k].box>=4)known++;}
  var d=dailyNow();
  function row2(ok,txt){return '<div class="grow'+(ok?' done':'')+'" style="cursor:default"><i class="tick" aria-hidden="true">'+(ok?'✓':'')+'</i><span>'+txt+'</span></div>';}
  var hist=P.final.length?'<div class="bars">'+P.final.slice(-5).reverse().map(function(r){var p=Math.round(r.ok/r.n*100);return '<div><span>'+new Date(r.d).toLocaleDateString('ru-RU')+'</span><span>'+r.ok+' из '+r.n+' ('+p+'%)'+(p>=FINAL_PASS?' · цель достигнута':'')+'</span></div>';}).join('')+'</div>':'<p class="small">Итоговая проверка ещё не проходилась.</p>';
  var report=can('week')?'<p style="font-weight:800">'+esc(weekLine())+'</p>'+tipHtml():'<p style="font-weight:800">За неделю занятий: '+weekCount()+'.</p><p class="small">Расширенный отчёт и совет дня входят в тариф «Продвинутый».</p>';
  var goals=row2(d.ex>=5,'Примеры: '+Math.min(d.ex,5)+' из 5')+(can('sr')?row2(d.rev>=1,'Повтор в тренажёре'+(due?' (ждут: '+due+')':'')):'')+(can('games')?row2(d.game>=1,'Одна игра'):'');
  var rep2=can('sr')?'<section class="card"><h3>Повторения</h3><p>К повтору сегодня: <b>'+due+'</b>.</p><p class="small">Пример считается надёжно выученным после четырёх верных ответов с растущими паузами (1, 3, 7, 14 дней). Таких примеров: '+known+' из 54, всего в расписании: '+tot+'.</p></section>':'<section class="card"><h3>Повторения</h3><p class="small">Повторения через 1, 3, 7 дней входят в тариф «Продвинутый».</p></section>';
  var prn=!can('print')?'<p class="small">Печатные карточки входят в тариф «Продвинутый».</p>':(PREVIEW?'<p class="small">Печатные карточки и квадрат Пифагора доступны в проекте на вашем хостинге (файл print.html).</p>':'<p><a href="print.html">Печатные карточки и квадрат Пифагора</a></p>');
  var say=can('say')?'<section class="card" style="margin-top:14px"><h3>Вопросы для разговора</h3><ul class="tips">'+MODS.map(function(m){var s=SAY[m.id];return '<li><b>'+m.title+'.</b> '+s.parent+(P.told[m.id]?' <span class="stars">Рассказано: '+P.told[m.id]+'</span>':'')+'</li>';}).join('')+'</ul></section>':'';
  return '<h2>Продвинутый режим</h2><section class="card">'+report+'</section>'
   +'<div class="grid2" style="margin-top:14px"><section class="card"><h3>Цели на сегодня</h3><div class="goal-list">'+goals+'</div></section>'+rep2+'</div>'
   +'<div class="grid2" style="margin-top:14px"><section class="card"><h3>Итоговая проверка</h3><p class="small">'+FINAL_N+' примеров без подсказок и таймера. Цель: '+FINAL_PASS+'% и выше.</p>'+hist+'<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="final">Пройти</button></div></section>'
   +'<section class="card"><h3>Материалы</h3>'+prn+(can('tts')?'<p class="small">Озвучка работает через голос вашего устройства. Если голоса нет, включите русский голос в настройках телефона.</p>':'')+'</section></div>'
   +say+'<section class="card" style="margin-top:14px"><button type="button" class="btn ghost" data-act="adv">Выключить продвинутый режим</button></section>';}

/* ---------- события ---------- */
function act(n){
  if(n==='adv'){setAdv(!P.adv);return;}
  if(n==='final'){if(!gate('final','Итоговая проверка'))startFinal();return;}
  if(n==='onb-ok'){P.onboarded=true;save();render();}
  if(n==='rem-later'){P.lastReminder=P.sessions;save();render();}}
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-act]');if(a){act(a.dataset.act);return;}
  var s=e.target.closest('[data-start]');if(s){NAMES.run='home';startModule(s.dataset.start);return;}
  var hd=e.target.closest('[data-hard]');if(hd){go({name:'hard',k:hd.dataset.hard||null});return;}
  var gg=e.target.closest('[data-g]');if(gg){go({name:'games',g:gg.dataset.g||null});return;}
  var v=e.target.closest('[data-v]');if(v){NAMES.run='home';if(v.dataset.v==='train')R=null;if(location.hash&&PREVIEW)history.replaceState(null,'',location.pathname+location.search);go({name:v.dataset.v});}});
/* экранная клавиатура на телефонах: не даём ей закрыть поле ответа и кнопку */
function revealField(){var a=document.activeElement;if(!a||(a.tagName!=='INPUT'&&a.tagName!=='TEXTAREA'))return;
  var box=a.closest('.answer')||a,r=box.getBoundingClientRect(),vv=window.visualViewport,h=vv?vv.height:window.innerHeight,top=vv?vv.offsetTop:0;
  if(r.bottom+16>top+h)window.scrollBy(0,r.bottom+16-(top+h));}
document.addEventListener('focusin',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')setTimeout(revealField,350);});
if(window.visualViewport)window.visualViewport.addEventListener('resize',function(){setTimeout(revealField,60);});
window.addEventListener('hashchange',route);
setInterval(function(){if(!document.hidden&&(view.name==='run'||view.name==='train'||view.name==='table')){var k=dayKey();if(P.days[k]===undefined)P.sessions=(P.sessions||0)+1;P.days[k]=(P.days[k]||0)+5;save();}},5000);
if(!PREVIEW&&'serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});}
boot();
})();
