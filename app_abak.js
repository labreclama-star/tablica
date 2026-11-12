/* «Ментальная арифметика»: тренажёр с виртуальным абакусом (соробан). Без сервера: прогресс хранится в браузере (IndexedDB).
   Тарифы и коды доступа общие с тренажёрами «Умножение», «Устный счёт» и «Быстрый счёт». */
(function(){'use strict';
function $(s,r){return (r||document).querySelector(s);}
function h(html){var t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[ri(0,a.length-1)];}
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function starsStr(n){return '★'.repeat(n)+'☆'.repeat(3-n);}

/* ---------- настройки (значения подставляет build.py из app.js) ---------- */
var FREE_MIN=10;
/*SHARED*/
/* Цены и ссылки на оплату: тренажёр «Умножение» (MULT), «Устный счёт» (MNT) и комбо (CMB). Меняйте только здесь: build.py копирует блок в app_mental.js и на лендинг. */
var PRICE_MULT_STD='990 ₽';
var PRICE_MULT_PRO='1 990 ₽';
var PRICE_MENTAL='990 ₽';
var PRICE_TRACH='990 ₽';
var PRICE_ABAK='990 ₽';
var PRICE_COMBO='2 490 ₽';
var PAY_URL_MULT_STD='https://example.com/pay?plan=mult-standard';  /* страницы оплаты у платёжного агрегатора */
var PAY_URL_MULT_PRO='https://example.com/pay?plan=mult-pro';
var PAY_URL_MENTAL='https://example.com/pay?plan=mental';
var PAY_URL_TRACH='https://example.com/pay?plan=trahtenberg';
var PAY_URL_ABAK='https://example.com/pay?plan=abakus';
var PAY_URL_COMBO='https://example.com/pay?plan=combo';

var PAY_URL_MULT_STD='success.html';
var PAY_URL_MULT_PRO='success.html';
var PAY_URL_MENTAL='success.html';
var PAY_URL_TRX='success.html';
var PAY_URL_ABK='success.html';
var PAY_URL_COMBO='success.html';

/* SHA-256 кодов доступа (см. README). Тестовые коды (удалите перед запуском): TEST-STANDARD, TEST-PRO и 1111 (только «Умножение»), TEST-MNT («Устный счёт»), TEST-CMB (комбо). */
var CODES_STD=["ca063870f27456c4764dc609ae1579f7a1fa8e6f497713a47ad4b90c98db7bb6"];
var CODES_PRO=["0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c","9617e38101e15005c55a48cf1116327a0bb611c344da66dce2799e30b954a446"];
var CODES_MNT=["364567710a202e131e3aabb9531abb0d23648784ea6db328eedea3b01f9bb16a"];
var CODES_CMB=["c7bdbefc81151c12307080feadd770a9eb413db17783a48fa8847269de7c49ca"];
var CODES_ABK=["44b3fe4bf67206b477b7390eff3029a2bcf227ebca143088d3f9a9eb842458ea"];  /* тестовый TEST-ABK, удалите перед запуском */
var CODES_TRX=["e94d02710d01a8dc7929f06fd3a65c90e0c3083463028ca5141b941b1dbaa749"];  /* тестовый TEST-TRX, удалите перед запуском */
/* что открывает код: {mult, mental, trach, abak}; null, если код не найден.
   STANDARD-/PRO-: только «Умножение» (Стандарт или Продвинутый). MNT-: «Устный счёт» целиком (Продвинутый). TRX-: «Быстрый счёт по Трахтенбергу» целиком. ABK-: «Ментальная арифметика» целиком. CMB-: все четыре тренажёра на максимум. */
function codeGrant(hx){
  function has(a){return a.indexOf(hx)>=0;}
  if(has(CODES_CMB))return {mult:'pro',mental:'pro',trach:'pro',abak:'pro'};
  if(has(CODES_PRO))return {mult:'pro',mental:null,trach:null,abak:null};
  if(has(CODES_STD))return {mult:'standard',mental:null,trach:null,abak:null};
  if(has(CODES_MNT))return {mult:null,mental:'pro',trach:null,abak:null};
  if(has(CODES_TRX))return {mult:null,mental:null,trach:'pro',abak:null};
  if(has(CODES_ABK))return {mult:null,mental:null,trach:null,abak:'pro'};
  return null;}
function anyCodes(){return CODES_STD.length+CODES_PRO.length+CODES_MNT.length+CODES_CMB.length+CODES_TRX.length+CODES_ABK.length>0;}
/* шесть плашек: Бесплатный, Умножение, Устный счёт, Быстрый счёт, Ментальная арифметика, Комбо. cur: 'mult' | 'mental' | 'landing' (куда ведёт кнопка «Попробовать бесплатно») */
function tariffCols(cur){
  function buy(cls,label,price,url){return '<a class="btn '+cls+'" href="'+url+'">'+label+' · '+price.replace(/ /g,'\u00a0')+'</a>';}
  function col(cls,title,price,sub,items,act,badge){return '<div class="tcol'+cls+'">'+(badge?'<span class="tbadge">'+badge+'</span>':'')+'<h3>'+title+'</h3><p class="tprice">'+price+'</p><p class="tsub">'+sub+'</p><ul>'+items.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul><div class="tact">'+act+'</div></div>';}
  function num(t){return parseInt(String(t).replace(/\D/g,''),10)||0;}
  var save=num(PRICE_MULT_PRO)+num(PRICE_MENTAL)+num(PRICE_TRACH)+num(PRICE_ABAK)-num(PRICE_COMBO);
  var free=cur==='landing'?'<a class="btn ghost" href="trainer.html">Попробовать бесплатно</a>':'<button type="button" class="btn ghost" data-v="home">Попробовать бесплатно</button>';
  return '<div class="tcols">'
   +col(' free','Бесплатный','0 ₽','Чтобы попробовать',['5 блоков в «Умножении»','Модуль «Состав числа» в «Устном счёте»','Модуль «Сосед и нулик» в «Быстром счёте»','Модуль «Знакомство с абакусом» в «Ментальной арифметике»','До 10 минут в день','Без регистрации'],free)
   +col('','Таблица умножения','от '+PRICE_MULT_STD,'Полный курс умножения и деления',['Все блоки и деление','Безлимитное время','Итоговая проверка','В Продвинутом: игры, повторения через 1, 3, 7 дней, награды, печать'],buy('ghost','Купить Стандарт',PRICE_MULT_STD,PAY_URL_MULT_STD)+buy('','Купить Продвинутый',PRICE_MULT_PRO,PAY_URL_MULT_PRO))
   +col('','Устный счёт',PRICE_MENTAL,'Сложение и вычитание в уме',['Все 9 модулей','Игра «Дай сдачу»','Тренажёр с повторениями','Подробный отчёт для родителя','Без лимита времени'],buy('',  'Купить Устный счёт',PRICE_MENTAL,PAY_URL_MENTAL))
   +col('','Быстрый счёт по Трахтенбергу',PRICE_TRACH,'Система быстрого счёта Якова Трахтенберга',['13 модулей: умножение на 2–9, 11 и 12 без таблицы','Квадрат числа на 5 и метод двух пальцев','Проверка девяткой','Тренажёр с повторениями','Без лимита времени'],buy('','Купить Быстрый счёт',PRICE_TRACH,PAY_URL_TRACH))
   +col('','Ментальная арифметика',PRICE_ABAK,'Виртуальный абакус и счёт в уме',['13 модулей: от цифр на абакусе до счёта в уме','Помощь брата и друга, двузначные числа','Образ абакуса и цепочки в уме','Тренажёр с повторениями','Без лимита времени'],buy('','Купить Ментальную арифметику',PRICE_ABAK,PAY_URL_ABAK))
   +col(' combo','Комбо: всё сразу',PRICE_COMBO,'Все четыре тренажёра по одному коду. Максимальная выгода',['Всё из «Таблицы умножения» (Продвинутый)','Всё из «Устного счёта»','Всё из «Быстрого счёта по Трахтенбергу»','Всё из «Ментальной арифметики»','Один код открывает все тренажёры','Доступ навсегда'].concat(save>0?['Дешевле на '+save+' ₽, чем по отдельности']:[]),buy('big','Купить Комбо',PRICE_COMBO,PAY_URL_COMBO),'Выгодно')
   +'</div>';}
/* Маскот «Клетик»: плоский inline SVG (около 1,5 КБ на экземпляр). Эмоции: joy, think, sorry, party. */
function clk(e,cls){
  var D='#1A2747',lk={think:[-4,1],sorry:[0,2]}[e]||[0,0],x=lk[0],y=lk[1];
  var STAR='M0-7 2-2.4 7-2.2 3.1 1 4.3 6 0 3.2-4.3 6-3.1 1-7-2.2-2-2.4Z';
  function eye(cx,cy){return '<circle cx="'+cx+'" cy="'+cy+'" r="12" fill="#fff" stroke="'+D+'" stroke-width="2.5"/>'+
    (e==='party'?'<path transform="translate('+cx+' '+cy+') scale(1.15)" d="'+STAR+'" fill="#FFC83D" stroke="'+D+'" stroke-width="1.2" stroke-linejoin="round"/>'
    :'<circle cx="'+(cx+x)+'" cy="'+(cy+y)+'" r="6.2" fill="'+D+'"/><circle cx="'+(cx+x-2)+'" cy="'+(cy+y-2.2)+'" r="1.9" fill="#fff"/>');}
  var line='fill="none" stroke="'+D+'" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
  var brow={joy:'<path d="M34 31Q42 26 50 30M70 30Q78 26 86 31" '+line+'/>',
    think:'<path d="M34 33H50M70 29Q78 24 86 29" '+line+'/>',
    sorry:'<path d="M34 37L50 28M70 28L86 37" '+line+'/>',party:'<path d="M34 30Q42 25 50 29M70 29Q78 25 86 30" '+line+'/>'}[e]||'';
  var smile='<path d="M45 64Q60 84 75 64Z" fill="'+D+'" stroke="'+D+'" stroke-width="3" stroke-linejoin="round"/><path d="M52 72Q60 79 68 72Q60 69 52 72Z" fill="#FF6F91"/>';
  var mouth={joy:smile,party:smile,think:'<path d="M50 71H70" '+line+'/>',sorry:'<path d="M50 73Q60 64 70 73" '+line+'/>'}[e]||smile;
  var conf=e==='party'?'<path transform="translate(10 22)" d="'+STAR+'" fill="#FFC83D"/><path transform="translate(112 18) scale(.8)" d="'+STAR+'" fill="#FF6F91"/><circle cx="8" cy="76" r="3.5" fill="#3DBE7A"/><circle cx="113" cy="70" r="3.5" fill="#FFC83D"/><path d="M108 40l5 5M10 48l5-4" fill="none" stroke="#3DBE7A" stroke-width="2.6" stroke-linecap="round"/>':'';
  return '<svg class="clk'+(cls?' '+cls:'')+'" viewBox="0 0 120 132" aria-hidden="true" focusable="false">'+
    '<rect class="cb" x="36" y="100" width="16" height="20" rx="6"/><rect class="cb" x="68" y="100" width="16" height="20" rx="6"/>'+
    '<rect class="cb" x="12" y="8" width="96" height="96" rx="20"/>'+
    '<path class="cg" d="M36 14V98M60 14V98M84 14V98M18 32H102M18 56H102M18 80H102"/>'+
    eye(42,50)+eye(78,50)+'<ellipse cx="28" cy="66" rx="6" ry="4" fill="#FF8FA3" opacity=".65"/><ellipse cx="92" cy="66" rx="6" ry="4" fill="#FF8FA3" opacity=".65"/>'+
    brow+mouth+
    '<g transform="rotate(-8 90 100)"><rect x="70" y="84" width="40" height="34" rx="5" fill="#fff" stroke="'+D+'" stroke-width="3"/><path d="M76 94H104M76 102H98M76 110H92" fill="none" stroke="#86A3FF" stroke-width="3" stroke-linecap="round"/></g>'+
    '<circle class="cb" cx="72" cy="98" r="6.5"/>'+conf+'</svg>';}
/*ENDSHARED*/
var RANK={free:0,standard:1,pro:2},TIER_NAME={free:'Бесплатный',standard:'Стандарт',pro:'Продвинутый'};

/* ---------- хранение ---------- */
function fresh(){return {app:'abakus',schemaVersion:1,done:{},stars:{},stats:{},sr:{},rec:{},days:{},alts:{},tier:'free',onboarded:false};}
var M=fresh(),mainTier='free',mainMult='free',mainMental='free',mainTrach='free',storage={mode:'init'};
var Store=(function(){
  var DB='tablica',ST='kv',dbp=null;
  function open(){return new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error('IndexedDB недоступен'));return;}
    var r;try{r=indexedDB.open(DB,1);}catch(e){rej(e);return;}
    r.onupgradeneeded=function(){r.result.createObjectStore(ST);};
    r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};r.onblocked=function(){rej(new Error('blocked'));};});}
  function db(){return dbp||(dbp=open());}
  return {
    get:function(k){return db().then(function(d){return new Promise(function(res,rej){var q=d.transaction(ST,'readonly').objectStore(ST).get(k);q.onsuccess=function(){res(q.result);};q.onerror=function(){rej(q.error);};});});},
    put:function(k,v){return db().then(function(d){return new Promise(function(res,rej){var tx=d.transaction(ST,'readwrite');tx.objectStore(ST).put(v,k);tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};tx.onabort=function(){rej(tx.error||new Error('abort'));};});});}
  };})();
