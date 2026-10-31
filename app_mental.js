/* «Устный счёт»: тренажёр счёта в уме. Без сервера: прогресс хранится в браузере (IndexedDB).
   Тарифы и коды доступа общие с тренажёром умножения. */
(function(){'use strict';
function $(s,r){return (r||document).querySelector(s);}
function h(html){var t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[ri(0,a.length-1)];}
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function starsStr(n){return '★'.repeat(n)+'☆'.repeat(3-n);}

/* ---------- настройки (значения подставляет build.py из app.js) ---------- */
/*SHARED*/
var FREE_MIN=10;
var PRICE_STD='990 ₽',PRICE_PRO='1 990 ₽';
var PAY_URL_STD='https://example.com/pay?plan=standard';
var PAY_URL_PRO='https://example.com/pay?plan=pro';
var CODES_STD=["ca063870f27456c4764dc609ae1579f7a1fa8e6f497713a47ad4b90c98db7bb6"];
var CODES_PRO=["0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c","9617e38101e15005c55a48cf1116327a0bb611c344da66dce2799e30b954a446"];
/*ENDSHARED*/
var RANK={free:0,standard:1,pro:2},TIER_NAME={free:'Бесплатный',standard:'Стандарт',pro:'Продвинутый'};

/* ---------- тексты по типам примеров ---------- */
var TYPES={
  b10:{name:'Состав числа (до 10)',min:'standard'},
  add:{name:'Сложение без перехода'},
  addc:{name:'Сложение через десяток'},
  sub:{name:'Вычитание без занятия'},
  subc:{name:'Вычитание с переходом через десяток'},
  chg:{name:'Сдача в магазине'}};
var ALL_T=['b10','add','addc','sub','subc','chg'];

/* ---------- склонение ---------- */
function pl(n,o,f,m){n=Math.abs(n)%100;var d=n%10;if(n>10&&n<20)return m;if(d===1)return o;if(d>=2&&d<=4)return f;return m;}

/* ---------- хранение ---------- */
function fresh(){return {app:'ustny-schet',schemaVersion:1,done:{},stars:{},stats:{},sr:{},rec:{},days:{},alts:{},tier:'free',onboarded:false};}
var M=fresh(),mainTier='free',storage={mode:'init'};
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
  if(RANK[f.tier]===undefined)f.tier='free';f.app='ustny-schet';f.schemaVersion=1;return f;}
var saveT=null;
function flush(){saveT=null;if(storage.mode!=='idb')return;Store.put('mental',JSON.parse(JSON.stringify(M))).catch(function(){storage.mode='memory';});}
function save(){if(saveT)return;saveT=setTimeout(flush,250);}
document.addEventListener('visibilitychange',function(){if(document.hidden){if(saveT)clearTimeout(saveT);flush();}});
window.addEventListener('pagehide',function(){if(saveT)clearTimeout(saveT);flush();});
function tier(){var a=RANK[M.tier]||0,b=RANK[mainTier]||0;return a>=b?(M.tier||'free'):mainTier;}
function atLeast(t){return RANK[tier()]>=RANK[t];}
function addTime(sec){var k=dayKey();M.days[k]=(M.days[k]||0)+sec;save();}
function usedMin(){return Math.floor((M.days[dayKey()]||0)/60);}

/* ---------- генераторы примеров ---------- */
function exB10(){var a=ri(1,9);return {type:'b10',a:a,key:'b10-'+a};}
function exAdd(){var ta=ri(1,7),tb=ri(1,9-ta),ua=ri(1,8),ub=ri(1,9-ua);var a=ta*10+ua,b=tb*10+ub;return {type:'add',a:a,b:b,key:'add-'+a+'-'+b};}
function exAddc(){var ua=ri(2,9),ub=ri(10-ua,9),ta=ri(1,6),tb=ri(1,8-ta);var a=ta*10+ua,b=tb*10+ub;return {type:'addc',a:a,b:b,key:'addc-'+a+'-'+b};}
function exSub(){var ta=ri(3,9),tb=ri(1,ta-1),ua=ri(1,9),ub=ri(1,ua);var a=ta*10+ua,b=tb*10+ub;return {type:'sub',a:a,b:b,key:'sub-'+a+'-'+b};}
function exSubc(){var ta=ri(3,9),tb=ri(1,ta-1),ua=ri(0,7),ub=ri(ua+1,9);var a=ta*10+ua,b=tb*10+ub;return {type:'subc',a:a,b:b,key:'subc-'+a+'-'+b};}
var GOODS=['хлеб','молоко','сок','тетрадь','ручку','альбом','яблоки','булочку','линейку','пенал'];
function exChg(){var pay=pick([50,100,100]);var p=pay===100?ri(11,99):ri(11,49);if(p===pay)p--;return {type:'chg',price:p,pay:pay,item:pick(GOODS),key:'chg-'+pay+'-'+p};}
var GEN={b10:exB10,add:exAdd,addc:exAddc,sub:exSub,subc:exSubc,chg:exChg};
function gen(t){var e=GEN[t]();return e;}

function dig(n){return {t:Math.floor(n/10),u:n%10};}
function stepsFor(e){
  var a=e.a,b=e.b,A,B;
  if(e.type==='b10')return ['До 10 не хватает '+(10-a)+'.',a+' + '+(10-a)+' = 10'];
  if(e.type==='add'){A=dig(a);B=dig(b);return ['Десятки: '+A.t*10+' + '+B.t*10+' = '+(A.t+B.t)*10,'Единицы: '+A.u+' + '+B.u+' = '+(A.u+B.u),'Вместе: '+(A.t+B.t)*10+' + '+(A.u+B.u)+' = '+(a+b)];}
  if(e.type==='addc'){A=dig(a);var need=10-A.u,mid=a+need,rem=b-need;return ['Сделаем '+a+' круглым: до '+mid+' не хватает '+need+'.','Берём '+need+' из числа '+b+'. Остаётся '+rem+'.',mid+' + '+rem+' = '+(a+b)];}
  if(e.type==='sub'||e.type==='subc'){A=dig(a);B=dig(b);var x=a-B.t*10;
    if(e.type==='sub'||x%10>=B.u)return [a+' − '+B.t*10+' = '+x,x+' − '+B.u+' = '+(a-b)];
    var r=x%10,t=x-r-10,ones=10+r,k=ones-B.u,s=[a+' − '+B.t*10+' = '+x,'Занимаем десяток: '+x+' = '+t+' + '+ones,ones+' − '+B.u+' = '+k];
    if(t>0)s.push(t+' + '+k+' = '+(a-b));else s[s.length-1]+=' (это и есть ответ)';return s;}
  if(e.type==='chg'){var tt=Math.floor(e.price/10)*10,u=e.price%10,y=e.pay-tt,s2=[e.pay+' − '+tt+' = '+y];if(u)s2.push(y+' − '+u+' = '+(e.pay-e.price));return s2;}
  return [];}
function ansFor(e){return e.type==='b10'?10-e.a:(e.type==='add'||e.type==='addc'?e.a+e.b:(e.type==='chg'?e.pay-e.price:e.a-e.b));}

/* ---------- рисунки ---------- */
function homes(a){var s='<svg class="mviz" viewBox="0 0 300 70" role="img" aria-label="Десять клеток, закрашено '+a+'">';
  for(var i=0;i<10;i++){var x=6+i*29;s+='<rect x="'+x+'" y="14" width="25" height="34" rx="6" class="'+(i<a?'mv-b':'mv-g')+'"/>';}
  s+='<text x="'+(6+a*29/2)+'" y="66" class="mv-t" text-anchor="middle">'+a+'</text>'+(a<10?'<text x="'+(6+a*29+(10-a)*29/2)+'" y="66" class="mv-t" text-anchor="middle">'+(10-a)+' ?</text>':'')+'</svg>';return s;}
function numlineInner(pts,labs,W,Hh){
  var mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),sp=mx-mn||1,y=Hh*0.62,s='';
  function X(v){return 24+(v-mn)/sp*(W-48);}
  s+='<line x1="8" y1="'+y+'" x2="'+(W-8)+'" y2="'+y+'" class="mv-l"/>';
  for(var i=0;i<pts.length-1;i++){var x1=X(pts[i]),x2=X(pts[i+1]),mid=(x1+x2)/2,top=y-Math.min(46,16+Math.abs(x2-x1)*0.28);
    s+='<path d="M'+x1+' '+y+' Q'+mid+' '+(top-Hh*0.08)+' '+x2+' '+y+'" class="mv-a'+(i%2)+'"/><text x="'+mid+'" y="'+(top-4)+'" class="mv-t" text-anchor="middle">'+labs[i]+'</text>';}
  for(var j=0;j<pts.length;j++){s+='<circle cx="'+X(pts[j])+'" cy="'+y+'" r="4.5" class="mv-b"/><text x="'+X(pts[j])+'" y="'+(y+20)+'" class="mv-t" text-anchor="middle">'+pts[j]+'</text>';}
  return s;}
