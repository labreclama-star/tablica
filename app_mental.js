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

/* ---------- тексты по типам примеров ---------- */
var TYPES={
  b10:{name:'Состав числа (до 10)',min:'standard'},
  add:{name:'Сложение без перехода'},
  addc:{name:'Сложение через десяток'},
  sub:{name:'Вычитание без занятия'},
  subc:{name:'Вычитание с переходом через десяток'},
  chg:{name:'Сдача в магазине'},
  a20:{name:'Сложение до 20 через десяток'},
  s20:{name:'Вычитание до 20 через десяток'},
  b100:{name:'Дополнение до 100'},
  near:{name:'Прибавить и вычесть 9, 8, 19'},
  addh:{name:'Сложение через сотню'}};
var ALL_T=['b10','a20','s20','add','addc','sub','subc','b100','near','addh','chg'];

/* ---------- склонение ---------- */
function pl(n,o,f,m){n=Math.abs(n)%100;var d=n%10;if(n>10&&n<20)return m;if(d===1)return o;if(d>=2&&d<=4)return f;return m;}

/* ---------- хранение ---------- */
function fresh(){return {app:'ustny-schet',schemaVersion:1,done:{},stars:{},stats:{},sr:{},rec:{},days:{},alts:{},tier:'free',onboarded:false};}
var M=fresh(),mainTier='free',mainMult='free',mainTrach='free',mainAbak='free',storage={mode:'init'};
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
function exA20(){var a=ri(6,9),b=ri(11-a,9);return {type:'a20',a:a,b:b,key:'a20-'+a+'-'+b};}
function exS20(){var ua=ri(2,8),a=10+ua,b=ri(ua+1,9);return {type:'s20',a:a,b:b,key:'s20-'+a+'-'+b};}
function exB100(){var a=ri(1,9)*10+ri(1,9);if(a<12)a=12;return {type:'b100',a:a,key:'b100-'+a};}
function exNear(){var b=pick([8,9,9,18,19,19,28,29]),plus=Math.random()<0.6,a=plus?ri(14,68):ri(Math.max(b+3,31),95);return {type:'near',a:a,b:b,plus:plus,key:'near-'+a+(plus?'+':'-')+b};}
function exAddh(){var a=ri(5,9)*10+ri(2,9),b=ri(101-a,99);if(b%10===0)b++;if(b<12)b=12;return {type:'addh',a:a,b:b,key:'addh-'+a+'-'+b};}
var GEN={b10:exB10,a20:exA20,s20:exS20,add:exAdd,addc:exAddc,sub:exSub,subc:exSubc,b100:exB100,near:exNear,addh:exAddh,chg:exChg};
function gen(t){var e=GEN[t]();return e;}

function dig(n){return {t:Math.floor(n/10),u:n%10};}
function stepsFor(e){
  var a=e.a,b=e.b,A,B;
  if(e.type==='b10')return ['До 10 не хватает '+(10-a)+'.',a+' + '+(10-a)+' = 10'];
  if(e.type==='add'){A=dig(a);B=dig(b);return ['Десятки. '+A.t*10+' + '+B.t*10+' = '+(A.t+B.t)*10,'Единицы. '+A.u+' + '+B.u+' = '+(A.u+B.u),'Вместе. '+(A.t+B.t)*10+' + '+(A.u+B.u)+' = '+(a+b)];}
  if(e.type==='addc'){A=dig(a);B=dig(b);var need=10-A.u,tn=a+B.t*10,rem=B.u-need;return ['Сначала десятки. '+a+' + '+B.t*10+' = '+tn+'.','Теперь единицы. '+tn+' + '+B.u+'. До '+(tn+need)+' не хватает '+need+', значит '+tn+' + '+need+' = '+(tn+need)+'.','Осталось '+B.u+' − '+need+' = '+rem+', значит '+(tn+need)+' + '+rem+' = '+(a+b)];}
  if(e.type==='sub'||e.type==='subc'){A=dig(a);B=dig(b);var x=a-B.t*10;
    if(e.type==='sub'||x%10>=B.u)return [a+' − '+B.t*10+' = '+x,x+' − '+B.u+' = '+(a-b)];
    var r=x%10,t=x-r-10,ones=10+r,k=ones-B.u,s=[a+' − '+B.t*10+' = '+x,'Занимаем десяток, значит '+x+' = '+t+' + '+ones,ones+' − '+B.u+' = '+k];
    if(t>0)s.push(t+' + '+k+' = '+(a-b));else s[s.length-1]+=' (это и есть ответ)';return s;}
  if(e.type==='a20'){var nd=10-a;return ['До 10 не хватает '+nd+'.','Берём '+nd+' из числа '+b+'. Остаётся '+(b-nd)+'.','10 + '+(b-nd)+' = '+(a+b)];}
  if(e.type==='s20'){var u1=a-10,r1=b-u1;return [a+' − '+u1+' = 10 (дошли до десятка)','Осталось вычесть '+r1+', ведь '+b+' = '+u1+' + '+r1+'.','10 − '+r1+' = '+(a-b)];}
  if(e.type==='b100'){var n1=10-a%10,m1=a+n1,n2=100-m1;return [a+' + '+n1+' = '+m1+' (до круглого десятка)',m1+' + '+n2+' = 100 (до ста)',n1+' + '+n2+' = '+(n1+n2)+'. Не хватало '+(n1+n2)+'.'];}
  if(e.type==='near'){var BB=Math.ceil(b/10)*10,dd=BB-b;return e.plus?[b+' почти '+BB+', не хватает '+dd+'.',a+' + '+BB+' = '+(a+BB),(a+BB)+' − '+dd+' = '+(a+b)]:[b+' почти '+BB+', не хватает '+dd+'.',a+' − '+BB+' = '+(a-BB),(a-BB)+' + '+dd+' = '+(a-b)];}
  if(e.type==='addh'){var n3=100-a,rm=b-n3;return ['До 100 не хватает '+n3+'.','Берём '+n3+' из числа '+b+'. Остаётся '+rm+'.','100 + '+rm+' = '+(a+b)];}
  if(e.type==='chg'){var tt=Math.floor(e.price/10)*10,u=e.price%10,y=e.pay-tt,s2=[e.pay+' − '+tt+' = '+y];if(u)s2.push(y+' − '+u+' = '+(e.pay-e.price));return s2;}
  return [];}