function adopt(o){var f=fresh();for(var k in f){if(o&&o[k]!==undefined&&o[k]!==null)f[k]=o[k];}
  ['done','stars','stats','sr','rec','days','alts'].forEach(function(k){if(!f[k]||typeof f[k]!=='object'||Array.isArray(f[k]))f[k]={};});
  if(RANK[f.tier]===undefined)f.tier='free';f.app='abakus';f.schemaVersion=1;return f;}
var saveT=null;
function flush(){saveT=null;if(storage.mode!=='idb')return;Store.put('abak',JSON.parse(JSON.stringify(M))).catch(function(){storage.mode='memory';});}
function save(){if(saveT)return;saveT=setTimeout(flush,250);}
document.addEventListener('visibilitychange',function(){if(document.hidden){if(saveT)clearTimeout(saveT);flush();}});
window.addEventListener('pagehide',function(){if(saveT)clearTimeout(saveT);flush();});
function tier(){var a=RANK[M.tier]||0,b=RANK[mainTier]||0;return a>=b?(M.tier||'free'):mainTier;}
function atLeast(t){return RANK[tier()]>=RANK[t];}
function addTime(sec){var k=dayKey();M.days[k]=(M.days[k]||0)+sec;save();}
function usedMin(){return Math.floor((M.days[dayKey()]||0)/60);}


/* ---------- виртуальный абакус ---------- */
var RODN=['единиц','десятков','сотен','тысяч','десятков тысяч'],RODS=['ед.','дес.','сот.','тыс.','д. тыс.'];
function rodName(i,len){return RODN[len-1-i]||'';}
var AC={hv:'#E8590C',hv2:'#F6C2A0',ev:'#2B59E6',ev2:'#B6C6F7',wood:'#C98A4B',wd:'#6B4423'};
function bead(cx,cy,col,at){
  return '<polygon points="'+(cx-23)+','+cy+' '+(cx-11)+','+(cy-11)+' '+(cx+11)+','+(cy-11)+' '+(cx+23)+','+cy+' '+(cx+11)+','+(cy+11)+' '+(cx-11)+','+(cy+11)+'" fill="'+col+'" stroke="#1A2747" stroke-width="2"'+at+'/>';}
/* v: массив цифр слева направо, o: {edit, num, labels, hl, w} */
var MINR=7;
function abacus(v,o){
  o=o||{};var P=o.pad===false?0:Math.max(0,MINR-v.length),n=v.length+P,RW=58,W=n*RW+16,H=204,i,j,s='';
  var bw=' style="max-width:'+(o.w||Math.round(W*1.15))+'px"';
  s+='<svg class="abk" viewBox="0 0 '+W+' '+(H+(o.num===false?8:44))+'"'+bw+' role="img" aria-label="Абакус: '+aval(v)+'" focusable="false">';
  s+='<rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="14" fill="'+AC.wood+'" stroke="'+AC.wd+'" stroke-width="4"/>';
  for(i=0;i<n;i++){
    var cx=8+RW*i+RW/2;
    if(i>=P&&o.hl===i-P)s+='<rect x="'+(cx-27)+'" y="8" width="54" height="'+(H-16)+'" rx="10" fill="#FFE066" opacity=".55"/>';
    s+='<line x1="'+cx+'" y1="10" x2="'+cx+'" y2="'+(H-10)+'" stroke="#3b2a14" stroke-width="3"'+(i<P?' opacity=".45"':'')+'/>';}
  s+='<rect x="6" y="72" width="'+(W-12)+'" height="12" fill="'+AC.wd+'"/>';
  for(i=0;i<n;i++){
    var c=8+RW*i+RW/2,pd=i<P,k=pd?0:i-P,xx=pd?0:v[k],hh=xx>=5?1:0,ee=xx%5,dr=(o.edit&&!pd)?(' data-ar="'+k+'" data-ab="h" style="cursor:pointer"'):'',cy,g=pd?' opacity=".45"':'';
    cy=hh?58:28;s+='<g'+dr+g+'>'+((o.edit&&!pd)?'<rect x="'+(c-27)+'" y="'+(cy-15)+'" width="54" height="30" fill="transparent"/>':'')+bead(c,cy,hh?AC.hv:AC.hv2,'')+'</g>';
    for(j=1;j<=4;j++){
      cy=j<=ee?(97+23*(j-1)):(H-16-23*(4-j));
      dr=(o.edit&&!pd)?(' data-ar="'+k+'" data-ab="'+j+'" style="cursor:pointer"'):'';
      s+='<g'+dr+g+'>'+((o.edit&&!pd)?'<rect x="'+(c-27)+'" y="'+(cy-12)+'" width="54" height="24" fill="transparent"/>':'')+bead(c,cy,j<=ee?AC.ev:AC.ev2,'')+'</g>';}
    if(o.num!==false&&!pd)s+='<text x="'+c+'" y="'+(H+26)+'" text-anchor="middle" font-family="Rubik,sans-serif" font-weight="700" font-size="26" fill="#1A2747">'+xx+'</text>';
    if(o.labels&&!pd&&RODS[v.length-1-k]&&o.num!==false)s+='<text x="'+c+'" y="'+(H+40)+'" text-anchor="middle" font-family="Rubik,sans-serif" font-weight="600" font-size="11" fill="#4B5B7C">'+RODS[v.length-1-k]+'</text>';}
  return s+'</svg>';}
/* живой абакус: касание бусины двигает её */
function mountAbacus(host,v,o,cb){
  o=o||{};o.edit=true;
  function paint(){host.innerHTML='<div class="abk-wrap">'+abacus(v,o)+'</div>';}
  host.onclick=function(e){
    var t=e.target.closest&&e.target.closest('[data-ar]');if(!t||host._lock)return;
    var i=+t.getAttribute('data-ar'),b=t.getAttribute('data-ab'),x=v[i],h=x>=5?1:0,ee=x%5;
    if(b==='h')h=h?0:1;else{b=+b;ee=(b<=ee)?b-1:b;}
    v[i]=h*5+ee;paint();if(cb)cb(v);};
  host._set=function(nv){var k;for(k=0;k<v.length;k++)v[k]=nv[k];paint();};
  paint();return host;}
function abStatic(v,o){o=o||{};return '<div class="abk-wrap">'+abacus(v,o)+'</div>';}
function miniRow(list){return '<div class="abk-row">'+list.map(function(x){return '<figure>'+abacus(x.v,{num:false,w:70,pad:false})+'<figcaption>'+x.t+'</figcaption></figure>';}).join('')+'</div>';}

/*AENGINE*/
/* Абакус соробан: у стержня одна верхняя бусина (5) и четыре нижние (по 1). Стержни слева направо: старший разряд первым. */
function aval(v){var n=0,i;for(i=0;i<v.length;i++)n=n*10+v[i];return n;}
function afrom(n,len){var s=String(n),a=[],i;while(s.length<len)s='0'+s;for(i=0;i<s.length;i++)a.push(+s[i]);return a;}
function ah(x){return x>=5?1:0;}function ae(x){return x%5;}
/* один шаг руками: delta в {±1..±4, ±5} на одном стержне */
function aact(v,i,dl,acts){v[i]+=dl;acts.push({rod:i,delta:dl});}
function addIn(v,i,c,acts){ /* v[i]+c<=9, без переноса */
  var x=v[i],e=ae(x),kind='direct';
  if(c<=4){if(e+c<=4)aact(v,i,c,acts);else{aact(v,i,5,acts);aact(v,i,-(5-c),acts);kind='bro';}}
  else{aact(v,i,5,acts);if(c>5)aact(v,i,c-5,acts);}
  return kind;}
function subIn(v,i,c,acts){ /* v[i]>=c, без займа */
  var x=v[i],e=ae(x),kind='direct';
  if(c<=4){if(c<=e)aact(v,i,-c,acts);else{aact(v,i,-5,acts);aact(v,i,5-c,acts);kind='bro';}}
  else{aact(v,i,-5,acts);if(c>5)aact(v,i,-(c-5),acts);}
  return kind;}