function numline(pts,labs){return '<svg class="mviz" viewBox="0 0 300 100" role="img" aria-label="Числовая лента: '+pts.join(', ')+'">'+numlineInner(pts,labs,300,100)+'</svg>';}
/* блоки: десятки столбиками, единицы квадратиками; gone — сколько десятков и единиц убрано, mark — жёлтые единицы */
function blocks(n,o){o=o||{};var d=dig(n),w=d.t*17+(d.u?44:0)+10,s='<svg class="mviz mviz-s" viewBox="0 0 '+Math.max(w,60)+' 74" role="img" aria-label="'+n+': '+d.t+' '+pl(d.t,'десяток','десятка','десятков')+' и '+d.u+' '+pl(d.u,'единица','единицы','единиц')+'">';
  var gone=o.goneT||0,i,j;
  for(i=0;i<d.t;i++){var x=4+i*17;for(j=0;j<10;j++)s+='<rect x="'+x+'" y="'+(4+j*6.4)+'" width="13" height="5.2" rx="1.5" class="'+(i>=d.t-gone?'mv-x':'mv-b')+'"/>';}
  var ux=4+d.t*17+4;
  for(i=0;i<d.u;i++){var col=i%2,row=Math.floor(i/2),isMark=(o.mark&&i>=d.u-o.mark),isGone=(o.goneU&&i>=d.u-o.goneU);
    s+='<rect x="'+(ux+col*19)+'" y="'+(4+row*13)+'" width="15" height="11" rx="2.5" class="'+(isMark?'mv-y':(isGone?'mv-x':'mv-b2'))+'"/>';}
  return s+'</svg>';}