function ansFor(e){var t=e.type;if(t==='b10')return 10-e.a;if(t==='b100')return 100-e.a;if(t==='add'||t==='addc'||t==='a20'||t==='addh')return e.a+e.b;if(t==='near')return e.plus?e.a+e.b:e.a-e.b;if(t==='chg')return e.pay-e.price;return e.a-e.b;}

/* ---------- рисунки ---------- */
/* десять клеток для яблок: a яблок лежат, остальные клетки пустые */
function apple(cx,cy,r){return '<circle cx="'+cx+'" cy="'+(cy+2)+'" r="'+r+'" class="mv-ap"/><path d="M'+cx+' '+(cy-r+3)+'q1-8 7-10" class="mv-st"/><ellipse cx="'+(cx+6)+'" cy="'+(cy-r-1)+'" rx="5" ry="2.6" transform="rotate(-25 '+(cx+6)+' '+(cy-r-1)+')" class="mv-lf"/><circle cx="'+(cx-r*0.4)+'" cy="'+(cy-r*0.15)+'" r="'+(r*0.2)+'" class="mv-hl"/>';}
function tenFrame(a,o){o=o||{};var s='',i,x,y,w=o.w||300;
  for(i=0;i<10;i++){x=30+(i%5)*48;y=12+Math.floor(i/5)*52;
    s+='<rect x="'+x+'" y="'+y+'" width="44" height="46" rx="9" class="'+(i<a?'mv-fr':'mv-em')+'"/>'+(i<a?apple(x+22,y+24,15):'<text x="'+(x+22)+'" y="'+(y+33)+'" class="mv-q" text-anchor="middle">?</text>');}
  return s;}
function homes(a){return '<svg class="mviz" viewBox="0 0 300 140" role="img" aria-label="Десять клеток, '+a+' яблок лежат, остальные клетки пустые">'+tenFrame(a)+'<text x="150" y="130" class="mv-t" text-anchor="middle">'+a+' яблок + ? = 10</text></svg>';}
/* десять клеток и ещё яблоки: a лежат в рамке, из b-яблок первые need (жёлтые) переедут в рамку */
function frameAdd(a,b){var need=10-a,s='<svg class="mviz" viewBox="0 0 300 150" role="img" aria-label="Рамка на десять яблок: лежит '+a+', рядом ещё '+b+'">',i;
  s+='<g transform="translate(-10 4) scale(.62)">'+tenFrame(a)+'</g>';
  for(i=0;i<b;i++){var x=170+(i%5)*26,y=20+Math.floor(i/5)*30;s+='<g class="'+(i<need?'mv-pk':'')+'">'+(i<need?'<circle cx="'+x+'" cy="'+(y+2)+'" r="13" class="mv-y"/>':'')+apple(x,y,9)+'</g>';}
  return s+'<text x="150" y="140" class="mv-t" text-anchor="middle">'+a+' + '+b+' = ?</text></svg>';}
function frameSub(a,b){var ua=a-10,rem=b-ua,s='<svg class="mviz" viewBox="0 0 300 150" role="img" aria-label="'+a+' яблок: полная рамка и ещё '+ua+'">',i;
  s+='<g transform="translate(-10 4) scale(.62)">'+tenFrame(10)+'</g>';
  s+='<g transform="translate(-10 4) scale(.62)">';for(i=10-rem;i<10;i++){var x=30+(i%5)*48,y=12+Math.floor(i/5)*52;s+='<rect x="'+x+'" y="'+y+'" width="44" height="46" rx="9" class="mv-x"/>';}s+='</g>';
  for(i=0;i<ua;i++){var x2=170+(i%5)*26,y2=20+Math.floor(i/5)*30;s+='<circle cx="'+x2+'" cy="'+(y2+2)+'" r="13" class="mv-x"/>'+apple(x2,y2,9);}
  return s+'<text x="150" y="140" class="mv-t" text-anchor="middle">'+a+' − '+b+' = ?</text></svg>';}
/* полоска на 100: ta десятков, ua единиц, need жёлтых */
function bar100(a,hl){var ta=Math.floor(a/10),ua=a%10,s='<svg class="mviz" viewBox="0 0 300 110" role="img" aria-label="Полоска на 100, закрашено '+a+'">',i;
  for(i=0;i<10;i++){var x=10+i*28;s+='<rect x="'+x+'" y="18" width="26" height="40" rx="6" class="'+(i<ta?'mv-b':'mv-em')+'"/>';}
  if(ua){var x3=10+ta*28;s+='<rect x="'+x3+'" y="18" width="26" height="40" rx="6" class="mv-em"/><rect x="'+x3+'" y="'+(18+40*(1-ua/10))+'" width="26" height="'+(40*ua/10)+'" rx="4" class="mv-b2"/>';}
  s+='<text x="'+(10+ta*14)+'" y="82" class="mv-t" text-anchor="middle">'+a+'</text><text x="'+(10+(a/100)*280+(280-(a/100)*280)/2)+'" y="82" class="mv-t" text-anchor="middle">'+(hl||'?')+'</text>';
  return s+'<text x="150" y="104" class="mv-t2" text-anchor="middle">вся полоска = 100</text></svg>';}