function aadd(v,i,d,ops){ /* прибавить цифру d на стержне i, перенос влево */
  var acts=[],kind,x=v[i];
  if(x+d<=9){kind=addIn(v,i,d,acts);ops.push({t:'+',rod:i,d:d,way:kind,acts:acts});return;}
  if(i===0)throw new Error('нет стержня слева');
  var sub=[];aadd(v,i-1,1,sub);
  subIn(v,i,10-d,acts);
  ops.push({t:'+',rod:i,d:d,way:'fri',acts:acts,pre:sub});}
function asub(v,i,d,ops){
  var acts=[],kind,x=v[i];
  if(x>=d){kind=subIn(v,i,d,acts);ops.push({t:'−',rod:i,d:d,way:kind,acts:acts});return;}
  if(i===0)throw new Error('нет стержня слева');
  var pre=[];asub(v,i-1,1,pre);
  addIn(v,i,10-d,acts);
  ops.push({t:'−',rod:i,d:d,way:'fri',acts:acts,pre:pre});}
/* вся операция A ± B: цифры B слева направо */
function aplan(a,b,sign,len){
  var v=afrom(a,len),db=afrom(b,len),ops=[],i,start=v.slice();
  for(i=0;i<len;i++){if(db[i]===0)continue;if(sign==='+')aadd(v,i,db[i],ops);else asub(v,i,db[i],ops);}
  return {start:start,ops:ops,end:v,result:aval(v)};}
/* плоский список физических действий с состоянием после каждого */
function aflat(plan){
  var v=plan.start.slice(),out=[];
  plan.ops.forEach(function(top){
    var n0=out.length;
    function run(op,inPre){
      if(op.pre)op.pre.forEach(function(p){run(p,true);});
      op.acts.forEach(function(a){v[a.rod]+=a.delta;out.push({top:top,op:op,pre:!!inPre,rod:a.rod,delta:a.delta,after:v.slice(),first:false});});}
    run(top,false);
    if(out.length>n0)out[n0].first=true;});
  return out;}
/* какой способ нужен для одной цифры: 'direct' | 'bro' | 'fri' */
function aclass(x,d,sign){var v=[sign==='+'?0:1,x],ops=[];try{if(sign==='+')aadd(v,1,d,ops);else asub(v,1,d,ops);}catch(e){return null;}return ops[ops.length-1].way;}
/*AENDENGINE*/
function digsN(n){return String(n).split('').map(Number);}
function lenFor(){var m=0,i;for(i=0;i<arguments.length;i++)m=Math.max(m,String(arguments[i]).length);return m;}
function wayName(w){return w==='direct'?'Прямо':(w==='bro'?'Помощь брата':'Помощь друга');}

/* ---------- типы примеров ---------- */
var TYPES={set1:{name:'Набрать цифру'},rd1:{name:'Прочитать цифру'},set2:{name:'Набрать число до 99'},rd2:{name:'Прочитать число до 99'},set4:{name:'Набрать число до 9999'},rd4:{name:'Прочитать число до 9999'},
  addS:{name:'Сложение без помощи'},subS:{name:'Вычитание без помощи'},addB:{name:'Сложение, помощь брата'},subB:{name:'Вычитание, помощь брата'},addF:{name:'Сложение, помощь друга'},subF:{name:'Вычитание, помощь друга'},
  add2:{name:'Сложение двузначных'},sub2:{name:'Вычитание двузначных'},flash:{name:'Образ абакуса'},seq:{name:'Цепочка в уме'},mix:{name:'Счёт в уме'}};
var ALL_T=['set2','rd2','set4','rd4','addS','subS','addB','subB','addF','subF','add2','sub2','flash','seq','mix'];
function pl(n,o,f,m){n=Math.abs(n)%100;var d=n%10;if(n>10&&n<20)return m;if(d===1)return o;if(d>=2&&d<=4)return f;return m;}

/* ---------- генераторы примеров ---------- */
function rnd(lo,hi){return ri(lo,hi);}
function numN(k){var lo=k===1?1:Math.pow(10,k-1),hi=Math.pow(10,k)-1;return ri(lo,hi);}
function exSet(k){var N=numN(k);return {type:'set'+k,N:N,k:k,key:'set'+k+'-'+N};}
function exRd(k){var N=numN(k);return {type:'rd'+k,N:N,k:k,key:'rd'+k+'-'+N};}
var CLASS_OF={addS:['+','direct'],addB:['+','bro'],addF:['+','fri'],subS:['-','direct'],subB:['-','bro'],subF:['-','fri']};
function exOp(t){
  var c=CLASS_OF[t],sign=c[0],cls=c[1],x,d,t0=0,a,b;
  do{
    if(cls==='fri'&&sign==='+'){x=ri(1,9);d=ri(2,9);if(x+d<10)continue;}
    else if(cls==='fri'){x=ri(0,8);d=ri(x+1,9);}
    else{x=ri(1,9);d=ri(1,9);if(sign==='+'&&x+d>9)continue;if(sign==='-'&&x<d)continue;}
    t0++;
  }while(aclass(x,d,sign)!==cls&&t0<400);
  if(cls==='fri'&&sign==='-'){a=10+x;b=d;}else{a=x;b=d;}
  return {type:t,a:a,b:b,s:sign==='+'?'+':'−',key:t+'-'+a+'-'+b};}
function exAdd2(){var a=ri(11,89),b=ri(2,89),s=Math.random()<0.5?'+':'−';if(s==='−'){if(b>=a)b=ri(2,a-1);}
  return {type:s==='+'?'add2':'sub2',a:a,b:b,s:s,key:'t2-'+a+s+b};}
function exFlash(){var N=pick([numN(2),numN(3)]);return {type:'flash',N:N,key:'fl-'+N};}
function exSeq(){var n=ri(4,5),a=[ri(1,9)],run=a[0],i;for(i=1;i<n;i++){var v;do{v=ri(1,9);if(Math.random()<0.4)v=-v;}while(run+v<0||run+v>25);a.push(v);run+=v;}
  return {type:'seq',a:a,key:'sq-'+a.join(',')};}
function exMix(){var e=exAdd2();e.type='mix';e.key='mx-'+e.a+e.s+e.b;return e;}
var GEN={set1:function(){return exSet(1);},set2:function(){return exSet(2);},set4:function(){return exSet(4);},rd1:function(){return exRd(1);},rd2:function(){return exRd(2);},rd4:function(){return exRd(4);},
  addS:function(){return exOp('addS');},subS:function(){return exOp('subS');},addB:function(){return exOp('addB');},subB:function(){return exOp('subB');},addF:function(){return exOp('addF');},subF:function(){return exOp('subF');},
  add2:function(){var e=exAdd2();while(e.s!=='+')e=exAdd2();return e;},sub2:function(){var e=exAdd2();while(e.s!=='−')e=exAdd2();return e;},flash:exFlash,seq:exSeq,mix:exMix};
function gen(t){return GEN[t]();}

/* ---------- ответы и пояснения ---------- */
function seqSum(a){return a.reduce(function(x,y){return x+y;},0);}
function ansFor(e){var t=e.type;if(/^set|^rd/.test(t)||t==='flash')return e.N;if(t==='seq')return seqSum(e.a);return e.s==='+'?e.a+e.b:e.a-e.b;}
function planOf(e){var len=lenFor(e.a,e.b,e.s==='+'?e.a+e.b:e.a);return aplan(e.a,e.b,e.s==='+'?'+':'-',len);}
function opText(op,len){
  var d=op.d,nm=rodName(op.rod,len),pre=op.t==='+'?'+':'−';
  if(op.t==='+'){
    if(op.way==='direct')return d<=4?'Прибавляем '+d+' на стержне '+nm+'. Поднимаем '+d+' нижних бусин.':'Прибавляем '+d+' = 5'+(d>5?' + '+(d-5):'')+' на стержне '+nm+'. Опускаем верхнюю бусину'+(d>5?' и поднимаем '+(d-5)+' нижних':'')+'.';
    if(op.way==='bro')return 'Нижних бусин не хватает. Помощь брата: +'+d+' = +5 − '+(5-d)+'. На стержне '+nm+' опускаем верхнюю бусину и убираем '+(5-d)+' нижних.';
    return 'Не помещается. Помощь друга: +'+d+' = +10 − '+(10-d)+'. Прибавляем 1 на стержне слева (это 10) и на стержне '+nm+' убираем '+(10-d)+'.';}
  if(op.way==='direct')return d<=4?'Вычитаем '+d+' на стержне '+nm+'. Опускаем '+d+' нижних бусин.':'Вычитаем '+d+' = 5'+(d>5?' + '+(d-5):'')+' на стержне '+nm+'. Поднимаем верхнюю бусину'+(d>5?' и опускаем '+(d-5)+' нижних':'')+'.';
  if(op.way==='bro')return 'Нижних бусин не хватает. Помощь брата: −'+d+' = −5 + '+(5-d)+'. На стержне '+nm+' поднимаем верхнюю бусину и поднимаем к перекладине '+(5-d)+' нижних.';
  return 'Не хватает на этом стержне. Помощь друга: −'+d+' = −10 + '+(10-d)+'. Убираем 1 на стержне слева (это 10), а на стержне '+nm+' прибавляем '+(10-d)+'.';}
function planLines(e){var p=planOf(e),len=p.start.length;return p.ops.map(function(op,i){return (i+1)+') '+opText(op,len);});}
function actPrompt(f,len){
  var nm=rodName(f.rod,len),k=Math.abs(f.delta),w=f.delta>0?'+':'−';
  if(k===5)return f.delta>0?'Опусти верхнюю бусину на стержне '+nm+' к перекладине (это +5).':'Подними верхнюю бусину на стержне '+nm+' от перекладины (это −5).';
  return f.delta>0?'Подними к перекладине нижние бусины на стержне '+nm+': '+k+' шт. (это +'+k+').':'Опусти от перекладины нижние бусины на стержне '+nm+': '+k+' шт. (это −'+k+').';}
function banner(f,len){
  var op=f.top;
  if(op.way==='fri'&&!f.pre&&f.op===op&&op.pre&&op.pre.length)return 'Теперь убираем лишнее на этом стержне.';
  return opText(op,len);}