/* ---------- объяснения: три варианта на шаг ---------- */
var VNAME=['Через предметы','Числовая лента','Разложение'];
function p(t){return '<p>'+t+'</p>';}
function lines(arr){return '<p class="mono">'+arr.join('<br>')+'</p>';}
function explain(e,vi){
  var st=stepsFor(e),A,B,k;
  if(e.type==='b10'){k=10-e.a;
    if(vi===0)return p('В этом доме 10 окошек. Свет горит в '+e.a+'. Сколько окошек ещё нужно зажечь, чтобы были заняты все десять?')+homes(e.a)+p('Свободно '+k+'. Значит, '+e.a+' + '+k+' = 10.');
    if(vi===1)return p('Идём по ленте от '+e.a+' до 10. Считаем прыжок.')+numline([e.a,10],['+'+k])+p('Прыжок '+k+'. Значит, '+e.a+' + '+k+' = 10.');
    return p('Число 10 можно «разобрать» на две части. Одна часть '+e.a+', а вторая — недостающая.')+lines(['10 = '+e.a+' + '+k,'10 = '+k+' + '+e.a])+p('Эти два числа — пара. Запомни пару, и всегда найдёшь вторую.');}
  if(e.type==='add'){A=dig(e.a);B=dig(e.b);
    if(vi===0)return p('Складываем десятки с десятками, а единицы с единицами.')+'<div class="mrow">'+blocks(e.a)+'<span class="mop">+</span>'+blocks(e.b)+'</div>'+lines(st);
    if(vi===1)return p('Прыгаем по ленте: сначала прибавим десятки, потом единицы.')+numline([e.a,e.a+B.t*10,e.a+e.b],['+'+B.t*10,'+'+B.u])+lines(st);
    return p('Разложим числа на десятки и единицы.')+lines([e.a+' = '+A.t*10+' + '+A.u,e.b+' = '+B.t*10+' + '+B.u])+lines(st);}
  if(e.type==='addc'){A=dig(e.a);var need=10-A.u,mid=e.a+need,rem=e.b-need;
    if(vi===0)return p('В числе '+e.a+' не хватает '+need+' до круглого. Возьмём эти '+need+' из числа '+e.b+' (жёлтые квадратики).')+'<div class="mrow">'+blocks(e.a)+'<span class="mop">+</span>'+blocks(e.b,{mark:need})+'</div>'+lines(st);
    if(vi===1)return p('Как сделать '+e.a+' круглым? Нужно '+need+'. Где взять '+need+'? Отщипнём от '+e.b+'. Останется '+rem+'.')+numline([e.a,mid,e.a+e.b],['+'+need,'+'+rem])+lines(st);
    return p('Разложим второе число: '+e.b+' = '+need+' + '+rem+'.')+lines([e.a+' + '+need+' = '+mid,mid+' + '+rem+' = '+(e.a+e.b)])+p('Сначала достроили до десятка, потом прибавили остаток.');}
  if(e.type==='sub'||e.type==='subc'){A=dig(e.a);B=dig(e.b);var x=e.a-B.t*10;
    if(vi===0)return p('Из '+e.a+' уберём '+B.t+' '+pl(B.t,'десяток','десятка','десятков')+' и ещё '+B.u+' '+pl(B.u,'единицу','единицы','единиц')+'. Убранное выцветает.')+blocks(e.a,{goneT:B.t,goneU:(x%10>=B.u?B.u:0)})+lines(st);
    if(vi===1)return p('Идём назад по ленте: сначала на '+B.t*10+', потом на '+B.u+'.')+numline([e.a,x,e.a-e.b],['−'+B.t*10,'−'+B.u])+lines(st);
    return p('Вычитаем по частям. Число '+e.b+' разложим: '+e.b+' = '+B.t*10+' + '+B.u+'.')+lines(st);}
  return '';}

/* ---------- вопрос по примеру ---------- */
function mkQ(e){
  var q={e:e,type:e.type,key:e.key,ans:ansFor(e)};
  if(e.type==='b10'){q.lead='Сколько не хватает до 10?';q.eq=e.a+' + ? = 10';q.vis=homes(e.a);}
  else if(e.type==='chg'){q.lead='Покупаем '+e.item+'. Товар стоит '+e.price+' ₽, даём '+e.pay+' ₽. Сколько сдачи?';q.eq='Сдача: ?';}
  else{q.lead=e.type==='add'||e.type==='addc'?'Сложи в уме.':'Вычти в уме.';q.eq=e.a+(e.type==='add'||e.type==='addc'?' + ':' − ')+e.b+' = ?';}
  q.steps=stepsFor(e);return q;}

/* ---------- модули ---------- */
var MODS=[
 {id:'n1',tag:'10 = 7 + 3',title:'Состав числа',sub:'Дополняем до 10',type:'b10',need:'free',canon:{type:'b10',a:7,key:'b10-7'},art:['#2B59E6','#5B7FF0']},
 {id:'n2',tag:'23 + 45',title:'Сложение без перехода',sub:'Десятки и единицы',type:'add',need:'standard',canon:{type:'add',a:23,b:45,key:'add-23-45'},art:['#0E8F6A','#2FC79A']},
 {id:'n3',tag:'47 + 28',title:'Сложение через десяток',sub:'Достраиваем до круглого',type:'addc',need:'standard',canon:{type:'addc',a:47,b:28,key:'addc-47-28'},art:['#7A2FC4','#B05CF0']},
 {id:'n4',tag:'80 − 34',title:'Вычитание по частям',sub:'Сначала десятки, потом единицы',type:'sub',need:'standard',canon:{type:'subc',a:80,b:34,key:'subc-80-34'},art:['#C2255C','#FF6F91']}];