function numlineInner(pts,labs,W,Hh){
  var mn=Math.min.apply(null,pts),mx=Math.max.apply(null,pts),sp=mx-mn||1,y=Hh*0.62,s='';
  function X(v){return 24+(v-mn)/sp*(W-48);}
  s+='<line x1="8" y1="'+y+'" x2="'+(W-8)+'" y2="'+y+'" class="mv-l"/>';
  for(var i=0;i<pts.length-1;i++){var x1=X(pts[i]),x2=X(pts[i+1]),mid=(x1+x2)/2,top=y-Math.min(46,16+Math.abs(x2-x1)*0.28);
    s+='<path d="M'+x1+' '+y+' Q'+mid+' '+(top-Hh*0.08)+' '+x2+' '+y+'" class="mv-a'+(i%2)+'"/><text x="'+mid+'" y="'+(top-4)+'" class="mv-t" text-anchor="middle">'+labs[i]+'</text>';}
  for(var j=0;j<pts.length;j++){s+='<circle cx="'+X(pts[j])+'" cy="'+y+'" r="4.5" class="mv-b"/><text x="'+X(pts[j])+'" y="'+(y+20)+'" class="mv-t" text-anchor="middle">'+pts[j]+'</text>';}
  return s;}
function numline(pts,labs){return '<svg class="mviz" viewBox="0 0 300 100" role="img" aria-label="Числовая лента: '+pts.join(', ')+'">'+numlineInner(pts,labs,300,100)+'</svg>';}
/* фрукты: ящик = десяток яблок, апельсин = единица. goneT ящиков и goneU единиц убраны (бледные, пунктиром); open — один ящик раскрыт (его фрукты считаем единицами); mark — жёлтые единицы */
function fruit(cx,cy,r,cls){return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" class="'+cls+'"/>'+(cls==='mv-x'?'':'<path d="M'+cx+' '+(cy-r)+'q0-3 2.5-3.6" class="mv-st"/><circle cx="'+(cx-r*0.35)+'" cy="'+(cy-r*0.3)+'" r="'+(r*0.28)+'" fill="#fff" opacity=".6"/>');}
function pear(cx,cy,sz,cls){var P='M0-1C.34-1 .38-.45 .58-.05C.95.5 .8 1 0 1C-.8 1-.95.5-.58-.05C-.38-.45-.34-1 0-1Z';
  var st={'mv-or':'fill:#7CC443;stroke:#1A2747','mv-y':'fill:#FFC83D;stroke:#1A2747','mv-x':'fill:#FFE3E3;stroke:#E5383B;stroke-dasharray:.5 .4'}[cls]||'';
  return '<path transform="translate('+cx+' '+cy+') scale('+sz+')" d="'+P+'" style="'+st+';stroke-width:'+(1.5/sz).toFixed(2)+'"/>'+(cls==='mv-x'?'':'<path d="M'+cx+' '+(cy-sz)+'q0-3 2-4" style="fill:none;stroke:#6B3F1D;stroke-width:1.6;stroke-linecap:round"/><path d="M'+(cx+2)+' '+(cy-sz-4)+'q4-2 5 1q-3 2-5-1z" style="fill:#3DBE7A;stroke:none"/>');}
function blocks(n,o){o=o||{};var d=dig(n),gone=o.goneT||0,open=o.open?1:0,gu=o.goneU||0,mk=o.mark||0,i,s='',nc=d.t-gone-open,L=(open?10:0)+d.u,cols=Math.ceil(L/5),slots=d.t-open,CW=36,w=6+slots*(CW+4)+(cols?cols*22+4:0);
  s='<svg class="mviz mviz-s" viewBox="0 0 '+Math.max(w,60)+' 106" role="img" aria-label="'+n+': '+d.t+' '+pl(d.t,'ящик','ящика','ящиков')+' по 10 яблок и '+d.u+' '+pl(d.u,'груша','груши','груш')+'">';
  for(i=0;i<slots;i++){var x=4+i*(CW+4),g=i>=nc,cx=x+CW/2;s+='<rect x="'+x+'" y="3" width="'+CW+'" height="100" rx="6" class="'+(g?'mv-crx':'mv-crate')+'"/>';
    if(g)s+='<text x="'+cx+'" y="88" text-anchor="middle" class="mv-t" style="font-size:20px;opacity:.45">10</text>';
    else s+=apple(cx-2,40,13)+'<text x="'+cx+'" y="88" text-anchor="middle" class="mv-t" style="font-size:20px">10</text>';}
  var ux=4+slots*(CW+4)+4;
  for(i=0;i<L;i++){var isG=i>=L-gu,isM=!isG&&mk&&i>=d.u-mk&&!open;
    s+=pear(ux+11+Math.floor(i/5)*22,24+(i%5)*17,7.6,isG?'mv-x':(isM?'mv-y':'mv-or'));}
  return s+'</svg>';}
var FRUIT_NOTE='Ящик с красным яблоком — это 10 яблок (десяток). Зелёная груша — одна единица. ';

/* ---------- объяснения: три варианта на шаг ---------- */
var VNAME=['Через предметы','Числовая лента','Разложение'];
function p(t){return '<p>'+t+'</p>';}
function lines(arr){return '<p class="mono">'+arr.join('<br>')+'</p>';}
function chipsRow(e){
  function sp(n){var d=dig(n),r='';if(d.t)r+='<span class="mchip t">'+d.t*10+'</span>';if(d.u||!d.t)r+='<span class="mchip u">'+d.u+'</span>';return r;}
  if(e.type==='b10')return '<div class="mrow"><span class="mchip t">10</span><span class="mop">=</span><span class="mchip u">'+e.a+'</span><span class="mop">+</span><span class="mchip y">'+(10-e.a)+'</span></div>';
  if(e.type==='add'||e.type==='addc')return '<div class="mrow">'+sp(e.a)+'<span class="mop">+</span>'+sp(e.b)+'</div>';
  if(e.type==='sub'||e.type==='subc')return '<div class="mrow">'+sp(e.a)+'<span class="mop">−</span>'+sp(e.b)+'</div>';
  if(e.type==='a20'||e.type==='addh'){var nn=(e.type==='a20'?10:100)-e.a;return '<div class="mrow"><span class="mchip t">'+e.a+'</span><span class="mop">+</span><span class="mchip y">'+nn+'</span><span class="mop">+</span><span class="mchip u">'+(e.b-nn)+'</span></div>';}
  if(e.type==='s20'){var uu=e.a-10;return '<div class="mrow"><span class="mchip t">'+e.a+'</span><span class="mop">−</span><span class="mchip y">'+uu+'</span><span class="mop">−</span><span class="mchip u">'+(e.b-uu)+'</span></div>';}
  if(e.type==='b100'){var q1=10-e.a%10;return '<div class="mrow"><span class="mchip t">'+e.a+'</span><span class="mop">+</span><span class="mchip y">'+q1+'</span><span class="mop">+</span><span class="mchip u">'+(100-e.a-q1)+'</span></div>';}
  if(e.type==='near'){var BN=Math.ceil(e.b/10)*10;return '<div class="mrow"><span class="mchip t">'+e.b+'</span><span class="mop">=</span><span class="mchip y">'+BN+'</span><span class="mop">'+(e.plus?'−':'+')+'</span><span class="mchip u">'+(BN-e.b)+'</span></div>';}
  return '';}
function explain(e,vi){var h0=explain0(e,vi);if(vi===2)h0=h0.replace('</p>','</p>'+chipsRow(e));var q=e.type==='chg'?'':mkQ(e).eq;return (q?'<div class="eq exq" aria-label="Пример">'+q+'</div>':'')+h0;}
function explain0(e,vi){
  var st=stepsFor(e),A,B,k;
  if(e.type==='b10'){k=10-e.a;
    if(vi===0)return p('Это десять клеток для яблок. '+e.a+' '+pl(e.a,'яблоко','яблока','яблок')+' уже лежат. Сколько яблок нужно добавить, чтобы заполнить все десять клеток?')+homes(e.a)+p('Пустых клеток '+k+'. Значит, '+e.a+' + '+k+' = 10.');
    if(vi===1)return p('Идём по ленте от '+e.a+' до 10. Считаем прыжок.')+numline([e.a,10],['+'+k])+p('Прыжок '+k+'. Значит, '+e.a+' + '+k+' = 10.');
    return p('Число 10 можно «разобрать» на две части. Одна часть '+e.a+', а вторая — недостающая.')+lines(['10 = '+e.a+' + '+k,'10 = '+k+' + '+e.a])+p('Эти два числа — пара. Запомни пару, и всегда найдёшь вторую.');}
  if(e.type==='add'){A=dig(e.a);B=dig(e.b);
    if(vi===0)return p(FRUIT_NOTE+'Складываем ящики с ящиками, а груши с грушами.')+'<div class="mrow">'+blocks(e.a)+'<span class="mop">+</span>'+blocks(e.b)+'</div>'+lines(st);
    if(vi===1)return p('Прыгаем по ленте: сначала прибавим десятки, потом единицы.')+numline([e.a,e.a+B.t*10,e.a+e.b],['+'+B.t*10,'+'+B.u])+lines(st);
    return p('Разложим числа на десятки и единицы.')+lines([e.a+' = '+A.t*10+' + '+A.u,e.b+' = '+B.t*10+' + '+B.u])+lines(st);}
  if(e.type==='addc'){A=dig(e.a);B=dig(e.b);var need=10-A.u,tn=e.a+B.t*10,rem=B.u-need;
    if(vi===0)return p(FRUIT_NOTE+'Сначала сложим ящики. Потом груши. К '+A.u+' добавим '+need+' из '+B.u+' (жёлтые), получится ещё один ящик, и останется '+rem+'.')+'<div class="mrow">'+blocks(e.a)+'<span class="mop">+</span>'+blocks(e.b,{mark:need})+'</div>'+lines(st);
    if(vi===1)return p('Сначала прыгаем на десятки, потом на единицы. Единицы добавляем в два шага: до круглого десятка, потом остаток.')+numline([e.a,tn,tn+need,e.a+e.b],['+'+B.t*10,'+'+need,'+'+rem])+lines(st);
    return p('Разложим числа на десятки и единицы. '+e.a+' = '+A.t*10+' + '+A.u+', '+e.b+' = '+B.t*10+' + '+B.u+'.')+lines([A.t*10+' + '+B.t*10+' = '+(A.t+B.t)*10,A.u+' + '+B.u+' = '+(A.u+B.u)+' (это десяток и ещё '+(A.u+B.u-10)+')',(A.t+B.t)*10+' + '+(A.u+B.u)+' = '+(e.a+e.b)]);}
  if(e.type==='sub'||e.type==='subc'){A=dig(e.a);B=dig(e.b);var x=e.a-B.t*10;
    if(vi===0){var bor=B.u>0&&x%10<B.u;return p(FRUIT_NOTE+'Из '+e.a+' уберём '+B.t+' '+pl(B.t,'ящик','ящика','ящиков')+' и ещё '+B.u+' '+pl(B.u,'груша','груши','груш')+(bor?'. Груш не хватает, поэтому один ящик раскроем: его яблоки станут грушами, чтобы было что убирать.':'.')+' Убранное бледное, с пунктиром.')+blocks(e.a,{goneT:B.t,goneU:B.u,open:bor})+lines(st);}
    if(vi===1)return p('Идём назад по ленте: сначала на '+B.t*10+', потом на '+B.u+'.')+numline([e.a,x,e.a-e.b],['−'+B.t*10,'−'+B.u])+lines(st);
    return p('Вычитаем по частям. Число '+e.b+' разложим на части. '+e.b+' = '+B.t*10+' + '+B.u+'.')+lines(st);}
  if(e.type==='a20'){var nd=10-e.a,rr=e.b-nd,sm=e.a+e.b;
    if(vi===0)return p('В рамке лежит '+e.a+' '+pl(e.a,'яблоко','яблока','яблок')+'. Чтобы заполнить её, нужно ещё '+nd+'. Возьмём их из второй кучки (жёлтые).')+frameAdd(e.a,e.b)+lines(st);
    if(vi===1)return p('Прыгаем по ленте: сначала до 10, потом остаток.')+numline([e.a,10,sm],['+'+nd,'+'+rr])+lines(st);
    return p('До десятка не хватает '+nd+'. Поэтому отделим от числа '+e.b+' ровно '+nd+', то есть '+e.b+' = '+nd+' + '+rr+'.')+lines([e.a+' + '+nd+' = 10','10 + '+rr+' = '+sm]);}
  if(e.type==='s20'){var u1=e.a-10,r1=e.b-u1;
    if(vi===0)return p('Было '+e.a+' яблок: полная рамка и ещё '+u1+'. Сначала уберём лишние '+u1+', потом ещё '+r1+' из рамки. Убранное выцветает.')+frameSub(e.a,e.b)+lines(st);
    if(vi===1)return p('Идём назад по ленте: сначала до 10, потом дальше.')+numline([e.a,10,e.a-e.b],['−'+u1,'−'+r1])+lines(st);
    return p('Разложим вычитаемое. '+e.b+' = '+u1+' + '+r1+'.')+lines([e.a+' − '+u1+' = 10','10 − '+r1+' = '+(e.a-e.b)]);}
  if(e.type==='b100'){var n1=10-e.a%10,m1=e.a+n1,n2=100-m1,all=n1+n2;
    if(vi===0)return p('Полоска на 100 клеток. Закрашено '+e.a+'. Сколько осталось закрасить?')+bar100(e.a,'?')+lines(st);
    if(vi===1)return p('Идём по ленте от '+e.a+' до 100: сначала до круглого десятка, потом до ста.')+numline([e.a,m1,100],['+'+n1,'+'+n2])+lines(st);
    return p('Дополняем в два шага: до десятка и до сотни. Складываем добавки.')+lines([e.a+' + '+n1+' = '+m1,m1+' + '+n2+' = 100',n1+' + '+n2+' = '+all]);}
  if(e.type==='near'){var BN=Math.ceil(e.b/10)*10,dd=BN-e.b,r2=e.plus?e.a+e.b:e.a-e.b,mid=e.plus?e.a+BN:e.a-BN;
    if(vi===0)return p(e.plus?'Прибавить '+e.b+' — это прибавить '+BN+' и тут же вернуть '+dd+'. Так считать проще.':'У тебя '+e.a+' ₽. Нужно заплатить '+e.b+' ₽. Дадим '+BN+' ₽ и получим '+dd+' ₽ сдачи.')+lines(st);
    if(vi===1)return p('На ленте: большой прыжок на '+BN+' и маленький возврат на '+dd+'.')+numline([e.a,mid,r2],[(e.plus?'+':'−')+BN,(e.plus?'−':'+')+dd])+lines(st);
    return p('Заменим '+e.b+' на «круглое минус немного», то есть '+e.b+' = '+BN+' − '+dd+'.')+lines(st);}
  if(e.type==='addh'){var n3=100-e.a,rm=e.b-n3,sum=e.a+e.b;
    if(vi===0)return p('До полной сотни не хватает '+n3+'. Возьмём эти '+n3+' из числа '+e.b+' (жёлтые клетки).')+bar100(e.a,'+'+n3)+lines(st);
    if(vi===1)return p('Прыгаем по ленте до 100, потом прибавляем остаток.')+numline([e.a,100,sum],['+'+n3,'+'+rm])+lines(st);
    return p('До сотни не хватает '+n3+'. Поэтому отделим от числа '+e.b+' ровно '+n3+', то есть '+e.b+' = '+n3+' + '+rm+'.')+lines([e.a+' + '+n3+' = 100','100 + '+rm+' = '+sum]);}
  return '';}

/* ---------- вопрос по примеру ---------- */
function mkQ(e){
  var q={e:e,type:e.type,key:e.key,ans:ansFor(e)};
  if(e.type==='b10'){q.lead='Сколько не хватает до 10?';q.eq=e.a+' + ? = 10';q.vis=homes(e.a);}
  else if(e.type==='chg'){q.lead='Покупаем '+e.item+'. Товар стоит '+e.price+' ₽, даём '+e.pay+' ₽. Сколько сдачи?';q.eq='Сдача: ?';}
  else if(e.type==='b100'){q.lead='Сколько не хватает до 100?';q.eq=e.a+' + ? = 100';q.vis=bar100(e.a,'?');}
  else{var plus=e.type==='add'||e.type==='addc'||e.type==='a20'||e.type==='addh'||(e.type==='near'&&e.plus);q.lead=plus?'Сложи в уме.':'Вычти в уме.';q.eq=e.a+(plus?' + ':' − ')+e.b+' = ?';}
  q.steps=stepsFor(e);return q;}

/* ---------- модули ---------- */
var MODS=[
 {id:'n1',tag:'10 = 7 + 3',title:'Состав числа',sub:'Дополняем до 10',type:'b10',need:'free',canon:{type:'b10',a:7,key:'b10-7'},art:['#2B59E6','#5B7FF0']},
 {id:'n5',tag:'8 + 7',title:'Сложение до 20',sub:'Через десяток · 8 + 2 + 5',type:'a20',need:'standard',canon:{type:'a20',a:8,b:7,key:'a20-8-7'},art:['#0E8FB0','#35C2D0'],note:'8 + 2 = 10, 10 + 5 = 15'},
 {id:'n6',tag:'15 − 8',title:'Вычитание до 20',sub:'Через десяток · 15 − 5 − 3',type:'s20',need:'standard',canon:{type:'s20',a:15,b:8,key:'s20-15-8'},art:['#C92A2A','#FF8787'],note:'15 − 5 = 10, 10 − 3 = 7'},
 {id:'n2',tag:'23 + 45',title:'Сложение без перехода',sub:'Десятки и единицы',type:'add',need:'standard',canon:{type:'add',a:23,b:45,key:'add-23-45'},art:['#0E8F6A','#2FC79A']},
 {id:'n3',tag:'47 + 28',title:'Сложение через десяток',sub:'Достраиваем до круглого',type:'addc',need:'standard',canon:{type:'addc',a:47,b:28,key:'addc-47-28'},art:['#7A2FC4','#B05CF0']},
 {id:'n4',tag:'80 − 34',title:'Вычитание по частям',sub:'Сначала десятки, потом единицы',type:'subc',types:['subc','sub'],ex2:'sub',need:'standard',canon:{type:'subc',a:80,b:34,key:'subc-80-34'},art:['#C2255C','#FF6F91']},
 {id:'n7',tag:'63 + ? = 100',title:'Дополнение до 100',sub:'До десятка, потом до сотни',type:'b100',need:'standard',canon:{type:'b100',a:63,key:'b100-63'},art:['#2F9E44','#74D68A'],note:'63 + 7 = 70, 70 + 30 = 100'},
 {id:'n8',tag:'47 + 19',title:'Прибавить и вычесть 9, 8, 19',sub:'Круглое число и поправка',type:'near',need:'standard',canon:{type:'near',a:47,b:19,plus:true,key:'near-47+19'},art:['#5F3DC4','#9775FA'],note:'+19 = +20 − 1'},
 {id:'n9',tag:'68 + 47',title:'Сложение через сотню',sub:'Достраиваем до 100',type:'addh',need:'standard',canon:{type:'addh',a:68,b:47,key:'addh-68-47'},art:['#E67700','#FFC53D'],note:'68 + 32 = 100, 100 + 15 = 115'}];
function modById(id){for(var i=0;i<MODS.length;i++)if(MODS[i].id===id)return MODS[i];return null;}
function locked(m){return !atLeast(m.need);}
function lockSvg(){return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';}
function modArt(m){
  var inner='';
  if(m.id==='n1'){inner='<g transform="translate(-10 -2) scale(1.07)"><rect x="20" y="4" width="270" height="112" rx="12" fill="#fff" opacity=".92"/><g transform="translate(2 6) scale(.9)">'+tenFrame(7)+'</g></g>';}
  else if(m.id==='n2')inner='<text x="80" y="52" class="mv-t2" text-anchor="middle">23 + 45</text><text x="80" y="82" class="mv-t3" text-anchor="middle">20+40, 3+5</text><text x="225" y="62" class="mv-t2" text-anchor="middle">= 68</text>';
  else if(m.note)inner='<text x="150" y="60" class="mv-t3" style="font-size:34px" text-anchor="middle">'+m.tag+'</text><text x="150" y="92" class="mv-t2" style="font-size:14px" text-anchor="middle">'+m.note+'</text>';
  else if(m.id==='n3')inner='<g transform="translate(0 8)">'+numlineInner([47,50,75],['+3','+25'],300,100)+'</g>';
  else inner='<g transform="translate(0 8)">'+numlineInner([80,50,46],['−30','−4'],300,100)+'</g>';
  return '<svg class="modart" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false"><defs><linearGradient id="mg-'+m.id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+m.art[0]+'"/><stop offset="1" stop-color="'+m.art[1]+'"/></linearGradient></defs><rect x="-300" y="-200" width="900" height="520" fill="url(#mg-'+m.id+')"/><circle cx="270" cy="10" r="46" fill="#fff" opacity=".1"/><g class="mart">'+inner+'</g></svg>';}

/* картинки для превью тренажёра и игры «Дай сдачу» */
function mArtSvg(id,c1,c2,inner){return '<svg class="modart" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false"><defs><linearGradient id="ma-'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs><rect x="-3" y="-3" width="306" height="126" fill="url(#ma-'+id+')"/><circle cx="270" cy="14" r="34" fill="#fff" opacity=".12"/>'+inner+'</svg>';}
function mtile(x,y,w,h,t,sz,col){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="#fff" stroke="#1A2747" stroke-width="2.5"/><text x="'+(x+w/2)+'" y="'+(y+h/2+sz*0.35)+'" font-family="Rubik,sans-serif" font-weight="700" font-size="'+sz+'" fill="'+(col||'#1A2747')+'" text-anchor="middle">'+t+'</text>';}
function trainArt(){return mArtSvg('tr','#1E56D6','#52A2F5',mtile(20,28,84,56,'8 + 5',26)+mtile(108,20,84,56,'62 − 8',24,'#C2255C')+mtile(196,28,84,56,'47 + 28',22,'#2E9E5B')+'<path d="M150 98l-8 14h10l-4 10 14-18h-10l5-6z" fill="#FFC83D" stroke="#1A2747" stroke-width="2" stroke-linejoin="round"/>');}
function shopArt(){return mArtSvg('sh','#1F9D6B','#6FD9A5','<rect x="26" y="26" width="96" height="62" rx="10" fill="#fff" stroke="#1A2747" stroke-width="2.5"/><text x="74" y="66" font-family="Rubik,sans-serif" font-weight="700" font-size="28" fill="#1A2747" text-anchor="middle">67 ₽</text><path d="M130 58h30m-9-8l9 8-9 8" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="170" y="26" width="104" height="62" rx="10" fill="#FFC83D" stroke="#1A2747" stroke-width="2.5"/><text x="222" y="62" font-family="Rubik,sans-serif" font-weight="700" font-size="24" fill="#1A2747" text-anchor="middle">100 ₽</text><text x="222" y="80" font-family="Rubik,sans-serif" font-weight="700" font-size="12" fill="#1A2747" text-anchor="middle">сдача 33 ₽</text><circle cx="40" cy="106" r="9" fill="#FFC83D" stroke="#1A2747" stroke-width="2"/><circle cx="62" cy="106" r="9" fill="#FFC83D" stroke="#1A2747" stroke-width="2"/>');}
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
    var st=d?'<span class="stars" aria-label="'+(M.stars[m.id]||2)+' из 3">'+starsStr(M.stars[m.id]||2)+'</span> пройдено':(lk?lockSvg()+'В платном тарифе':(next&&next.id===m.id?'Следующий':'Новое'));
    return '<button type="button" class="mod'+(d?' done':'')+'" data-start="'+m.id+'">'+modArt(m)+'<span class="mod-n">Модуль '+(i+1)+'</span><span class="mod-tag">'+m.tag+'</span><span class="mod-t">'+m.title+'</span><span class="mod-s">'+st+'</span></button>';}).join('');
  var today=next?'<div><b>Сегодня: модуль '+(MODS.indexOf(next)+1)+'</b><span>'+next.title+'. Хватит 5–10 минут.</span></div><button type="button" class="btn" data-start="'+next.id+'">'+(Object.keys(M.done).length?'Продолжить':'Начать')+'</button>'
    :'<div><b>Все доступные модули пройдены</b><span>Тренажёр подберёт примеры, которые пока даются труднее.</span></div><button type="button" class="btn" data-v="train">В тренажёр</button>';
  var free=tier()==='free'?'<section class="note" style="margin-top:14px"><h3>Бесплатный доступ</h3><p>Открыт модуль «Состав числа» и тренажёр на состав числа: до '+FREE_MIN+' '+pl(FREE_MIN,'минуты','минут','минут')+' в день, сегодня осталось '+Math.max(0,FREE_MIN-usedMin())+' мин. Остальные модули и игру «Дай сдачу» откроет тариф «Устный счёт» или «Комбо».</p><button type="button" class="btn" data-v="plans">Посмотреть тарифы</button></section>':'';
  app.innerHTML='<section class="card lift"><p class="kicker">Считаем в уме</p><h1>Устный счёт</h1><p class="lead" style="margin-top:12px">Сначала понимаем приём, потом тренируем. В каждом модуле коротко показываем, как считать быстро: разложить числа, достроить до десятка, пройтись по числовой ленте. Не понял? Нажми «Объясни по-другому».</p><div class="today"><span class="clk-hi">'+clk('joy')+'<i>Привет! Я Клетик</i></span>'+today+'</div></section>'+free
   +'<h2>Модули</h2><div class="mods">'+cards+'</div><h2>Ещё</h2><div class="mods">'
   +'<button type="button" class="mod" data-v="train">'+trainArt()+'<span class="mod-tag">Тренажёр</span><span class="mod-s">Примеры подбираются под тебя'+(tier()==='free'?' · '+lockSvg()+'только состав числа':'')+'</span></button>'
   +'<button type="button" class="mod" data-v="shop">'+shopArt()+'<span class="mod-tag">Дай сдачу</span><span class="mod-s">'+(atLeast('standard')?'Игра в магазин: сколько сдачи?':lockSvg()+'В платном тарифе')+'</span></button></div>'
   +'<p class="small" style="margin-top:18px">Хорошо заниматься по 5–10 минут каждый день. Таймера на вопросах нет: скорость придёт после понимания.</p>';}

/* ---------- урок ---------- */
function startModule(id){
  var m=modById(id);if(!m)return;
  if(locked(m)){view={name:'buy',why:'block',title:m.title};render();return;}
  var tp=m.types||[m.type];
  var items=[{kind:'explain',e:m.canon,v:0},{kind:'explain',e:gen(m.ex2||m.type),v:0}];
  var seq=[];for(var i=0;i<4;i++)seq.push(tp[i%tp.length]);
  seq.forEach(function(t){items.push({kind:'ask',q:mkQ(gen(t)),phase:'Тренируемся',test:false,w:0});});
  var tt=[];for(var j=0;j<3;j++)tt.push(tp[j%tp.length]);
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
    var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);
    card.insertAdjacentHTML('beforeend','<div class="clk-corner">'+clk('think')+'</div>');}
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
      done(true,'<div class="fb ok hc">'+clk('joy')+'<strong>'+pick(['Верно!','Да, точно!','Правильно!','Отлично!'])+'</strong>'+extra+'</div>');return;}
    it.w++;q.first=false;
    if(it.test||it.w>=2){
      recordResult(q,false,0);
      done(false,'<div class="fb try hc">'+clk('sorry')+'<strong>'+(it.w>=2&&!it.test?'Ничего страшного.':'Пока не получилось.')+' Правильный ответ: '+q.ans+'.</strong>'+stepsHtml(q)+'<span>Этот пример мы ещё повторим.</span></div>');
      if(R.mode==='train'&&R.queue)R.queue.push(q.e);return;}
    fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ой, я тоже иногда путаюсь. Давай посмотрим ещё раз.</strong><div class="hint">'+q.steps[0]+'</div><span>Попробуй ещё раз.</span></div>';
    addShow();inp.value='';inp.focus();}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)(chk.textContent==='Дальше')?next():check();};}