function mkQ(e){
  var q={e:e,type:e.type,key:e.key,ans:ansFor(e),mode:'mental'},t=e.type;
  if(/^set/.test(t)){q.mode='abacus';q.len=e.k;q.start=afrom(0,e.k);q.lead='Набери число на абакусе. Нижние бусины поднимай к перекладине, верхнюю опускай.';q.eq='Набери '+e.N;q.hint='Читаем число по стержням слева направо: '+digsN(e.N).map(function(d,i){return d+' '+RODN[e.k-1-i];}).join(', ')+'. Цифра на стержне — это верхняя бусина (5) и нижние (по 1).';q.steps=[q.hint];}
  else if(/^rd/.test(t)){q.lead='Какое число набрано на абакусе?';q.eq='Прочитай число';q.show=afrom(e.N,e.k);q.hint='Считаем по каждому стержню: верхняя бусина у перекладины — это 5, каждая нижняя у перекладины — 1. Читаем слева направо.';q.steps=[digsN(e.N).map(function(d,i){return 'стержень '+RODN[e.k-1-i]+' — '+d;}).join('; ')+'. Число '+e.N+'.'];}
  else if(t==='flash'){q.lead='Запомни число на абакусе. Сейчас оно исчезнет.';q.eq='Что за число?';q.show=afrom(e.N,String(e.N).length);q.flash=2600;q.hint='Не получилось запомнить? Смотри на стержни по очереди и повторяй цифры про себя. Нажми «Показать ещё раз».';q.steps=['Это было число '+e.N+'.'];}
  else if(t==='seq'){q.lead='Прибавляй и вычитай в уме. Числа появляются по одному.';q.eq='Числа появятся сейчас';q.hint='Держи в уме результат и прибавляй или вычитай следующее число. Если сбился, нажми «Показать ещё раз».';var run=0;q.steps=[e.a.map(function(v,i){run+=v;return (i?(v>0?'+ '+v:'− '+(-v)):v)+(i?' = '+run:'');}).join(', ')];}
  else{var p=planOf(e);q.eq=e.a+' '+e.s+' '+e.b+' = ?';q.hint=opText(p.ops[0],p.start.length);q.steps=planLines(e);
    if(t==='mix'){q.mode='mental';q.lead='Посчитай в уме. Можно представить абакус.';q.eq=e.a+' '+e.s+' '+e.b+' = ?';}
    else{q.mode='abacus';q.len=p.start.length;q.start=p.start.slice();q.lead='Выполни действие на абакусе. На нём уже набрано первое число.';}}
  return q;}

/* вспомогательные: клейкая запись шагов для руководства «Считаем вместе» */
function mkG(e){
  var q=mkQ(e),g={q:q,steps:[]};
  if(/^set/.test(e.type)){var D=afrom(e.N,e.k),cur=afrom(0,e.k);g.start=cur.slice();
    D.forEach(function(d,i){var nx=cur.slice();nx[i]=d;g.steps.push({p:'Набери цифру <b>'+d+'</b> на стержне '+rodName(i,e.k)+'.',sub:d>=5?'Верхняя бусина — это 5, нижние — по 1.':'Нижние бусины поднимай к перекладине.',after:nx,hint:'На этом стержне нужно '+d+': '+(d>=5?'верхняя бусина вниз'+(d>5?' и '+(d-5)+' нижних вверх':''):d+' нижних вверх')+'.',hl:i});cur=nx;});return g;}
  var p=planOf(e),len=p.start.length;g.start=p.start.slice();
  aflat(p).forEach(function(f){g.steps.push({p:(f.first?'<b>'+banner(f,len)+'</b><br>':'')+actPrompt(f,len),sub:'',after:f.after,hint:'После этого шага на абакусе число '+aval(f.after)+'. Стержни слева направо: '+f.after.join(' ')+'.',hl:f.rod});});
  return g;}


/* ---------- объяснения ---------- */
var VNAME=['Шаг за шагом','Памятка','Почему так'];
function p(t){return '<p>'+t+'</p>';}
function lines(arr){return '<p class="mono">'+arr.join('<br>')+'</p>';}
function stepCount(e){return /^set/.test(e.type)?digsN(e.N).length:(/^(rd|flash|seq)/.test(e.type)?0:aflat(planOf(e)).length);}
function legendAb(){return '<p class="tz-leg"><span class="tz-key hv">верхняя бусина — 5</span><span class="tz-key ev">нижняя бусина — 1</span></p>';}
var TAB={
 direct:['+1, +2, +3, +4 — поднимаем нижние бусины к перекладине','+5 — опускаем верхнюю бусину','+6 = 5 + 1, +7 = 5 + 2, +8 = 5 + 3, +9 = 5 + 4 — верхняя и нижние вместе'],
 addbro:['+1 = +5 − 4','+2 = +5 − 3','+3 = +5 − 2','+4 = +5 − 1'],
 subbro:['−1 = −5 + 4','−2 = −5 + 3','−3 = −5 + 2','−4 = −5 + 1'],
 addfri:['+1 = +10 − 9','+2 = +10 − 8','+3 = +10 − 7','+4 = +10 − 6','+5 = +10 − 5','+6 = +10 − 4','+7 = +10 − 3','+8 = +10 − 2','+9 = +10 − 1'],
 subfri:['−1 = −10 + 9','−2 = −10 + 8','−3 = −10 + 7','−4 = −10 + 6','−5 = −10 + 5','−6 = −10 + 4','−7 = −10 + 3','−8 = −10 + 2','−9 = −10 + 1']};
function tableFor(e){var t=e.type;
  if(t==='addS'||t==='subS')return [['Прямо, когда бусин хватает',TAB.direct]];
  if(t==='addB')return [['Помощь брата, прибавляем',TAB.addbro]];
  if(t==='subB')return [['Помощь брата, вычитаем',TAB.subbro]];
  if(t==='addF')return [['Помощь друга, прибавляем',TAB.addfri]];
  if(t==='subF')return [['Помощь друга, вычитаем',TAB.subfri]];
  return [['Прямо',TAB.direct],['Брат, прибавляем',TAB.addbro],['Брат, вычитаем',TAB.subbro],['Друг, прибавляем',TAB.addfri.slice(4)],['Друг, вычитаем',TAB.subfri.slice(4)]];}
function whyOp(e){var t=e.type,a=e.a,b=e.b;
  if(t==='addS'||t==='subS')return p('Верхняя бусина стоит 5, каждая нижняя стоит 1. Прибавляем — двигаем бусины к перекладине, вычитаем — от перекладины. Число на стержне — это всё, что у перекладины.')+p('Например, '+a+' '+e.s+' '+b+' = '+ansFor(e)+'. Бусин хватает, поэтому ничего придумывать не нужно.');
  if(t==='addB'||t==='subB')return p('Нижних бусин всего 4. Если нужно прибавить '+b+', а места на стержне нет, на помощь приходит «брат»: верхняя бусина, которая стоит 5. '+(t==='addB'?b+' = 5 − '+(5-b)+'. Мы прибавляем 5 и сразу убираем лишнее.':'Чтобы вычесть '+b+', убираем 5 и возвращаем '+(5-b)+', ведь '+b+' = 5 − '+(5-b)+'.'))+p('Результат тот же, просто путь короче, и он всегда помещается на стержне. Для '+a+' '+e.s+' '+b+' получаем '+ansFor(e)+'.');
  if(t==='addF'||t==='subF')return p('На одном стержне можно набрать только цифру до 9. Когда нужно перейти через десяток, на помощь приходит «друг»: бусина на стержне слева, которая стоит 10. '+(t==='addF'?'Прибавить '+b+' — это прибавить 10 и убрать '+(10-b)+', ведь '+b+' = 10 − '+(10-b)+'.':'Вычесть '+b+' — это убрать 10 (одна бусина слева) и вернуть '+(10-b)+', ведь −'+b+' = −10 + '+(10-b)+'.'))+p('Так '+a+' '+e.s+' '+b+' = '+ansFor(e)+'.');
  return p('Двузначные числа считают по стержням слева направо: сначала десятки, потом единицы. На каждом стержне действуют те же три правила: прямо, помощь брата и помощь друга. Если перехода через десяток нет, всё просто.')+p('Пример: '+a+' '+e.s+' '+b+' = '+ansFor(e)+'. Каждая цифра второго числа — это отдельное маленькое действие на своём стержне.');}
function explain(e,vi,it){
  var t=e.type,N=e.N,out='',head;
  var sk=it?(it.sk||0):0,tot=it?stepCount(e):0;
  if(/^set|^rd/.test(t)){
    var k=e.k,D=afrom(N,k);head='<div class="eq exq">'+N+'</div>';
    if(vi===0){var cur=afrom(0,k).map(function(){return 0;}),i;for(i=0;i<Math.min(sk,k);i++)cur[i]=D[i];
      out=p('Абакус — это счёты. На каждом стержне живёт одна цифра. Верхняя бусина стоит <b>5</b>, а четыре нижние стоят по <b>1</b>. Бусина считается, когда она прижата к перекладине.')+legendAb()+abStatic(cur,{labels:true,hl:sk>0&&sk<=k?sk-1:undefined});
      if(sk>0)out+=lines(D.slice(0,sk).map(function(d,i){return 'Стержень '+RODN[k-1-i]+' — цифра '+d+(d>=5?(d>5?': 5 и ещё '+(d-5):': только верхняя бусина'):(d>0?': '+d+' нижних бусин':': пусто'));}).map(function(x){return x.replace(': ',' — ');}));
      out+=sk<k?p('<span class="small">Нажми «Покажи шаг», и мы наберём следующую цифру.</span>'):p('<b>Готово: на абакусе число '+N+'.</b>');}
    else if(vi===1){var l=[],d;for(d=0;d<=9;d++)l.push({v:[d],t:String(d)});
      out=p('Все цифры на одном стержне. Запомни: цифры с 5 до 9 всегда начинаются с верхней бусины.')+miniRow(l);}
    else out=p('Число читаем по стержням слева направо. Правый стержень — единицы, следующий — десятки, потом сотни и тысячи. Бусина на левом стержне в 10 раз ценнее такой же бусины справа.')+abStatic(D,{labels:true})+p('Здесь '+D.map(function(d,i){return d+' '+RODN[k-1-i];}).join(', ')+', то есть число <b>'+N+'</b>.');
    return head+out;}
  if(t==='flash'){head='<div class="eq exq">'+N+'</div>';var D2=afrom(N,String(N).length);
    if(vi===0)out=p('Ментальный счёт начинается с образа абакуса. Посмотри на картинку 3 секунды, закрой глаза и представь её.')+abStatic(D2,{labels:true})+lines(['1) Смотрим на стержни слева направо.','2) Говорим про себя цифры: '+D2.join(', ')+'.','3) Закрываем глаза и «видим» бусины.','4) Называем число: '+N+'.']);
    else if(vi===1)out=p('Тренируйся без экрана: положи руки перед собой, как будто на абакусе. Двигай пальцами в воздухе так, будто двигаешь бусины. Большой палец — верхняя бусина, указательный — нижние.')+p('Так образ абакуса «переезжает» из картинки в голову.');
    else out=p('Почему сначала абакус, а потом образ. Ребёнку трудно удерживать в голове число как набор цифр, а картинка запоминается легче. Поэтому метод начинается с настоящего абакуса, а потом бусины «переносятся» в воображение.')+p('Заметим честно: исследования влияния ментальной арифметики на общие способности пока неоднозначны. Уверенно можно говорить о тренировке внимания и счёта, а не о «суперспособностях».');
    return head+out;}
  if(t==='seq'){var run=0,rl=e.a.map(function(v,i){run+=v;return (i?(v>0?'+ '+v:'− '+(-v)):v)+(i?' = '+run:'');});head='<div class="eq exq">'+e.a.map(function(v,i){return i?(v>0?'+ '+v:'− '+(-v)):v;}).join(' ')+'</div>';
    if(vi===0)out=p('Цепочка: числа появляются по одному, а ты держишь в уме результат. Не складывай всё в конце, а считай по ходу.')+lines(rl)+p('<b>Ответ: '+seqSum(e.a)+'.</b>');
    else if(vi===1)out=p('Представь абакус и двигай бусины в воображении. На стержне единиц набрано то число, которое сейчас в голове. Пришло новое число? Двигаем бусины по трём правилам: прямо, брат или друг.');
    else out=p('Почему считаем по ходу. Если сначала запомнить все числа, а потом складывать, голова перегружается. Если держать только текущий результат, нужно помнить одно число. Это и есть тренировка рабочей памяти.');
    return head+out;}
  /* операции */
  head='<div class="eq exq">'+e.a+' '+e.s+' '+e.b+' = ?</div>';
  if(t==='mix'){
    if(vi===0)out=p('Теперь считаем без абакуса. Представь его и делай те же шаги: сначала десятки, потом единицы.')+lines(planLines(e))+p('<b>Ответ: '+ansFor(e)+'.</b>');
    else if(vi===1)out=tableFor(e).map(function(r){return p('<b>'+r[0]+'</b>')+lines(r[1]);}).join('');
    else out=whyOp(e);
    return head+out;}
  var P=planOf(e),F=aflat(P),len=P.start.length,i;
  if(vi===0){
    var cur=sk>0?F[Math.min(sk,F.length)-1].after:P.start,hl=sk>0?F[Math.min(sk,F.length)-1].rod:undefined;
    out=p('Сначала набираем <b>'+e.a+'</b> на абакусе. Дальше '+(e.s==='+'?'прибавляем':'вычитаем')+' <b>'+e.b+'</b> по стержням слева направо.')+abStatic(cur,{labels:true,hl:hl});
    if(sk>0){var seen={},ls=[];for(i=0;i<sk&&i<F.length;i++){var tp=F[i].top;if(!seen[F[i].top.rod+'-'+F.indexOf(F[i])]&&F[i].first){ls.push(banner(F[i],len));}}out+=lines(ls);}
    out+=sk<tot?p('<span class="small">Нажми «Покажи шаг», чтобы сделать следующее движение.</span>'):p('<b>Ответ: '+ansFor(e)+'.</b>');}
  else if(vi===1)out=tableFor(e).map(function(r){return p('<b>'+r[0]+'</b>')+lines(r[1]);}).join('')+p('Так счёт на абакусе сводится к трём привычным действиям: двигаем бусины, зовём брата, зовём друга.');
  else out=whyOp(e);
  return head+out;}