function modById(id){for(var i=0;i<MODS.length;i++)if(MODS[i].id===id)return MODS[i];return null;}
function locked(m){return !atLeast(m.need);}
function lockSvg(){return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';}
function modArt(m){
  var inner='';
  if(m.id==='n1'){for(var i=0;i<10;i++)inner+='<rect x="'+(18+i*26)+'" y="26" width="22" height="30" rx="5" class="'+(i<7?'mv-b':'mv-g')+'"/>';inner+='<text x="150" y="90" class="mv-t2" text-anchor="middle">7 + 3 = 10</text>';}
  else if(m.id==='n2')inner='<text x="80" y="52" class="mv-t2" text-anchor="middle">23 + 45</text><text x="80" y="82" class="mv-t3" text-anchor="middle">20+40, 3+5</text><text x="225" y="62" class="mv-t2" text-anchor="middle">= 68</text>';
  else if(m.id==='n3')inner='<g transform="translate(0 8)">'+numlineInner([47,50,75],['+3','+25'],300,100)+'</g>';
  else inner='<g transform="translate(0 8)">'+numlineInner([80,50,46],['−30','−4'],300,100)+'</g>';
  return '<svg class="modart" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false"><defs><linearGradient id="mg-'+m.id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+m.art[0]+'"/><stop offset="1" stop-color="'+m.art[1]+'"/></linearGradient></defs><rect x="-300" y="-200" width="900" height="520" fill="url(#mg-'+m.id+')"/><circle cx="270" cy="10" r="46" fill="#fff" opacity=".1"/><g class="mart">'+inner+'</g></svg>';}

/* ---------- состояние экрана ---------- */
var app=$('#app'),view={name:'home'},R=null,tick=null,lastTick=0;
function startTimer(){stopTimer();lastTick=Date.now();tick=setInterval(function(){if(document.hidden){lastTick=Date.now();return;}var n=Date.now();var d=Math.min(10,Math.round((n-lastTick)/1000));lastTick=n;if(d>0)addTime(d);},5000);}
function stopTimer(){if(tick){clearInterval(tick);tick=null;}}
function go(v){stopTimer();view=v;R=null;render();window.scrollTo(0,0);}
function render(){
  if(tier()==='free'&&(view.name==='train')&&usedMin()>=FREE_MIN&&!view.run){view={name:'buy',why:'limit'};}
  ({home:rHome,lesson:rRun,train:rTrain,shop:rShop,parent:rParent,buy:rBuy,done:rDone,sum:rSum})[view.name]();
  var cur={lesson:'home',done:'home',sum:(view.mode==='shop'?'shop':'train')}[view.name]||view.name;
  Array.prototype.forEach.call(document.querySelectorAll('.nav button[data-v]'),function(b){if(b.getAttribute('data-v')===cur)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}

/* ---------- запись результата ---------- */
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
  var next=null;for(var i=0;i<MODS.length;i++){if(!M.done[MODS[i].id]&&!locked(MODS[i])){next=MODS[i];break;}}
  var cards=MODS.map(function(m,i){var d=M.done[m.id],lk=locked(m);
    var st=d?'<span class="stars" aria-label="'+(M.stars[m.id]||2)+' из 3">'+starsStr(M.stars[m.id]||2)+'</span> пройдено':(lk?lockSvg()+'Стандарт и выше':(next&&next.id===m.id?'Следующий':'Новое'));
    return '<button type="button" class="mod'+(d?' done':'')+'" data-start="'+m.id+'">'+modArt(m)+'<span class="mod-n">Модуль '+(i+1)+'</span><span class="mod-tag">'+m.tag+'</span><span class="mod-t">'+m.title+'</span><span class="mod-s">'+st+'</span></button>';}).join('');
  var today=next?'<div><b>Сегодня: модуль '+(MODS.indexOf(next)+1)+'</b><span>'+next.title+'. Хватит 5–10 минут.</span></div><button type="button" class="btn" data-start="'+next.id+'">'+(Object.keys(M.done).length?'Продолжить':'Начать')+'</button>'
    :'<div><b>Все доступные модули пройдены</b><span>Тренажёр подберёт примеры, которые пока даются труднее.</span></div><button type="button" class="btn" data-v="train">В тренажёр</button>';
  var free=tier()==='free'?'<section class="note" style="margin-top:14px"><h3>Бесплатный доступ</h3><p>Открыт модуль «Состав числа» и тренажёр на состав числа: до '+FREE_MIN+' '+pl(FREE_MIN,'минуты','минут','минут')+' в день, сегодня осталось '+Math.max(0,FREE_MIN-usedMin())+' мин. Остальные модули и игру «Дай сдачу» откроет Стандарт.</p><button type="button" class="btn" data-v="plans">Посмотреть тарифы</button></section>':'';
  app.innerHTML='<section class="card lift"><p class="kicker">Считаем в уме</p><h1>Устный счёт</h1><p class="lead" style="margin-top:12px">Сначала понимаем приём, потом тренируем. В каждом модуле коротко показываем, как считать быстро: разложить числа, достроить до десятка, пройтись по числовой ленте. Не понял? Нажми «Объясни по-другому».</p><div class="today">'+today+'</div></section>'+free
   +'<h2>Модули</h2><div class="mods">'+cards+'</div><h2>Ещё</h2><div class="mods">'
   +'<button type="button" class="mod" data-v="train"><span class="mod-tag">Тренажёр</span><span class="mod-s">Примеры подбираются под тебя'+(tier()==='free'?' · '+lockSvg()+'только состав числа':'')+'</span></button>'
   +'<button type="button" class="mod" data-v="shop"><span class="mod-tag">Дай сдачу</span><span class="mod-s">'+(atLeast('standard')?'Игра в магазин: сколько сдачи?':lockSvg()+'Стандарт и выше')+'</span></button></div>'
   +'<p class="small" style="margin-top:18px">Хорошо заниматься по 5–10 минут каждый день. Таймера на вопросах нет: скорость придёт после понимания.</p>';}

/* ---------- урок ---------- */
function startModule(id){
  var m=modById(id);if(!m)return;
  if(locked(m)){view={name:'buy',why:'block',title:m.title};render();return;}
  var items=[{kind:'explain',e:m.canon,v:0},{kind:'explain',e:gen(m.id==='n4'?'sub':m.type),v:0}];
  var seq=[];for(var i=0;i<4;i++)seq.push(m.id==='n4'?(i%2?'sub':'subc'):m.type);
  seq.forEach(function(t){items.push({kind:'ask',q:mkQ(gen(t)),phase:'Тренируемся',test:false,w:0});});
  var tt=[];for(var j=0;j<3;j++)tt.push(m.id==='n4'?(j%2?'sub':'subc'):m.type);
  tt.forEach(function(t){items.push({kind:'ask',q:mkQ(gen(t)),phase:'Проверка',test:true,w:0});});
  R={mod:m,items:items,i:0,mode:'lesson'};view={name:'lesson'};startTimer();render();window.scrollTo(0,0);}
function barHtml(){var s='';R.items.forEach(function(_,i){s+='<i class="'+(i<R.i?'on':(i===R.i?'now':''))+'"></i>';});return '<div class="bar" aria-hidden="true">'+s+'</div>';}
function rRun(){
  if(!R){go({name:'home'});return;}
  if(R.i>=R.items.length){finishModule();return;}
  var it=R.items[R.i];app.innerHTML='';
  if(it.kind==='explain')rExplain(it);else rAsk(it);}
function rExplain(it){
  var card=h('<section class="card lift"></section>');
  function paint(){
    var vi=it.v%3;
    card.innerHTML=barHtml()+'<div class="phase">'+(R.i===0?'Узнаём':'Ещё пример')+' · '+VNAME[vi]+'</div><h2 style="margin:0 0 8px">'+R.mod.title+'</h2><div id="expl" class="expl">'+explain(it.e,vi)+'</div><p class="small">Объяснение '+(vi+1)+' из 3</p><div class="row"></div>';
    var rw=$('.row',card);
    if(R.i>0){var b=h('<button type="button" class="btn ghost">Назад</button>');b.onclick=function(){R.i--;render();};rw.appendChild(b);}
    var al=h('<button type="button" class="btn ghost alt">Объясни по-другому</button>');al.onclick=function(){it.v++;M.alts[R.mod.id]=(M.alts[R.mod.id]||0)+1;save();paint();};rw.appendChild(al);
    var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);}
  paint();app.appendChild(card);}

/* ---------- вопрос с ответом ---------- */
function stepsHtml(q){return '<div class="hint"><p><b>Решение по шагам</b></p>'+lines(q.steps)+'</div>';}
function rAsk(it){
  var q=it.q;q.first=true;var t0=Date.now();
  var card=h('<section class="card lift"></section>');
  var head=R.mode==='lesson'?barHtml()+'<div class="phase">'+it.phase+'</div>':'<div class="phase">'+(R.mode==='shop'?'Дай сдачу '+(R.i+1)+' из '+R.items.length:(R.mode==='train'?'Тренажёр '+(R.i+1)+' из '+R.items.length:''))+'</div>';
  card.innerHTML=head+'<p class="ask-lead">'+q.lead+'</p>'+(q.vis||'')+'<div class="eq">'+q.eq+'</div><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div><div id="fb" aria-live="polite"></div><div class="row" style="margin-top:14px"></div>';
  app.appendChild(card);
  var inp=$('#ans',card),chk=$('#chk',card),fb=$('#fb',card),rw=$('.row',card);
  inp.focus({preventScroll:true});
  var showBtn=null;
  function next(){R.i++;render();window.scrollTo(0,0);}
  function addShow(){if(showBtn||it.test&&!it.done)return;showBtn=h('<button type="button" class="btn ghost">Покажи решение по шагам</button>');showBtn.onclick=function(){fb.insertAdjacentHTML('beforeend',stepsHtml(q));showBtn.remove();};rw.appendChild(showBtn);}
  function done(ok,msg){
    it.done=true;inp.disabled=true;chk.textContent='Дальше';chk.disabled=false;chk.onclick=next;chk.focus();
    if(it.test&&R.mode==='lesson'){R.testN=(R.testN||0)+1;if(ok&&q.first)R.testOk=(R.testOk||0)+1;}
    fb.innerHTML=msg;}
  function check(){
    if(it.done)return;
    var raw=String(inp.value).trim();if(raw===''||isNaN(Number(raw))){fb.innerHTML='<div class="fb try"><strong>Введи число.</strong></div>';return;}
    var v=Number(raw);
    if(v===q.ans){
      var ms=Date.now()-t0;recordResult(q,q.first,ms);
      var rec=M.rec[q.type],extra='';
      if(q.first&&R.mode!=='lesson'){var sec=Math.max(1,Math.round(ms/1000));extra='<span>За '+sec+' с.'+(rec&&rec.best===ms?' Новый личный рекорд!':(rec?' Твой рекорд: '+Math.max(1,Math.round(rec.best/1000))+' с.':''))+'</span>';}
      done(true,'<div class="fb ok"><strong>'+pick(['Верно!','Да, точно!','Правильно!','Отлично!'])+'</strong>'+extra+'</div>');return;}
    it.w++;q.first=false;
    if(it.test||it.w>=2){
      recordResult(q,false,0);
      done(false,'<div class="fb try"><strong>'+(it.w>=2&&!it.test?'Ничего страшного.':'Пока не получилось.')+' Правильный ответ: '+q.ans+'.</strong>'+stepsHtml(q)+'<span>Этот пример мы ещё повторим.</span></div>');
      if(R.mode==='train'&&R.queue)R.queue.push(q.e);return;}
    fb.innerHTML='<div class="fb try"><strong>'+pick(['Почти. Давай посмотрим вместе.','Тут легко запутаться. Смотри.','Хорошая попытка. Вот подсказка.'])+'</strong><div class="hint">'+q.steps[0]+'</div><span>Попробуй ещё раз.</span></div>';
    addShow();inp.value='';inp.focus();}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)(chk.textContent==='Дальше')?next():check();};}