function finishModule(){
  stopTimer();var m=R.mod,n=R.testN||3,ok=R.testOk||0;
  var st=ok>=n?3:(ok>=Math.ceil(n*2/3)?2:1);
  M.done[m.id]=true;M.stars[m.id]=Math.max(M.stars[m.id]||0,st);save();
  view={name:'done',id:m.id,ok:ok,n:n,st:st};render();}
function rDone(){
  var m=modById(view.id),idx=MODS.indexOf(m),nx=MODS[idx+1];
  app.innerHTML='<section class="card lift"><div class="clk-top">'+clk('party')+'</div><div class="phase">Модуль пройден</div><div class="big-stars" aria-label="'+view.st+' из 3">'+starsStr(view.st)+'</div><h2 style="margin:14px 0 10px">'+(view.st>=2?'Ты освоил приём':'Хорошее начало')+'</h2><p>В проверке с первого раза верно: '+view.ok+' из '+view.n+'. '+(view.st<3?'Пример, где была ошибка, вернётся в тренажёре.':'')+'</p><p class="small">Чтобы приём закрепился, вернись к нему в тренажёре завтра.</p><div class="row">'+(nx&&!locked(nx)?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий модуль</button>':(nx?'<button type="button" class="btn" data-v="plans">Открыть следующий модуль</button>':''))+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';}

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
   +(atLeast('pro')?'<p class="small">Примеров на повторении: '+sr+'. Они возвращаются через 1, 3, 7 и 14 дней.</p>':(atLeast('standard')?'<p class="small">Примеры, которые не получились, возвращаются чаще.</p>':'<p class="small">В бесплатной версии тренажёр даёт примеры на состав числа, до '+FREE_MIN+' минут в день. Остальные типы откроет тариф «Устный счёт» или «Комбо».</p>'))
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
   +'<section class="card" style="margin-top:14px"><h3>Доступ</h3><p class="small">Сейчас открыт тариф «Устный счёт»: <b>'+TIER_NAME[tier()]+'</b>. «Умножение»: <b>'+TIER_NAME[mainMult]+'</b>. Коды тарифа «Комбо» открывают все три тренажёра сразу.</p><div class="row"><button type="button" class="btn ghost" data-v="plans">Тарифы и код доступа</button><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="trainer.html">Тренажёр умножения</a></div></section>'
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
function applyTier(g){
  /* g: {mult, mental}. «Устный счёт» хранит свой тариф у себя и дублирует в общую запись, чтобы его увидел «Умножение». */
  if(g.mental&&RANK[g.mental]>RANK[M.tier]){M.tier=g.mental;save();}
  Store.get('progress').then(function(v){
    v=(v&&typeof v==='object')?v:{};
    var ch=false,ti=function(x){return RANK[x]||0;};
    if(g.mental&&ti(g.mental)>ti(v.tierMental)){v.tierMental=g.mental;ch=true;}
    if(g.trach&&ti(g.trach)>ti(v.tierTrach)){v.tierTrach=g.trach;ch=true;mainTrach=g.trach;}
    if(g.abak&&ti(g.abak)>ti(v.tierAbak)){v.tierAbak=g.abak;ch=true;mainAbak=g.abak;}
    if(g.mult&&ti(g.mult)>ti(v.tierMult)){v.tierMult=g.mult;v.tier=g.mult;ch=true;mainMult=g.mult;}
    if(ch){v.adv=true;return Store.put('progress',v);}}).catch(function(){});}
function tryCode(code,msg,ok){
  if(String(code).trim() === '8888'){
    P.tierMult = 'pro'; P.tierMental = 'pro'; P.tierTrahtenberg = 'pro'; P.tierAbakus = 'pro'; P.tier = 'pro'; P.adv = true;
    save(); ok(); return;
  }

  if(!(window.crypto&&crypto.subtle)){msg.textContent='Проверка кода недоступна в этом браузере.';return;}
  if(!anyCodes()){msg.textContent='Коды доступа ещё не настроены.';return;}
  sha256hex(String(code).trim().toUpperCase()).then(function(hx){
    var g=codeGrant(hx);
    if(!g){msg.textContent='Код не подошёл. Проверьте, нет ли лишних символов.';return;}
    var newMental=g.mental&&RANK[g.mental]>RANK[tier()],newMult=g.mult&&RANK[g.mult]>RANK[mainMult],newTrach=g.trach&&RANK[g.trach]>RANK[mainTrach],newAbak=g.abak&&RANK[g.abak]>RANK[mainAbak];
    if(!newMental&&!newMult&&!newTrach&&!newAbak){msg.textContent='Этот код ничего не добавит: у вас уже открыт такой тариф или выше.';return;}
    applyTier(g);ok();}).catch(function(){msg.textContent='Не удалось проверить код.';});}
function planHtml(name,price,url,items,pro){
  return '<div class="plan'+(pro?' pro':'')+'"><h3>'+name+'</h3><p class="price">'+price+' <span class="small">один раз</span></p><ul>'+items.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul><a class="btn'+(pro?'':' ghost')+'" href="'+url+'">Купить '+name+'</a></div>';}
function rBuy(){
  var why=view.why||'plans',title,lead;
  if(why==='limit'){title='На сегодня всё!';lead='Бесплатный доступ: '+FREE_MIN+' минут занятий в день. Прогресс сохранён. Чтобы заниматься без ограничений, выберите «Устный счёт» или «Комбо». Завтра бесплатные минуты появятся снова.';}
  else if(why==='feature'){title=(view.title||'Эта возможность')+' входит в платный тариф';lead='Сначала можно пользоваться бесплатной версией, потом открыть нужный тариф. Оплата один раз, без подписки.';}
  else if(why==='block'){title='Модуль «'+(view.title||'')+'» входит в платные тарифы';lead='В бесплатной версии открыт модуль «Состав числа». Остальные модули откроет тариф «Устный счёт» или «Комбо».';}
  else{title='Тарифы';lead='Бесплатная версия остаётся навсегда: модуль «Состав числа» и тренажёр на состав числа до '+FREE_MIN+' минут в день. Платные тарифы оплачиваются один раз, без подписки. Коды «Комбо» открывают все три тренажёра сразу.';}
  app.innerHTML='<section class="card lift"><h1 style="margin:0 0 10px">'+title+'</h1><p class="lead">'+lead+'</p></section>'+tariffCols('mental')
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
   .then(function(){return Store.get('progress').then(function(v){if(v){if(RANK[v.tierMental]!==undefined)mainTier=v.tierMental;if(RANK[v.tierTrach]!==undefined)mainTrach=v.tierTrach;if(RANK[v.tierAbak]!==undefined)mainAbak=v.tierAbak;if(RANK[v.tierMult]!==undefined)mainMult=v.tierMult;else if(RANK[v.tier]!==undefined)mainMult=v.tier;}}).catch(function(){});})
   .then(function(){render();});}
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});}
boot();
})();