/* ---------- модули ---------- */
var MODS=[
 {id:'a0',tag:'0–9',title:'Знакомство с абакусом',sub:'Верхняя и нижние бусины, цифры на одном стержне',type:'set1',types:['set1','rd1','set1'],guide:'set1',need:'free',canon:{type:'set1',N:7,k:1,key:'set1-7'},ex2e:{type:'set1',N:3,k:1,key:'set1-3'},art:['#B5651D','#E8A862'],note:'5 вверху, 1 внизу'},
 {id:'a1',tag:'47',title:'Числа до 99',sub:'Десятки и единицы на двух стержнях',type:'set2',types:['set2','rd2','set2'],guide:'set2',need:'standard',canon:{type:'set2',N:47,k:2,key:'set2-47'},art:['#2B59E6','#5B7FF0'],note:'два стержня'},
 {id:'a2',tag:'2835',title:'Числа до 9999',sub:'Тысячи, сотни, десятки, единицы',type:'set4',types:['set4','rd4','set4'],guide:'set4',need:'standard',canon:{type:'set4',N:2835,k:4,key:'set4-2835'},art:['#7A2FC4','#B05CF0'],note:'четыре стержня'},
 {id:'a3',tag:'5 + 3',title:'Сложение без помощи',sub:'Бусин хватает, двигаем прямо',type:'addS',guide:'addS',need:'standard',canon:{type:'addS',a:5,b:3,s:'+',key:'addS-5-3'},ex2e:{type:'addS',a:12,b:6,s:'+',key:'addS-12-6'},art:['#0E8F6A','#2FC79A'],note:'= 8'},
 {id:'a4',tag:'8 − 3',title:'Вычитание без помощи',sub:'Убираем бусины прямо',type:'subS',guide:'subS',need:'standard',canon:{type:'subS',a:8,b:3,s:'−',key:'subS-8-3'},ex2e:{type:'subS',a:7,b:5,s:'−',key:'subS-7-5'},art:['#0E8FB0','#35C2D0'],note:'= 5'},
 {id:'a5',tag:'3 + 4',title:'Сложение: помощь брата',sub:'+4 = +5 − 1',type:'addB',guide:'addB',need:'standard',canon:{type:'addB',a:3,b:4,s:'+',key:'addB-3-4'},ex2e:{type:'addB',a:2,b:3,s:'+',key:'addB-2-3'},art:['#C2255C','#FF6F91'],note:'= 7'},
 {id:'a6',tag:'7 − 4',title:'Вычитание: помощь брата',sub:'−4 = −5 + 1',type:'subB',guide:'subB',need:'standard',canon:{type:'subB',a:7,b:4,s:'−',key:'subB-7-4'},ex2e:{type:'subB',a:6,b:3,s:'−',key:'subB-6-3'},art:['#E67700','#FFC53D'],note:'= 3'},
 {id:'a7',tag:'7 + 5',title:'Сложение: помощь друга',sub:'+5 = +10 − 5',type:'addF',guide:'addF',need:'standard',canon:{type:'addF',a:7,b:5,s:'+',key:'addF-7-5'},ex2e:{type:'addF',a:8,b:6,s:'+',key:'addF-8-6'},art:['#2F9E44','#74D68A'],note:'= 12'},
 {id:'a8',tag:'13 − 6',title:'Вычитание: помощь друга',sub:'−6 = −10 + 4',type:'subF',guide:'subF',need:'standard',canon:{type:'subF',a:13,b:6,s:'−',key:'subF-13-6'},ex2e:{type:'subF',a:12,b:8,s:'−',key:'subF-12-8'},art:['#C92A2A','#FF8787'],note:'= 7'},
 {id:'a9',tag:'47 + 38',title:'Двузначные числа',sub:'Считаем по стержням слева направо',type:'add2',types:['add2','sub2','add2'],guide:'add2',need:'standard',canon:{type:'add2',a:47,b:38,s:'+',key:'t2-47+38'},ex2e:{type:'sub2',a:62,b:29,s:'−',key:'t2-62−29'},art:['#5F3DC4','#9775FA'],note:'= 85'},
 {id:'a10',tag:'образ',title:'Образ абакуса',sub:'Смотрим, запоминаем, называем',type:'flash',guide:'flash',need:'standard',canon:{type:'flash',N:37,key:'fl-37'},art:['#1971C2','#4DABF7'],note:'представляем бусины'},
 {id:'a11',tag:'3 + 4 − 2',title:'Цепочка в уме',sub:'Числа появляются по одному',type:'seq',guide:'seq',need:'standard',canon:{type:'seq',a:[3,4,-2,5],key:'sq-3,4,-2,5'},art:['#D9480F','#FF922B'],note:'считаем по ходу'},
 {id:'a12',tag:'56 + 27',title:'Счёт в уме',sub:'Без абакуса, но с образом',type:'mix',guide:'mix',need:'standard',canon:{type:'mix',a:56,b:27,s:'+',key:'mx-56+27'},ex2e:{type:'mix',a:83,b:46,s:'−',key:'mx-83−46'},art:['#087F5B','#38D9A9'],note:'= 83'}];