function finishModule(){
  stopTimer();var m=R.mod,n=R.testN||3,ok=R.testOk||0;
  var st=ok>=n?3:(ok>=Math.ceil(n*2/3)?2:1);
  M.done[m.id]=true;M.stars[m.id]=Math.max(M.stars[m.id]||0,st);save();
  view={name:'done',id:m.id,ok:ok,n:n,st:st};render();}
function rDone(){
  var m=modById(view.id),idx=MODS.indexOf(m),nx=MODS[idx+1];
  app.innerHTML='<section class="card lift"><div class="phase">Модуль пройден</div><div class="big-stars" aria-label="'+view.st+' из 3">'+starsStr(view.st)+'</div><h2 style="margin:14px 0 10px">'+(view.st>=2?'Ты освоил приём':'Хорошее начало')+'</h2><p>В проверке с первого раза верно: '+view.ok+' из '+view.n+'. '+(view.st<3?'Пример, где была ошибка, вернётся в тренажёре.':'')+'</p><p class="small">Чтобы приём закрепился, вернись к нему в тренажёре завтра.</p><div class="row">'+(nx&&!locked(nx)?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий модуль</button>':(nx?'<button type="button" class="btn" data-v="plans">Открыть следующий модуль</button>':''))+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';}

/* ---------- тренажёр: адаптивный подбор ---------- */
function availTypes(){return tier()==='free'?['b10']:ALL_T.filter(function(t){return t!=='chg';});}
function pickType(types){var w=types.map(function(t){return 1+4*badRate(t);}),sum=w.reduce(function(a,b){return a+b;},0),r=Math.random()*sum;for(var i=0;i<types.length;i++){r-=w[i];if(r<=0)return types[i];}return types[0];}
function startTrain(){
  if(tier()==='free'&&usedMin()>=FREE_MIN){view={name:'buy',why:'limit'};render();return;}
  var types=availTypes(),items=[],due=[];
  if(tier()==='pro'){var now=Date.now();Object.keys(M.sr).forEach(function(k){var s=M.sr[k];if(s&&s.e&&s.due<=now)due.push(s.e);});due=due.slice(0,3);}
  due.forEach(function(e){items.push({kind:'ask',q:mkQ(e),phase:'Повторение',test:false,w:0});});
  while(items.length<10)items.push({kind:'ask',q:mkQ(gen(pickType(types))),phase:'Тренажёр',test:false,w:0});
  R={mode:'train',items:items,i:0,queue:[],repeated:false,firstOk:0};view={name:'train'};startTimer();render();}
function rTrain(){
  if(R&&R.mode==='train'){rRun();return;}
  var weak=ALL_T.filter(function(t){return badRate(t)>=0.3;}).map(function(t){return TYPES[t].name;});
  var sr=Object.keys(M.sr).length;
  app.innerHTML='<section class="card lift"><p class="kicker">5–10 минут в день</p><h1>Тренажёр</h1><p class="lead" style="margin-top:12px">Около десяти примеров. Таймера на вопросах нет: мы лишь запоминаем твоё лучшее время. Если пример не получился, он вернётся позже.</p>'
   +(weak.length?'<p>Чаще попадутся: <b>'+weak.join(', ')+'</b>.</p>':'<p class="small">Пока мы изучаем, что тебе даётся легко, а что труднее.</p>')
   +(atLeast('pro')?'<p class="small">Примеров на повторении: '+sr+'. Они возвращаются через 1, 3, 7 и 14 дней.</p>':(atLeast('standard')?'<p class="small">Примеры, которые не получились, возвращаются чаще. Повторение через 1, 3, 7 дней входит в тариф «Продвинутый».</p>':'<p class="small">В бесплатной версии тренажёр даёт примеры на состав числа, до '+FREE_MIN+' минут в день. Остальные типы откроет Стандарт.</p>'))
   +'<div class="row"><button type="button" class="btn" id="go">Начать</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';
  $('#go').onclick=startTrain;}
function rSum(){
  var wk=view.weak||[];
  app.innerHTML='<section class="card lift"><div class="phase">Итог</div><h2 style="margin:0 0 10px">'+(view.mode==='shop'?'Покупки закончились':'Тренировка закончена')+'</h2><p>С первого раза верно: <b>'+view.ok+' из '+view.n+'</b>.</p>'
   +(wk.length?'<p>Эти примеры мы покажем чаще:</p><p class="mono">'+wk.join('<br>')+'</p>':'<p>Все примеры получились. Так держать.</p>')
   +'<div class="row"><button type="button" class="btn" data-v="'+(view.mode==='shop'?'shop':'train')+'">Ещё раз</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';}
function finishRun(){
  stopTimer();var ok=0,wk=[];
  R.items.forEach(function(it){if(it.kind==='ask'){if(it.done&&it.w===0)ok++;else if(it.w>0){var e=it.q.e;wk.push(e.type==='chg'?(e.pay+' − '+e.price):(e.type==='b10'?(e.a+' + ? = 10'):(e.a+(e.type==='add'||e.type==='addc'?' + ':' − ')+e.b)));}}});
  view={name:'sum',mode:R.mode,ok:ok,n:R.items.length,weak:wk.slice(0,6)};R=null;render();}

/* ---------- игра «Дай сдачу» ---------- */
function startShop(){
  if(!atLeast('standard')){view={name:'buy',why:'feature',title:'Игра «Дай сдачу»',need:'standard'};render();return;}
  var items=[];for(var i=0;i<5;i++){var q=mkQ(gen('chg'));items.push({kind:'ask',q:q,phase:'Магазин',test:false,w:0});}
  R={mode:'shop',items:items,i:0};view={name:'shop'};startTimer();render();}
function rShop(){
  if(R&&R.mode==='shop'){rRun();return;}
  if(!atLeast('standard')){view={name:'buy',why:'feature',title:'Игра «Дай сдачу»',need:'standard'};rBuy();return;}
  app.innerHTML='<section class="card lift"><p class="kicker">Игра</p><h1>Дай сдачу</h1><p class="lead" style="margin-top:12px">Ты продавец. Покупатель платит купюрой, а ты считаешь сдачу в уме. Например, товар стоит 67 ₽, дали 100 ₽. Если ошибёшься, мы покажем, как считать по шагам: 100 − 60 = 40, потом 40 − 7 = 33.</p><div class="row"><button type="button" class="btn" id="go">Открыть магазин</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';
  $('#go').onclick=startShop;}
var _rRun=rRun;
rRun=function(){
  if(!R){go({name:'home'});return;}
  if(R.mode==='train'||R.mode==='shop'){
    if(R.mode==='train'&&tier()==='free'&&usedMin()>=FREE_MIN&&R.i>0){stopTimer();view={name:'buy',why:'limit'};R=null;render();return;}
    if(R.i>=R.items.length){
      if(R.mode==='train'&&!R.repeated&&R.queue.length){R.repeated=true;R.queue.slice(0,3).forEach(function(e){R.items.push({kind:'ask',q:mkQ(e),phase:'Повторим',test:false,w:0});});}
      else{finishRun();return;}}
    app.innerHTML='';rAsk(R.items[R.i]);return;}
  _rRun();};

/* ---------- кабинет родителя ---------- */
function exportData(){return {app:'ustny-schet',schemaVersion:1,exportedAt:new Date().toISOString(),progress:JSON.parse(JSON.stringify(M))};}
function rParent(){
  var rows=ALL_T.map(function(t){var s=M.stats[t]||{ok:0,bad:0},tot=s.ok+s.bad,rec=M.rec[t];return '<div><span>'+TYPES[t].name+'</span><b>'+(tot?Math.round(100*s.ok/tot)+'% верно · '+tot+' '+pl(tot,'пример','примера','примеров'):'пока нет данных')+(rec?' · рекорд '+Math.max(1,Math.round(rec.best/1000))+' с':'')+'</b></div>';}).join('');
  var mins=Math.round((M.days[dayKey()]||0)/60);
  app.innerHTML='<section class="card lift"><p class="kicker">Родителям</p><h1>Прогресс по устному счёту</h1><p class="lead" style="margin-top:12px">Занятия сегодня: '+mins+' мин. Лучше 5–10 минут каждый день, чем час раз в неделю.</p></section>'
   +'<section class="card" style="margin-top:14px"><h3>Модули</h3><div class="bars">'+MODS.map(function(m){return '<div><span>'+m.title+'</span><b>'+(M.done[m.id]?starsStr(M.stars[m.id]||1):(locked(m)?'закрыт':'не пройден'))+'</b></div>';}).join('')+'</div></section>'
   +'<section class="card" style="margin-top:14px"><h3>Над чем поработать</h3><div class="bars">'+rows+'</div><p class="small">Примеры, которые давались трудно, тренажёр показывает чаще. «Верно» считается по всем попыткам.</p></section>'
   +'<section class="card" style="margin-top:14px"><h3>Доступ</h3><p class="small">Сейчас открыт тариф: <b>'+TIER_NAME[tier()]+'</b>. Тарифы и коды общие с тренажёром умножения.</p><div class="row"><button type="button" class="btn ghost" data-v="plans">Тарифы и код доступа</button><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="trainer.html">Тренажёр умножения</a></div></section>'
   +'<section class="card" style="margin-top:14px"><h3>Сохранить прогресс</h3><p class="small">Прогресс хранится в браузере этого устройства. Сохраните файл, чтобы перенести его на другое устройство.</p><div class="row"><button type="button" class="btn" id="exp">Экспортировать</button><label class="btn ghost" for="imp" style="cursor:pointer">Импортировать</label><input type="file" id="imp" accept="application/json,.json" hidden></div><div id="expmsg" class="small" aria-live="polite"></div></section>'
   +'<p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">К модулям</button></p>';
  $('#exp').onclick=function(){
    var txt=JSON.stringify(exportData(),null,1),msg=$('#expmsg');
    try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='ustny-schet-progress-'+dayKey()+'.json';document.body.appendChild(a);a.click();a.remove();msg.textContent='Файл сохранён. Если он не появился в загрузках, скопируйте текст ниже.';}catch(e){msg.textContent='Не получилось сохранить файл. Скопируйте текст ниже.';}
    msg.insertAdjacentHTML('afterend','<textarea class="ans" style="width:100%;height:120px;font-size:13px" readonly>'+txt.replace(/</g,'&lt;')+'</textarea>');};
  $('#imp').onchange=function(){var f=this.files[0],msg=$('#expmsg');if(!f)return;if(f.size>2e6){msg.textContent='Файл слишком большой.';return;}
    var r=new FileReader();r.onload=function(){var o;try{o=JSON.parse(r.result);}catch(e){msg.textContent='Файл повреждён: это не JSON.';return;}
      if(!o||o.app!=='ustny-schet'||!o.progress){msg.textContent='Это не файл прогресса «Устного счёта».';return;}
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
function applyTier(t){
  M.tier=t;save();
  /* общий тариф: обновляем и запись тренажёра умножения, если она уже есть */
  Store.get('progress').then(function(v){if(v&&typeof v==='object'&&RANK[t]>(RANK[v.tier]||0)){v.tier=t;v.adv=true;return Store.put('progress',v);}}).catch(function(){});}
function tryCode(code,msg,ok){
  if(!(window.crypto&&crypto.subtle)){msg.textContent='Проверка кода недоступна в этом браузере.';return;}
  if(!CODES_STD.length&&!CODES_PRO.length){msg.textContent='Коды доступа ещё не настроены.';return;}
  sha256hex(String(code).trim().toUpperCase()).then(function(hx){
    var t=CODES_PRO.indexOf(hx)>=0?'pro':(CODES_STD.indexOf(hx)>=0?'standard':null);
    if(!t){msg.textContent='Код не подошёл. Проверьте, нет ли лишних символов.';return;}
    if(RANK[t]<=RANK[tier()]){msg.textContent='Этот код ничего не добавит: у вас уже открыт тариф «'+TIER_NAME[tier()]+'».';return;}
    applyTier(t);ok();}).catch(function(){msg.textContent='Не удалось проверить код.';});}
function planHtml(name,price,url,items,pro){
  return '<div class="plan'+(pro?' pro':'')+'"><h3>'+name+'</h3><p class="price">'+price+' <span class="small">один раз</span></p><ul>'+items.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul><a class="btn'+(pro?'':' ghost')+'" href="'+url+'" rel="noopener" target="_blank">Купить '+name+'</a></div>';}
function rBuy(){
  var why=view.why||'plans',title,lead;
  if(why==='limit'){title='На сегодня всё!';lead='Бесплатный доступ: '+FREE_MIN+' минут занятий в день. Прогресс сохранён. Чтобы заниматься без ограничений, выберите Стандарт. Завтра бесплатные минуты появятся снова.';}
  else if(why==='feature'){title=(view.title||'Эта возможность')+' входит в тариф «'+(view.need==='pro'?'Продвинутый':'Стандарт')+'»';lead='Сначала можно пользоваться бесплатной версией, потом открыть нужный тариф. Оплата один раз, без подписки.';}
  else if(why==='block'){title='Модуль «'+(view.title||'')+'» входит в платные тарифы';lead='В бесплатной версии открыт модуль «Состав числа». Остальные модули откроет Стандарт или Продвинутый.';}
  else{title='Тарифы';lead='Бесплатная версия остаётся навсегда: модуль «Состав числа» и тренажёр на состав числа до '+FREE_MIN+' минут в день. Платные тарифы оплачиваются один раз, без подписки. Тарифы и коды общие с тренажёром умножения.';}
  app.innerHTML='<section class="card lift"><h1 style="margin:0 0 10px">'+title+'</h1><p class="lead">'+lead+'</p></section><div class="plans">'
   +planHtml('Стандарт',PRICE_STD,PAY_URL_STD,['Все четыре модуля','Тренажёр без ограничения по времени','Игра «Дай сдачу»','Сложные примеры возвращаются чаще','Все возможности тренажёра умножения для Стандарта'],false)
   +planHtml('Продвинутый',PRICE_PRO,PAY_URL_PRO,['Всё из тарифа «Стандарт»','Повторения примеров через 1, 3, 7, 14 дней','Расширенный отчёт для родителя','Все возможности тренажёра умножения для Продвинутого'],true)+'</div>'
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
  if(v==='shop'){if(!atLeast('standard')){go({name:'buy',why:'feature',title:'Игра «Дай сдачу»',need:'standard'});return;}go({name:'shop'});return;}
  go({name:v});});
function boot(){
  Store.get('mental').then(function(v){storage.mode='idb';if(v)M=adopt(v);})
   .catch(function(){storage.mode='memory';})
   .then(function(){return Store.get('progress').then(function(v){if(v&&RANK[v.tier]!==undefined)mainTier=v.tier;}).catch(function(){});})
   .then(function(){render();});}
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});}
boot();
})();