function modById(id){for(var i=0;i<MODS.length;i++)if(MODS[i].id===id)return MODS[i];return null;}
function locked(m){return !atLeast(m.need);}
function lockSvg(){return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';}
function mArtSvg(id,c1,c2,inner){return '<svg class="modart" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false"><defs><linearGradient id="ma-'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs><rect x="-3" y="-3" width="306" height="126" fill="url(#ma-'+id+')"/><circle cx="270" cy="14" r="34" fill="#fff" opacity=".12"/>'+inner+'</svg>';}
function miniAb(x,y,v){var s='',i,c;s+='<rect x="'+x+'" y="'+y+'" width="'+(v.length*30+10)+'" height="64" rx="8" fill="#C98A4B" stroke="#6B4423" stroke-width="2.5"/><rect x="'+(x+3)+'" y="'+(y+22)+'" width="'+(v.length*30+4)+'" height="5" fill="#6B4423"/>';
  for(i=0;i<v.length;i++){c=x+20+i*30;var h=v[i]>=5,e=v[i]%5,j;s+='<line x1="'+c+'" y1="'+(y+4)+'" x2="'+c+'" y2="'+(y+60)+'" stroke="#3b2a14" stroke-width="2"/><ellipse cx="'+c+'" cy="'+(h?y+17:y+9)+'" rx="11" ry="5.5" fill="#E8590C" stroke="#1A2747" stroke-width="1.5"/>';
    for(j=1;j<=4;j++)s+='<ellipse cx="'+c+'" cy="'+(j<=e?y+34+7*(j-1):y+60-7*(4-j)-3)+'" rx="11" ry="5.5" fill="#2B59E6" stroke="#1A2747" stroke-width="1.5"/>';}
  return s;}
function modArt(m){
  var inner,v;
  if(m.id==='a0')inner=miniAb(95,18,[7])+miniAb(150,18,[3])+'<text x="150" y="104" font-family="Rubik,sans-serif" font-weight="700" font-size="14" fill="#fff" text-anchor="middle">5 вверху, 1 внизу</text>';
  else if(m.id==='a1')inner=miniAb(100,16,[4,7])+'<text x="150" y="104" font-family="Rubik,sans-serif" font-weight="700" font-size="15" fill="#fff" text-anchor="middle">число 47</text>';
  else if(m.id==='a2')inner=miniAb(75,16,[2,8,3,5])+'<text x="150" y="104" font-family="Rubik,sans-serif" font-weight="700" font-size="15" fill="#fff" text-anchor="middle">число 2835</text>';
  else inner='<text x="150" y="58" font-family="Rubik,sans-serif" font-weight="700" font-size="'+(m.tag.length>7?30:40)+'" fill="#fff" text-anchor="middle">'+m.tag+'</text><text x="150" y="92" font-family="Rubik,sans-serif" font-weight="600" font-size="15" fill="#fff" text-anchor="middle">'+m.note+'</text>';
  return mArtSvg(m.id,m.art[0],m.art[1],inner);}
function trainArt(){return mArtSvg('tr','#8A4B14','#E8A862',miniAb(40,22,[4,7])+miniAb(120,22,[1,2,6])+miniAb(220,22,[8])+'<path d="M150 98l-8 14h10l-4 10 14-18h-10l5-6z" fill="#FFC83D" stroke="#1A2747" stroke-width="2" stroke-linejoin="round"/>');}

/* ---------- состояние экрана ---------- */
var app=$('#app'),view={name:'home'},R=null,tick=null,lastTick=0,timers=[];
function clearT(){timers.forEach(clearTimeout);timers=[];}
function later(fn,ms){var id=setTimeout(fn,ms);timers.push(id);return id;}
function startTimer(){stopTimer();lastTick=Date.now();tick=setInterval(function(){if(document.hidden){lastTick=Date.now();return;}var n=Date.now();var d=Math.min(10,Math.round((n-lastTick)/1000));lastTick=n;if(d>0)addTime(d);},5000);}
function stopTimer(){if(tick){clearInterval(tick);tick=null;}}
function go(v){stopTimer();clearT();view=v;R=null;render();window.scrollTo(0,0);}
function render(){
  clearT();
  if(tier()==='free'&&view.name==='train'&&usedMin()>=FREE_MIN&&!view.run){view={name:'buy',why:'limit'};}
  ({home:rHome,lesson:rRun,train:rTrain,parent:rParent,buy:rBuy,done:rDone,sum:rSum})[view.name]();
  var cur={lesson:'home',done:'home',sum:'train'}[view.name]||view.name;
  Array.prototype.forEach.call(document.querySelectorAll('.nav button[data-v]'),function(b){if(b.getAttribute('data-v')===cur)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
function recordResult(q,ok,ms){
  var s=M.stats[q.type]||(M.stats[q.type]={ok:0,bad:0});if(ok)s.ok++;else s.bad++;
  var e=M.sr[q.key];
  if(!ok){M.sr[q.key]={box:0,due:Date.now()+864e5,e:q.e};}
  else if(e){e.box++;if(e.box>3)delete M.sr[q.key];else e.due=Date.now()+[1,3,7,14][e.box]*864e5;}
  if(ok&&ms&&q.first){var r=M.rec[q.type];if(!r||ms<r.best)M.rec[q.type]={best:ms};}
  save();}
function badRate(t){var s=M.stats[t];if(!s||s.ok+s.bad<3)return 0;return s.bad/(s.ok+s.bad);}

/* ---------- главный экран ---------- */
function rHome(){
  var next=null,i;for(i=0;i<MODS.length;i++){if(!M.done[MODS[i].id]&&!locked(MODS[i])){next=MODS[i];break;}}
  var cards=MODS.map(function(m,i){var d=M.done[m.id],lk=locked(m);
    var st=d?'<span class="stars" aria-label="'+(M.stars[m.id]||2)+' из 3">'+starsStr(M.stars[m.id]||2)+'</span> пройдено':(lk?lockSvg()+'В платном тарифе':(next&&next.id===m.id?'Следующий':'Новое'));
    return '<button type="button" class="mod'+(d?' done':'')+'" data-start="'+m.id+'">'+modArt(m)+'<span class="mod-n">Модуль '+(i+1)+'</span><span class="mod-tag">'+m.tag+'</span><span class="mod-t">'+m.title+'</span><span class="mod-s">'+st+'</span></button>';}).join('');
  var today=next?'<div><b>Сегодня: модуль '+(MODS.indexOf(next)+1)+'</b><span>'+next.title+'. Хватит 5–10 минут.</span></div><button type="button" class="btn" data-start="'+next.id+'">'+(Object.keys(M.done).length?'Продолжить':'Начать')+'</button>'
    :'<div><b>Все доступные модули пройдены</b><span>Тренажёр подберёт примеры, которые пока даются труднее.</span></div><button type="button" class="btn" data-v="train">В тренажёр</button>';
  var free=tier()==='free'?'<section class="note" style="margin-top:14px"><h3>Бесплатный доступ</h3><p>Открыт первый модуль «Знакомство с абакусом»: бусины, цифры от 0 до 9 и чтение числа на абакусе. Бесплатный тренажёр даёт задания на набор и чтение цифр, до '+FREE_MIN+' '+pl(FREE_MIN,'минуты','минут','минут')+' в день, сегодня осталось '+Math.max(0,FREE_MIN-usedMin())+' мин. Остальные 12 модулей откроет тариф «Ментальная арифметика» или «Комбо».</p><button type="button" class="btn" data-v="plans">Посмотреть тарифы</button></section>':'';
  app.innerHTML='<section class="card lift"><p class="kicker">Абакус и счёт в уме</p><h1>Ментальная арифметика</h1><p class="lead" style="margin-top:12px">Сначала считаем на настоящем виртуальном абакусе, двигая бусины пальцем. Потом учимся представлять его в уме и считать без картинки. Не понял? Нажми «Объясни по-другому».</p><div class="today"><span class="clk-hi">'+clk('joy')+'<i>Привет! Я Клетик</i></span>'+today+'</div></section>'+free
   +'<h2>Модули</h2><div class="mods">'+cards+'</div><h2>Ещё</h2><div class="mods">'
   +'<button type="button" class="mod" data-v="train">'+trainArt()+'<span class="mod-tag">Тренажёр</span><span class="mod-s">Примеры подбираются под тебя'+(tier()==='free'?' · '+lockSvg()+'только цифры':'')+'</span></button></div>'
   +'<p class="small" style="margin-top:18px">Хорошо заниматься по 5–10 минут каждый день. Таймера на вопросах нет: скорость придёт после понимания. Ментальная арифметика развивает счёт, внимание и память, но не заменяет школьную математику.</p>';}

/* ---------- урок ---------- */
function startModule(id){
  var m=modById(id);if(!m)return;
  if(locked(m)){view={name:'buy',why:'block',title:m.title};render();return;}
  var tp=m.types||[m.type],gt=m.guide||m.type,abG=/^set|^add|^sub/.test(gt)&&gt!=='sub2';
  var items=[{kind:'explain',e:m.canon,v:0,sk:0},{kind:'explain',e:m.ex2e||gen(m.type),v:0,sk:0}],a,i,j;
  if(m.id==='a10'||m.id==='a11'||m.id==='a12'){for(a=0;a<2;a++)items.push({kind:'ask',q:mkQ(gen(gt)),phase:'Считаем вместе',test:false,help:true,w:0});}
  else for(a=0;a<2;a++)items.push({kind:'guide',q:mkQ(gen(gt)),phase:'Считаем вместе',w:0});
  for(i=0;i<2;i++)items.push({kind:'ask',q:mkQ(gen(tp[i%tp.length])),phase:'Тренируемся',test:false,w:0});
  for(j=0;j<3;j++)items.push({kind:'ask',q:mkQ(gen(tp[j%tp.length])),phase:'Проверка',test:true,w:0});
  R={mod:m,items:items,i:0,mode:'lesson'};view={name:'lesson'};startTimer();render();window.scrollTo(0,0);}
function barHtml(){var s='';R.items.forEach(function(_,i){s+='<i class="'+(i<R.i?'on':(i===R.i?'now':''))+'"></i>';});return '<div class="bar" aria-hidden="true">'+s+'</div>';}
function rRun(){
  if(!R){go({name:'home'});return;}
  if(R.mode==='train'){
    if(tier()==='free'&&usedMin()>=FREE_MIN&&R.i>0){stopTimer();view={name:'buy',why:'limit'};R=null;render();return;}
    if(R.i>=R.items.length){
      if(!R.repeated&&R.queue.length){R.repeated=true;R.queue.slice(0,3).forEach(function(e){R.items.push({kind:'ask',q:mkQ(e),phase:'Повторим',test:false,w:0});});}
      else{finishRun();return;}}
    app.innerHTML='';rAsk(R.items[R.i]);return;}
  if(R.i>=R.items.length){finishModule();return;}
  var it=R.items[R.i];app.innerHTML='';
  if(it.kind==='explain')rExplain(it);else if(it.kind==='guide')rGuide(it);else rAsk(it);}
function rExplain(it){
  var card=h('<section class="card lift"></section>');
  function paint(){
    var vi=it.v%3,tot=stepCount(it.e),stepper=vi===0&&tot>0;
    card.innerHTML=barHtml()+'<div class="phase">'+(R.i===0?'Узнаём':'Ещё пример')+' · '+VNAME[vi]+'</div><h2 style="margin:0 0 8px">'+R.mod.title+'</h2><div id="expl" class="expl">'+explain(it.e,vi,it)+'</div><p class="small">Объяснение '+(vi+1)+' из 3</p><div class="row"></div>';
    var rw=$('.row',card);
    if(R.i>0){var b=h('<button type="button" class="btn ghost">Назад</button>');b.onclick=function(){R.i--;render();};rw.appendChild(b);}
    var al=h('<button type="button" class="btn ghost alt">Объясни по-другому</button>');al.onclick=function(){it.v++;it.sk=0;M.alts[R.mod.id]=(M.alts[R.mod.id]||0)+1;save();paint();};rw.appendChild(al);
    if(stepper&&(it.sk||0)<tot){var sb=h('<button type="button" class="btn">'+((it.sk||0)?'Следующий шаг':'Покажи шаг')+'</button>');sb.onclick=function(){it.sk=(it.sk||0)+1;paint();};rw.appendChild(sb);}
    var nx=h('<button type="button" class="btn'+(stepper&&(it.sk||0)<tot?' ghost':'')+'">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);
    card.insertAdjacentHTML('beforeend','<div class="clk-corner">'+clk('think')+'</div>');}
  paint();app.appendChild(card);}

/* ---------- вопрос ---------- */
function stepsHtml(q){return '<div class="hint"><p><b>Решение по шагам</b></p>'+lines(q.steps)+'</div>';}
function headFor(it){return R.mode==='lesson'?barHtml()+'<div class="phase">'+it.phase+'</div>':'<div class="phase">'+(R.mode==='train'?'Тренажёр '+(R.i+1)+' из '+R.items.length:'')+'</div>';}
function rAsk(it){
  var q=it.q;q.first=true;var t0=Date.now(),isAb=q.mode==='abacus',isFl=q.type==='flash',isSq=q.type==='seq',vals=isAb?q.start.slice():null;
  var card=h('<section class="card lift"></section>'),shown=0;
  var vis=isAb?'<div id="abx"></div>':(q.show&&!isFl?'<div id="abs">'+abStatic(q.show,{labels:true})+'</div>':(isFl||isSq?'<div id="flb" class="flb"></div>':''));
  var ansUi=isAb?'<div class="answer"><button type="button" class="btn" id="chk">Готово</button></div>':'<div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div>';
  card.innerHTML=headFor(it)+'<p class="ask-lead">'+q.lead+'</p><div class="eq'+(q.eq.length>14?' sm':'')+'">'+q.eq+'</div>'+vis+ansUi+'<div id="fb" aria-live="polite"></div><div class="row" style="margin-top:14px"></div>';
  app.appendChild(card);
  var inp=$('#ans',card),chk=$('#chk',card),fb=$('#fb',card),rw=$('.row',card),host=$('#abx',card),flb=$('#flb',card),showBtn=null,replay=null;
  if(isAb)mountAbacus(host,vals,{labels:true});
  if(inp&&!isFl&&!isSq)inp.focus({preventScroll:true});
  function next(){R.i++;render();window.scrollTo(0,0);}
  function addShow(){if(showBtn||it.test)return;showBtn=h('<button type="button" class="btn ghost">Покажи решение по шагам</button>');showBtn.onclick=function(){fb.insertAdjacentHTML('beforeend',stepsHtml(q));showBtn.remove();};rw.appendChild(showBtn);}
  /* вспышка и цепочка */
  function setInput(on){if(inp){inp.disabled=!on;chk.disabled=!on;if(on)inp.focus({preventScroll:true});}}
  function runFlash(){
    setInput(false);flb.innerHTML=abStatic(q.show,{labels:true});
    later(function(){flb.innerHTML='<div class="flcover" aria-live="polite">?</div>';setInput(true);if(!it.test&&shown<2&&!replay){replay=h('<button type="button" class="btn ghost">Показать ещё раз</button>');replay.onclick=function(){shown++;replay.remove();replay=null;runFlash();};rw.insertBefore(replay,rw.firstChild);}},q.flash);shown+=0;}
  function runSeq(){
    setInput(false);var a=q.e.a,i=0;
    function step(){
      if(i>=a.length){flb.innerHTML='<div class="flcover">Сколько получилось?</div>';setInput(true);if(!it.test&&shown<2&&!replay){replay=h('<button type="button" class="btn ghost">Показать ещё раз</button>');replay.onclick=function(){shown++;replay.remove();replay=null;runSeq();};rw.insertBefore(replay,rw.firstChild);}return;}
      var v=a[i];flb.innerHTML='<div class="flnum" aria-live="assertive">'+(i===0?v:(v>0?'+ '+v:'− '+(-v)))+'</div>';i++;later(function(){flb.innerHTML='<div class="flnum dim">&nbsp;</div>';later(step,250);},1100);}
    later(step,300);}
  if(isFl)runFlash();else if(isSq)runSeq();
  function done(ok,msg){
    it.done=true;
    if(inp)inp.disabled=true;
    chk.textContent='Дальше';chk.disabled=false;chk.onclick=next;later(function(){chk.focus();},200);
    if(isAb)host._lock=true;
    if(replay)replay.remove();
    if(it.test&&R.mode==='lesson'){R.testN=(R.testN||0)+1;if(ok&&q.first)R.testOk=(R.testOk||0)+1;}
    fb.innerHTML=msg;}
  function check(v){
    if(it.done)return;
    if(v===q.ans){
      var ms=Date.now()-t0;recordResult(q,q.first,ms);
      done(true,'<div class="fb ok hc">'+clk('joy')+'<strong>'+pick(['Верно!','Да, точно!','Правильно!','Отлично!'])+'</strong></div>');return;}
    it.w++;q.first=false;
    var tries=it.help?3:2;
    if(it.test||it.w>=tries){
      recordResult(q,false,0);
      if(isAb)host._set(afrom(q.ans,q.len));
      done(false,'<div class="fb try hc">'+clk('sorry')+'<strong>'+(it.w>=2&&!it.test?'Ничего страшного.':'Пока не получилось.')+' Правильный ответ — '+q.ans+'.</strong>'+stepsHtml(q)+'<span>Этот пример мы ещё повторим.</span></div>');
      if(R.mode==='train'&&R.queue)R.queue.push(q.e);return;}
    fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ой, давай посмотрим ещё раз.</strong><div class="hint">'+q.hint+'</div><span>Попробуй ещё раз.</span></div>';
    addShow();if(inp){inp.value='';inp.focus();}}
  chk.onclick=function(){
    if(chk.textContent==='Дальше'){next();return;}
    if(isAb){check(aval(vals));return;}
    var raw=String(inp.value).trim();if(raw===''||isNaN(Number(raw))){fb.innerHTML='<div class="fb try"><strong>Введи число.</strong></div>';return;}check(Number(raw));};
  if(inp)inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)chk.onclick();};}

/* ---------- считаем вместе: двигаем бусины по шагам ---------- */
function rGuide(it){
  var q=it.q,g=mkG(q.e),k=0,ms=0,vals=g.start.slice(),opts={labels:true},card=h('<section class="card lift"></section>');
  card.innerHTML=headFor(it)+'<p class="ask-lead">'+(/^set/.test(q.type)?'Набираем число вместе: делай то, что просит подсказка.':'Считаем вместе: делай то, что просит подсказка.')+'</p><div class="eq'+(q.eq.length>14?' sm':'')+'">'+q.eq+'</div><div id="abx"></div><div id="gp" class="gp"></div><div class="answer"><button type="button" class="btn" id="chk">Проверить</button></div><div id="fb" aria-live="polite"></div>';
  app.appendChild(card);
  var host=$('#abx',card),chk=$('#chk',card),fb=$('#fb',card),gp=$('#gp',card),fin=false;
  mountAbacus(host,vals,opts);
  function same(a,b){var i;for(i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
  function next(){R.i++;render();window.scrollTo(0,0);}
  function paint(){
    if(k>=g.steps.length){fin=true;host._lock=true;opts.hl=undefined;host._set(vals);recordResult({type:q.type,key:q.key,e:q.e,first:it.w===0},it.w===0,0);
      gp.innerHTML='<p><b>Готово! '+(/^set/.test(q.type)?'На абакусе число '+q.ans+'.':'Ответ: '+q.ans+'.')+'</b></p>';chk.textContent='Дальше';later(function(){chk.focus();},200);return;}
    var s=g.steps[k];opts.hl=s.hl;host._set(vals);gp.innerHTML='<p>'+s.p+'</p>'+(s.sub?'<p class="small">'+s.sub+'</p>':'');ms=0;}
  chk.onclick=function(){
    if(fin){next();return;}
    var s=g.steps[k];
    if(same(vals,s.after)){fb.innerHTML='<div class="fb ok hc">'+clk('joy')+'<strong>'+pick(['Верно!','Да!','Точно!'])+'</strong></div>';k++;paint();return;}
    it.w++;ms++;
    if(ms>=2){var i;for(i=0;i<vals.length;i++)vals[i]=s.after[i];fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ничего страшного. Вот как должно быть.</strong><div class="hint">'+s.hint+'</div><span>Идём дальше.</span></div>';k++;paint();return;}
    fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ой, давай посмотрим ещё раз.</strong><div class="hint">'+s.hint+'</div><span>Попробуй ещё раз.</span></div>';};
  paint();}

function finishModule(){
  stopTimer();var m=R.mod,n=R.testN||3,ok=R.testOk||0;
  var st=ok>=n?3:(ok>=Math.ceil(n*2/3)?2:1);
  M.done[m.id]=true;M.stars[m.id]=Math.max(M.stars[m.id]||0,st);save();
  view={name:'done',id:m.id,ok:ok,n:n,st:st};render();}
function rDone(){
  var m=modById(view.id),idx=MODS.indexOf(m),nx=MODS[idx+1];
  app.innerHTML='<section class="card lift"><div class="clk-top">'+clk('party')+'</div><div class="phase">Модуль пройден</div><div class="big-stars" aria-label="'+view.st+' из 3">'+starsStr(view.st)+'</div><h2 style="margin:14px 0 10px">'+(view.st>=2?'Ты освоил приём':'Хорошее начало')+'</h2><p>В проверке с первого раза верно: '+view.ok+' из '+view.n+'. '+(view.st<3?'Пример, где была ошибка, вернётся в тренажёре.':'')+'</p><p class="small">Чтобы приём закрепился, вернись к нему в тренажёре завтра.</p><div class="row">'+(nx&&!locked(nx)?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий модуль</button>':(nx?'<button type="button" class="btn" data-v="plans">Открыть следующий модуль</button>':''))+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';}

/* ---------- тренажёр ---------- */
function availTypes(){return tier()==='free'?['set1','rd1']:ALL_T.slice();}
function pickType(types){var w=types.map(function(t){return 1+4*badRate(t);}),sum=w.reduce(function(a,b){return a+b;},0),r=Math.random()*sum,i;for(i=0;i<types.length;i++){r-=w[i];if(r<=0)return types[i];}return types[0];}
function startTrain(){
  if(tier()==='free'&&usedMin()>=FREE_MIN){view={name:'buy',why:'limit'};render();return;}
  var types=availTypes(),items=[],due=[];
  if(tier()==='pro'){var now=Date.now();Object.keys(M.sr).forEach(function(k){var s=M.sr[k];if(s&&s.e&&s.due<=now)due.push(s.e);});due=due.slice(0,3);}
  due.forEach(function(e){items.push({kind:'ask',q:mkQ(e),phase:'Повторение',test:false,w:0});});
  while(items.length<10)items.push({kind:'ask',q:mkQ(gen(pickType(types))),phase:'Тренажёр',test:false,w:0});
  R={mode:'train',items:items,i:0,queue:[],repeated:false};view={name:'train'};startTimer();render();}
function rTrain(){
  if(R&&R.mode==='train'){rRun();return;}
  var weak=ALL_T.filter(function(t){return badRate(t)>=0.3;}).map(function(t){return TYPES[t].name;});
  var sr=Object.keys(M.sr).length;
  app.innerHTML='<section class="card lift"><p class="kicker">5–10 минут в день</p><h1>Тренажёр</h1><p class="lead" style="margin-top:12px">Около десяти заданий: набрать число, посчитать на абакусе, запомнить образ, сосчитать цепочку в уме. Таймера на вопросах нет. Если пример не получился, он вернётся позже.</p>'
   +(weak.length?'<p>Чаще попадутся: <b>'+weak.join(', ')+'</b>.</p>':'<p class="small">Пока мы изучаем, что тебе даётся легко, а что труднее.</p>')
   +(atLeast('pro')?'<p class="small">Примеров на повторении: '+sr+'. Они возвращаются через 1, 3, 7 и 14 дней.</p>':'<p class="small">В бесплатной версии тренажёр даёт задания на набор и чтение цифр, до '+FREE_MIN+' минут в день. Счёт на абакусе и ментальные задания откроет тариф «Ментальная арифметика» или «Комбо».</p>')
   +'<div class="row"><button type="button" class="btn" id="go">Начать</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';
  $('#go').onclick=startTrain;}
function rSum(){
  var wk=view.weak||[];
  app.innerHTML='<section class="card lift"><div class="phase">Итог</div><h2 style="margin:0 0 10px">Тренировка закончена</h2><p>С первого раза верно: <b>'+view.ok+' из '+view.n+'</b>.</p>'
   +(wk.length?'<p>Эти примеры мы покажем чаще:</p><p class="mono">'+wk.join('<br>')+'</p>':'<p>Все примеры получились. Так держать.</p>')
   +'<div class="row"><button type="button" class="btn" data-v="train">Ещё раз</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';}
function finishRun(){
  stopTimer();var ok=0,wk=[];
  R.items.forEach(function(it){if(it.kind==='ask'){if(it.done&&it.w===0)ok++;else if(it.w>0)wk.push(it.q.eq.replace(/<\/?b>/g,''));}});
  view={name:'sum',mode:R.mode,ok:ok,n:R.items.length,weak:wk.slice(0,6)};R=null;render();}


/* ---------- кабинет родителя ---------- */
function exportData(){return {app:'abakus',schemaVersion:1,exportedAt:new Date().toISOString(),progress:JSON.parse(JSON.stringify(M))};}
function rParent(){
  var rows=ALL_T.map(function(t){var s=M.stats[t]||{ok:0,bad:0},tot=s.ok+s.bad,rec=M.rec[t];return '<div><span>'+TYPES[t].name+'</span><b>'+(tot?Math.round(100*s.ok/tot)+'% верно · '+tot+' '+pl(tot,'пример','примера','примеров'):'пока нет данных')+(rec?' · рекорд '+Math.max(1,Math.round(rec.best/1000))+' с':'')+'</b></div>';}).join('');
  var mins=Math.round((M.days[dayKey()]||0)/60);
  app.innerHTML='<section class="card lift"><p class="kicker">Родителям</p><h1>Прогресс по ментальной арифметике</h1><p class="lead" style="margin-top:12px">Занятия сегодня: '+mins+' мин. Лучше 5–10 минут каждый день, чем час раз в неделю.</p></section>'
   +'<section class="card" style="margin-top:14px"><h3>Модули</h3><div class="bars">'+MODS.map(function(m){return '<div><span>'+m.title+'</span><b>'+(M.done[m.id]?starsStr(M.stars[m.id]||1):(locked(m)?'закрыт':'не пройден'))+'</b></div>';}).join('')+'</div></section>'
   +'<section class="card" style="margin-top:14px"><h3>Над чем поработать</h3><div class="bars">'+rows+'</div><p class="small">Примеры, которые давались трудно, тренажёр показывает чаще. «Верно» считается по всем попыткам.</p></section>'
   +'<section class="card" style="margin-top:14px"><h3>Доступ</h3><p class="small">«Ментальная арифметика»: <b>'+TIER_NAME[tier()]+'</b>. «Умножение»: <b>'+TIER_NAME[mainMult]+'</b>. «Устный счёт»: <b>'+TIER_NAME[mainMental]+'</b>. «Быстрый счёт»: <b>'+TIER_NAME[mainTrach]+'</b>. Коды тарифа «Комбо» открывают все четыре тренажёра сразу.</p><div class="row"><button type="button" class="btn ghost" data-v="plans">Тарифы и код доступа</button><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="trainer.html">Умножение</a><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="mental.html">Устный счёт</a><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="trahtenberg.html">Быстрый счёт</a></div></section>'
   +'<section class="card" style="margin-top:14px"><h3>Сохранить прогресс</h3><p class="small">Прогресс хранится в браузере этого устройства. Сохраните файл, чтобы перенести его на другое устройство.</p><div class="row"><button type="button" class="btn" id="exp">Экспортировать</button><label class="btn ghost" for="imp" style="cursor:pointer">Импортировать</label><input type="file" id="imp" accept="application/json,.json" hidden></div><div id="expmsg" class="small" aria-live="polite"></div></section>'
   +'<p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">К модулям</button></p>';
  $('#exp').onclick=function(){
    var txt=JSON.stringify(exportData(),null,1),msg=$('#expmsg');
    try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='abakus-progress-'+dayKey()+'.json';document.body.appendChild(a);a.click();a.remove();msg.textContent='Файл сохранён. Если он не появился в загрузках, скопируйте текст ниже.';}catch(e){msg.textContent='Не получилось сохранить файл. Скопируйте текст ниже.';}
    msg.insertAdjacentHTML('afterend','<textarea class="ans" style="width:100%;height:120px;font-size:13px" readonly>'+txt.replace(/</g,'&lt;')+'</textarea>');};
  $('#imp').onchange=function(){var f=this.files[0],msg=$('#expmsg');if(!f)return;if(f.size>2e6){msg.textContent='Файл слишком большой.';return;}
    var r=new FileReader();r.onload=function(){var o;try{o=JSON.parse(r.result);}catch(e){msg.textContent='Файл повреждён: это не JSON.';return;}
      if(!o||o.app!=='abakus'||!o.progress){msg.textContent='Это не файл прогресса «Ментальной арифметики».';return;}
      var n=adopt(o.progress);
      Object.keys(n.done).forEach(function(k){if(n.done[k])M.done[k]=true;});
      Object.keys(n.stars).forEach(function(k){M.stars[k]=Math.max(M.stars[k]||0,Number(n.stars[k])||0);});
      Object.keys(n.stats).forEach(function(k){var a=n.stats[k],b=M.stats[k]||(M.stats[k]={ok:0,bad:0});b.ok=Math.max(b.ok,Number(a.ok)||0);b.bad=Math.max(b.bad,Number(a.bad)||0);});
      Object.keys(n.rec).forEach(function(k){var a=n.rec[k];if(a&&a.best&&(!M.rec[k]||a.best<M.rec[k].best))M.rec[k]={best:a.best};});
      if(RANK[n.tier]>RANK[M.tier])M.tier=n.tier;
      save();msg.textContent='Готово. Прогресс объединён.';};
    r.onerror=function(){msg.textContent='Не удалось прочитать файл.';};r.readAsText(f);};}

/* ---------- тарифы и коды ---------- */
function sha256hex(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2);}).join('');});}
function applyTier(g){
  /* g: {mult, mental, trach, abak}. Свой тариф хранится здесь и дублируется в общую запись, чтобы его увидели остальные тренажёры. */
  if(g.abak&&RANK[g.abak]>RANK[M.tier]){M.tier=g.abak;save();}
  Store.get('progress').then(function(v){
    v=(v&&typeof v==='object')?v:{};
    var ch=false,ti=function(x){return RANK[x]||0;};
    if(g.abak&&ti(g.abak)>ti(v.tierAbak)){v.tierAbak=g.abak;ch=true;mainTier=g.abak;}
    if(g.trach&&ti(g.trach)>ti(v.tierTrach)){v.tierTrach=g.trach;ch=true;mainTrach=g.trach;}
    if(g.mental&&ti(g.mental)>ti(v.tierMental)){v.tierMental=g.mental;ch=true;mainMental=g.mental;}
    if(g.mult&&ti(g.mult)>ti(v.tierMult)){v.tierMult=g.mult;v.tier=g.mult;ch=true;mainMult=g.mult;}
    if(ch){v.adv=true;return Store.put('progress',v);}}).catch(function(){});}
function tryCode(code,msg,ok){
  if(!(window.crypto&&crypto.subtle)){msg.textContent='Проверка кода недоступна в этом браузере.';return;}
  if(!anyCodes()){msg.textContent='Коды доступа ещё не настроены.';return;}
  sha256hex(String(code).trim().toUpperCase()).then(function(hx){
    var g=codeGrant(hx);
    if(!g){msg.textContent='Код не подошёл. Проверьте, нет ли лишних символов.';return;}
    var nt=g.abak&&RANK[g.abak]>RANK[tier()]||g.trach&&RANK[g.trach]>RANK[mainTrach],nm=g.mental&&RANK[g.mental]>RANK[mainMental],nu=g.mult&&RANK[g.mult]>RANK[mainMult];
    if(!nt&&!nm&&!nu){msg.textContent='Этот код ничего не добавит: у вас уже открыт такой тариф или выше.';return;}
    applyTier(g);ok();}).catch(function(){msg.textContent='Не удалось проверить код.';});}
function rBuy(){
  var why=view.why||'plans',title,lead;
  if(why==='limit'){title='На сегодня всё!';lead='Бесплатный доступ: '+FREE_MIN+' минут занятий в день. Прогресс сохранён. Чтобы заниматься без ограничений, выберите «Ментальную арифметику» или «Комбо». Завтра бесплатные минуты появятся снова.';}
  else if(why==='block'){title='Модуль «'+(view.title||'')+'» входит в платные тарифы';lead='В бесплатной версии открыт первый модуль «Знакомство с абакусом». Остальные модули откроет тариф «Ментальная арифметика» или «Комбо». Оплата один раз, без подписки.';}
  else{title='Тарифы';lead='Бесплатная версия остаётся навсегда: модуль «Знакомство с абакусом» и задания на набор и чтение цифр до '+FREE_MIN+' минут в день. Платные тарифы оплачиваются один раз, без подписки. Коды «Комбо» открывают все четыре тренажёра сразу.';}
  app.innerHTML='<section class="card lift"><h1 style="margin:0 0 10px">'+title+'</h1><p class="lead">'+lead+'</p></section>'+tariffCols('abak')
   +'<section class="card" style="margin-top:14px"><h3>У меня есть код</h3><div class="answer"><input class="ans" style="width:14ch;font-size:24px" id="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Код доступа"><button type="button" class="btn" id="codego">Открыть доступ</button></div><p class="small" id="codemsg" aria-live="polite"></p><p class="small">Оплата проходит на странице платёжного сервиса. Здесь мы не просим данные карты, имя, почту или телефон. После оплаты на странице успеха появится код доступа. Введите его здесь.</p></section><p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">Назад</button></p>';
  var inp=$('#code'),msg=$('#codemsg');
  function go2(){tryCode(inp.value,msg,function(){go({name:'home'});});}
  $('#codego').onclick=go2;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)go2();};}

/* ---------- события и запуск ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-v],[data-start]');if(!t)return;
  if(t.hasAttribute('data-start')){startModule(t.getAttribute('data-start'));return;}
  var v=t.getAttribute('data-v');
  if(v==='plans'){go({name:'buy',why:'plans'});return;}
  go({name:v});});
function boot(){
  Store.get('abak').then(function(v){storage.mode='idb';if(v)M=adopt(v);})
   .catch(function(){storage.mode='memory';})
   .then(function(){return Store.get('progress').then(function(v){if(v){if(RANK[v.tierAbak]!==undefined)mainTier=v.tierAbak;if(RANK[v.tierTrach]!==undefined)mainTrach=v.tierTrach;if(RANK[v.tierMental]!==undefined)mainMental=v.tierMental;if(RANK[v.tierMult]!==undefined)mainMult=v.tierMult;else if(RANK[v.tier]!==undefined)mainMult=v.tier;}}).catch(function(){});})
   .then(function(){render();});}
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});}
boot();
})();

