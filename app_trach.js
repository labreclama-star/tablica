/* «Быстрый счёт по Трахтенбергу»: тренажёр быстрого счёта. Без сервера: прогресс хранится в браузере (IndexedDB).
   Тарифы и коды доступа общие с тренажёрами «Умножение» и «Устный счёт». */
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

/*ENGINE*/
/* Правила Трахтенберга. Число записываем с нулём слева, у каждой цифры есть «сосед» справа
   (у последней цифры сосед невидимый 0). Ответ пишем справа налево, перенос держим в уме. */
function half(x){return Math.floor(x/2);}
function digs(n){return String(n).split('').map(Number);}
function droot(n){n=Math.abs(n);while(n>9){var s=0;String(n).split('').forEach(function(c){s+=+c;});n=s;}return n;}
function partsFor(m,d,nb,kind){
  var P=[],odd=d%2===1,lead=kind==='lead',first=kind==='first';
  function add(l,x,v){P.push({l:l,x:String(x),v:v});}
  function dg(){if(!lead)add('цифра',d,d);}
  function dd(){if(!lead)add('удвоили цифру','2 × '+d,2*d);}
  function nbr(){if(!first)add('сосед',nb,nb);}
  function hn(){if(!first)add('половина соседа','½ от '+nb,half(nb));}
  function o5(){if(odd&&!lead)add('цифра нечётная, добавляем',5,5);}
  if(m===2)dd();
  else if(m===11){dg();nbr();}
  else if(m===12){dd();nbr();}
  else if(m===5){hn();o5();}
  else if(m===6){dg();hn();o5();}
  else if(m===7){dd();hn();o5();}
  else if(m===9){if(first)add('до 10','10 − '+d,10-d);else if(lead)add('сосед без единицы',nb+' − 1',nb-1);else{add('до 9','9 − '+d,9-d);nbr();}}
  else if(m===8){if(first)add('до 10, удвоили','(10 − '+d+') × 2',2*(10-d));else if(lead)add('сосед минус 2',nb+' − 2',nb-2);else{add('до 9, удвоили','(9 − '+d+') × 2',2*(9-d));nbr();}}
  else if(m===4){if(first){add('до 10','10 − '+d,10-d);o5();}else if(lead)add('половина соседа минус 1','½ от '+nb+' = '+half(nb)+', минус 1',half(nb)-1);else{add('до 9','9 − '+d,9-d);hn();o5();}}
  else if(m===3){if(first){add('до 10, удвоили','(10 − '+d+') × 2',2*(10-d));o5();}else if(lead)add('половина соседа минус 2','½ от '+nb+' = '+half(nb)+', минус 2',half(nb)-2);else{add('до 9, удвоили','(9 − '+d+') × 2',2*(9-d));hn();o5();}}
  if(!P.length)add('ничего не добавляем',0,0);
  return P;}
function rsteps(m,N){
  var D=[0].concat(digs(N)),L=D.length-1,carry=0,S=[],i,out=[];
  for(i=L;i>=0;i--){
    var kind=i===L?'first':(i===0?'lead':'mid'),d=D[i],nb=i<L?D[i+1]:0,P=partsFor(m,d,nb,kind),val=0;
    P.forEach(function(p){val+=p.v;});
    var tot=val+carry,w=((tot%10)+10)%10,co=Math.floor(tot/10);
    S.push({idx:i,d:d,nb:nb,kind:kind,parts:P,cin:carry,val:val,total:tot,write:w,cout:co});
    carry=co;}
  while(carry>0){S.push({idx:-1,d:0,nb:0,kind:'extra',parts:[],cin:carry,val:0,total:carry,write:carry%10,cout:Math.floor(carry/10)});carry=Math.floor(carry/10);}
  S.forEach(function(s){out.unshift(s.write);});
  return {m:m,N:N,D:D,steps:S,product:parseInt(out.join(''),10)};}
/* метод двух пальцев: единицы произведений пар цифр этого шага + десятки пар предыдущего шага + перенос */
function tsteps(A,B){
  var a=digs(A).reverse(),b=digs(B).reverse(),S=[],carry=0,k,i,j,n=a.length+b.length,out=[];
  for(k=0;k<n;k++){
    var U=[],T=[],su=0,st=0;
    for(i=0;i<a.length;i++){j=k-i;if(j>=0&&j<b.length){var p=a[i]*b[j];U.push({a:a[i],b:b[j],p:p,u:p%10});su+=p%10;}}
    for(i=0;i<a.length;i++){j=k-1-i;if(j>=0&&j<b.length){var q=a[i]*b[j];T.push({a:a[i],b:b[j],p:q,t:Math.floor(q/10)});st+=Math.floor(q/10);}}
    var tot=su+st+carry;
    S.push({k:k,U:U,T:T,su:su,st:st,cin:carry,total:tot,write:tot%10,cout:Math.floor(tot/10)});carry=Math.floor(tot/10);}
  while(S.length>1&&S[S.length-1].total===0)S.pop();
  S.forEach(function(s){out.unshift(s.write);});
  return {A:A,B:B,steps:S,product:parseInt(out.join(''),10)};}
/*ENDENGINE*/

/* ---------- типы примеров ---------- */
var TYPES={
  qk:{name:'Сосед, половина, до 9 и до 10'},
  m2:{name:'Умножение на 2'},m11:{name:'Умножение на 11'},m12:{name:'Умножение на 12'},m5:{name:'Умножение на 5'},
  m6:{name:'Умножение на 6'},m7:{name:'Умножение на 7'},m9:{name:'Умножение на 9'},m8:{name:'Умножение на 8'},
  m4:{name:'Умножение на 4'},m3:{name:'Умножение на 3'},
  sq5:{name:'Квадрат числа на 5'},two:{name:'Метод двух пальцев'},root:{name:'Девятка числа'},chk:{name:'Проверка девяткой'}};
var ALL_T=['m2','m11','m12','m5','m6','m7','m9','m8','m4','m3','sq5','two','root','chk'];
function pl(n,o,f,m){n=Math.abs(n)%100;var d=n%10;if(n>10&&n<20)return m;if(d===1)return o;if(d>=2&&d<=4)return f;return m;}

/* ---------- хранение ---------- */
function fresh(){return {app:'trahtenberg',schemaVersion:1,done:{},stars:{},stats:{},sr:{},rec:{},days:{},alts:{},tier:'free',onboarded:false};}
var M=fresh(),mainTier='free',mainMult='free',mainMental='free',mainAbak='free',storage={mode:'init'};
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
  if(RANK[f.tier]===undefined)f.tier='free';f.app='trahtenberg';f.schemaVersion=1;return f;}
var saveT=null;
function flush(){saveT=null;if(storage.mode!=='idb')return;Store.put('trach',JSON.parse(JSON.stringify(M))).catch(function(){storage.mode='memory';});}
function save(){if(saveT)return;saveT=setTimeout(flush,250);}
document.addEventListener('visibilitychange',function(){if(document.hidden){if(saveT)clearTimeout(saveT);flush();}});
window.addEventListener('pagehide',function(){if(saveT)clearTimeout(saveT);flush();});
function tier(){var a=RANK[M.tier]||0,b=RANK[mainTier]||0;return a>=b?(M.tier||'free'):mainTier;}
function atLeast(t){return RANK[tier()]>=RANK[t];}
function addTime(sec){var k=dayKey();M.days[k]=(M.days[k]||0)+sec;save();}
function usedMin(){return Math.floor((M.days[dayKey()]||0)/60);}

/* ---------- генераторы примеров ---------- */
function rn(k,noz){var lo=Math.pow(10,k-1),hi=Math.pow(10,k)-1,n,t=0;do{n=ri(lo,hi);t++;}while((n%10===0||/00/.test(String(n)))&&t<20);return n;}
function exMul(m,k){var N=rn(k||3);return {type:'m'+m,m:m,N:N,key:'m'+m+'-'+N};}
function exSq5(){var n=pick([15,25,35,45,55,65,75,85,95,105,115,125]);return {type:'sq5',n:n,key:'sq5-'+n};}
function exTwo(){var A=ri(12,98),B=ri(12,98);if(A%10===0)A++;if(B%10===0)B++;return {type:'two',A:A,B:B,key:'two-'+A+'-'+B};}
function exRoot(){var N=rn(ri(3,5));return {type:'root',N:N,key:'root-'+N};}
function exChk(){var A=ri(12,89),B=ri(12,89),C=A*B,ok=Math.random()<0.5;
  if(!ok){var t=0,c;do{c=C+pick([-1,1,-2,2,-3,3,10,-10,20,-20,100,-100,5,-5,7,-7])*pick([1,1,2]);t++;}while((droot(c)===droot(C)||c<=0)&&t<30);if(droot(c)===droot(C))c=C+1;C=c;}
  return {type:'chk',A:A,B:B,C:C,ok:ok,key:'chk-'+A+'-'+B+'-'+C};}
function exQk(){var t=pick(['nb','nb','half','c10','c9','odd']);
  if(t==='nb'){var N=rn(3),D=digs(N),i=ri(0,D.length-2);return {type:'qk',q:'nb',N:N,i:i,key:'qk-nb-'+N+'-'+i};}
  var v=ri(t==='half'?2:1,9);if(t==='half')v=ri(3,19);
  return {type:'qk',q:t,v:v,key:'qk-'+t+'-'+v};}
var GEN={qk:exQk,sq5:exSq5,two:exTwo,root:exRoot,chk:exChk};
[2,11,12,5,6,7,9,8,4,3].forEach(function(m){GEN['m'+m]=function(){return exMul(m,3);};});
function gen(t,k){return GEN[t]();}

/* ---------- ответы, подсказки, пошаговые задания ---------- */
function isM(e){return /^m\d+$/.test(e.type);}
function ansFor(e){var t=e.type;
  if(isM(e))return e.N*e.m;if(t==='sq5')return e.n*e.n;if(t==='two')return e.A*e.B;if(t==='root')return droot(e.N);
  if(t==='chk')return e.ok?1:0;
  if(e.q==='nb')return digs(e.N)[e.i+1];if(e.q==='half')return half(e.v);if(e.q==='c10')return 10-e.v;if(e.q==='c9')return 9-e.v;return e.v%2?5:0;}
var RULE={
 2:'Удвой каждую цифру. Если вышло больше 9, пиши последнюю цифру, а десяток запомни и добавь на следующем шаге.',
 11:'Каждая цифра ответа — это цифра плюс её сосед.',
 12:'Каждая цифра ответа — это удвоенная цифра плюс её сосед.',
 5:'Каждая цифра ответа — это половина соседа. Если сама цифра нечётная, добавь ещё 5.',
 6:'Цифра плюс половина соседа. Если цифра нечётная, добавь ещё 5.',
 7:'Удвоенная цифра плюс половина соседа. Если цифра нечётная, добавь ещё 5.',
 9:'Первая цифра справа — до 10. Средние — до 9 и плюс сосед. Самый левый нулик — сосед минус 1.',
 8:'Первая цифра справа — до 10, удвоить. Средние — до 9, удвоить и плюс сосед. Самый левый нулик — сосед минус 2.',
 4:'Первая цифра справа — до 10 и плюс 5, если нечётная. Средние — до 9, плюс половина соседа и 5, если цифра нечётная. Самый левый нулик — половина соседа минус 1.',
 3:'Первая цифра справа — до 10, удвоить, плюс 5, если нечётная. Средние — до 9, удвоить, плюс половина соседа и 5, если цифра нечётная. Самый левый нулик — половина соседа минус 2.'};
function partTxt(p){return String(p.v)===p.x?p.l+' '+p.v:p.l+' ('+p.x+' = '+p.v+')';}
function sumTxt(s){var a=s.parts.map(function(p){return p.v;});if(s.cin)a.push(s.cin);return a.join(' + ')+(a.length>1?' = '+s.total:'');}
function stepWords(s){
  if(s.kind==='extra')return 'Остался перенос '+s.cin+'. Пишем '+s.write+(s.cout?', а '+s.cout+' переносим дальше':'')+'.';
  var who=s.kind==='lead'?'Нулик слева, сосед '+s.nb:'Цифра '+s.d+', сосед '+s.nb;
  var t=s.parts.map(partTxt);if(s.cin)t.push('перенос '+s.cin);
  return who+'. Считаем: '+t.join(', ')+'. Всего '+sumTxt(s)+'. Пишем '+s.write+(s.cout?', а '+s.cout+' запоминаем':'')+'.';}
function stepHint(s){
  if(s.kind==='extra')return 'Перенос '+s.cin+' просто записываем слева: '+s.write+'.';
  var t=s.parts.map(partTxt);if(s.cin)t.push('перенос '+s.cin);
  return t.join('; ')+'. Складываем '+sumTxt(s)+'. Пишем '+s.write+(s.cout?', а '+s.cout+' запоминаем.':'.');}
function twoWords(s){
  function pr(a,k){return a.map(function(x){return x.a+' × '+x.b+' = '+x.p+(k==='u'?' (единицы '+x.u+')':' (десятки '+x.t+')');}).join('; ')||'пар нет';}
  var t=['единицы — '+pr(s.U,'u'),'десятки из прошлого столбика — '+pr(s.T,'t')];
  return 'Столбик '+(s.k+1)+'. '+t.join('. ')+'. Складываем '+s.su+' + '+s.st+(s.cin?' + перенос '+s.cin:'')+' = '+s.total+'. Пишем '+s.write+(s.cout?', а '+s.cout+' запоминаем':'')+'.';}

/* лента Трахтенберга: число с нулём слева, соседи справа, строка ответа */
function tape(r,k){
  var S=r.steps,ex=0,i,c;S.forEach(function(s){if(s.idx<0)ex++;});
  var L=r.D.length-1,n=ex+r.D.length+1,cur=k<S.length?S[k]:null;
  var carry='',dig='',lab='',ans='',colOf=function(s){return s.idx<0?ex-1-(S.indexOf(s)-(S.length-ex)):ex+s.idx;};
  var cc=cur?colOf(cur):-1,nbc=cur&&cur.idx>=0?cc+1:-1,wr={};
  for(i=0;i<k&&i<S.length;i++)wr[colOf(S[i])]=S[i].write;
  for(c=0;c<n;c++){
    carry+='<span class="tz-c">'+(c===cc&&cur.cin?'+'+cur.cin:'')+'</span>';
    var di=c-ex,cls='tz-d',tx='';
    if(di<0)cls='tz-d tz-e';else if(di===L+1){cls='tz-d tz-z tz-g';tx='0';}else{tx=r.D[di];if(di===0)cls+=' tz-z';}
    if(c===cc&&cur.idx>=0)cls+=' now';if(c===nbc)cls+=' nb';
    dig+='<span class="'+cls+'">'+tx+'</span>';
    lab+='<span class="tz-l">'+(c===cc&&cur.idx>=0?'цифра':(c===nbc?'сосед':''))+'</span>';
    ans+=wr[c]!==undefined?'<span class="tz-a ok">'+wr[c]+'</span>':(c===cc?'<span class="tz-a q">?</span>':'<span class="tz-a"></span>');}
  return '<div class="tz" style="--n:'+n+'" role="img" aria-label="Число с нулём слева, соседи справа и ответ">'+carry+dig+lab+ans+'</div>';}
/* ответ плиточками (для методов без ленты) */
function ansTiles(s,k,total){var a=[],i;for(i=0;i<k;i++)a.unshift(s[i].write);var out='';
  var n=total;for(i=0;i<n;i++){var j=n-1-i,w=k>j?a[a.length-1-j]:undefined;out+=w!==undefined?'<span class="tz-a ok">'+w+'</span>':(j===k?'<span class="tz-a q">?</span>':'<span class="tz-a"></span>');}
  return '<div class="tz" style="--n:'+n+'" role="img" aria-label="Ответ по цифрам">'+out+'</div>';}

function mkQ(e){
  var q={e:e,type:e.type,key:e.key,ans:ansFor(e)},t=e.type;
  if(isM(e)){q.lead='Умножь по правилу Трахтенберга.';q.eq=e.N+' × '+e.m+' = ?';var r=rsteps(e.m,e.N);q.hint='Правило. '+RULE[e.m]+' Идём справа налево, перед числом ставим нулик.';q.steps=r.steps.map(function(s,i){return (i+1)+') '+stepWords(s);});}
  else if(t==='sq5'){var a=(e.n-5)/10;q.lead='Возведи в квадрат число, которое оканчивается на 5.';q.eq=e.n+' × '+e.n+' = ?';q.hint='Возьми число без пятёрки ('+a+'), умножь его на следующее ('+(a+1)+') и допиши 25.';q.steps=[a+' × '+(a+1)+' = '+a*(a+1),'Дописываем 25 справа. Получилось '+e.n*e.n+'.'];}
  else if(t==='two'){q.lead='Умножь методом двух пальцев.';q.eq=e.A+' × '+e.B+' = ?';var T=tsteps(e.A,e.B);q.hint='Идём по столбикам справа налево. В каждом столбике складываем единицы одних пар и десятки пар из прошлого столбика.';q.steps=T.steps.map(function(s){return twoWords(s);});}
  else if(t==='root'){q.lead='Найди «девятку» числа: складывай цифры, пока не останется одна.';q.eq='Девятка числа '+e.N+' = ?';var sm=digs(e.N).reduce(function(a,b){return a+b;},0);q.hint='Сложи все цифры. Если вышло больше 9, сложи цифры ещё раз.';q.steps=[digs(e.N).join(' + ')+' = '+sm].concat(sm>9?[digs(sm).join(' + ')+' = '+droot(sm)]:[]);}
  else if(t==='chk'){q.lead='Проверь девяткой. Ответ верный или в нём есть ошибка?';q.eq=e.A+' × '+e.B+' = '+e.C;q.choices=['Есть ошибка','Верно'];var ra=droot(e.A),rb=droot(e.B),rp=droot(ra*rb),rc=droot(e.C);
    q.hint='Найди девятку у каждого числа. Девятка от произведения девяток должна совпасть с девяткой ответа.';
    q.steps=['Девятка '+e.A+' равна '+ra+', девятка '+e.B+' равна '+rb,ra+' × '+rb+' = '+ra*rb+', девятка равна '+rp,'Девятка ответа '+e.C+' равна '+rc,rp===rc?'Совпало, значит, ответ похож на верный.':'Не совпало ('+rp+' и '+rc+'), значит, в ответе есть ошибка. Верный ответ '+e.A*e.B+'.'];}
  else{
    if(e.q==='nb'){var D=digs(e.N);q.lead='У выделенной цифры сосед — цифра справа. Какая это цифра?';q.eq=D.map(function(d,i){return i===e.i?'<b>'+d+'</b>':d;}).join('');q.steps=['Справа от '+D[e.i]+' стоит '+D[e.i+1]+'.'];}
    else if(e.q==='half'){q.lead='Найди половину (остаток отбрось).';q.eq='½ от '+e.v+' = ?';q.steps=['Половина от '+e.v+' — это '+half(e.v)+(e.v%2?' (остаток 1 отбрасываем)':'')+'.'];}
    else if(e.q==='c10'){q.lead='Сколько не хватает до 10?';q.eq=e.v+' + ? = 10';q.steps=['10 − '+e.v+' = '+(10-e.v)+'.'];}
    else if(e.q==='c9'){q.lead='Сколько не хватает до 9?';q.eq=e.v+' + ? = 9';q.steps=['9 − '+e.v+' = '+(9-e.v)+'.'];}
    else{q.lead='Если цифра нечётная, добавляем 5, если чётная — 0. Сколько добавим?';q.eq='Цифра '+e.v+' → ?';q.steps=[e.v+(e.v%2?' нечётная, добавляем 5.':' чётная, добавляем 0.')];}
    q.hint=q.steps[0];}
  return q;}

/* пошаговое задание: ребёнок сам пишет каждую цифру ответа */
function mkG(e){
  var q=mkQ(e),g={q:q,steps:[],tape:null},i;
  if(isM(e)){var r=rsteps(e.m,e.N);g.vis=function(k){return tape(r,k);};
    r.steps.forEach(function(s){var lbl=s.parts.map(function(p){return p.l;}).join(', ');
      g.steps.push({p:s.kind==='extra'?'Остался перенос <b>'+s.cin+'</b>. Что пишем слева?':(s.kind==='lead'?'Нулик слева, сосед <b>'+s.nb+'</b>':'Цифра <b>'+s.d+'</b>, сосед <b>'+s.nb+'</b>')+(s.cin?'. В уме держим <b>'+s.cin+'</b>':'')+'. Что пишем в ответе?',
        sub:s.kind==='extra'?'':'Считаем: '+lbl+(s.cin?', перенос':''),acc:[s.write,s.total],hint:stepHint(s),
        ok:s.cout?'Пишем '+s.write+', '+s.cout+' запоминаем.':'Пишем '+s.write+'.'});});}
  else if(e.type==='two'){var T=tsteps(e.A,e.B);g.vis=function(k){return ansTiles(T.steps,k,T.steps.length);};
    T.steps.forEach(function(s){var u=s.U.map(function(x){return x.a+' × '+x.b;}).join(', '),t=s.T.map(function(x){return x.a+' × '+x.b;}).join(', ');
      g.steps.push({p:'Столбик <b>'+(s.k+1)+'</b>'+(s.cin?'. В уме держим <b>'+s.cin+'</b>':'')+'. Что пишем в ответе?',sub:'Единицы от пар: '+u+(t?'. Десятки от пар: '+t:'. Десятков от прошлого столбика нет'),acc:[s.write,s.total],hint:twoWords(s),ok:s.cout?'Пишем '+s.write+', '+s.cout+' запоминаем.':'Пишем '+s.write+'.'});});}
  else if(e.type==='sq5'){var a=(e.n-5)/10,S0=[{write:0},{write:0}];g.vis=null;
    g.steps=[{p:'Число без пятёрки — <b>'+a+'</b>. Следующее за ним — <b>'+(a+1)+'</b>. Сколько будет '+a+' × '+(a+1)+'?',sub:'',acc:[a*(a+1)],hint:a+' × '+(a+1)+' = '+a*(a+1),ok:'Теперь допишем 25.'},
      {p:'Допиши 25 справа к числу <b>'+a*(a+1)+'</b>. Что получилось?',sub:'',acc:[e.n*e.n],hint:a*(a+1)+' и рядом 25 — это '+e.n*e.n+'.',ok:''}];}
  else if(e.type==='root'){var sm=digs(e.N).reduce(function(x,y){return x+y;},0);
    g.steps=[{p:'Сложи все цифры числа <b>'+e.N+'</b>.',sub:digs(e.N).join(' + ')+' = ?',acc:[sm],hint:digs(e.N).join(' + ')+' = '+sm,ok:sm>9?'Вышло больше 9, сложим цифры ещё раз.':''}];
    if(sm>9)g.steps.push({p:'Сложи цифры числа <b>'+sm+'</b>.',sub:digs(sm).join(' + ')+' = ?',acc:[droot(sm)],hint:digs(sm).join(' + ')+' = '+droot(sm),ok:''});}
  else g.steps=[{p:q.lead,sub:q.eq,acc:[q.ans],hint:q.steps[0],ok:''}];
  return g;}

/* ---------- объяснения ---------- */
var VNAME=['Шаг за шагом','Всё в таблице','Почему так'];
function p(t){return '<p>'+t+'</p>';}
function lines(arr){return '<p class="mono">'+arr.join('<br>')+'</p>';}
function legend(){return '<p class="tz-leg"><span class="tz-key now">цифра</span><span class="tz-key nb">сосед</span><span class="tz-key z">нулик</span><span class="tz-key a">ответ</span></p>';}
function whyHtml(m,N){var a=N*m,N10=N*10,N5=N*5,H=function(x){return x;};
  var t={
   2:'Умножить на 2 — значит сложить число с самим собой: '+N+' + '+N+' = '+a+'. Удвоить каждую цифру — то же самое, только по частям.',
   11:'11 = 10 + 1. Значит, '+N+' × 11 = '+N+' × 10 + '+N+' = '+N10+' + '+N+' = '+a+'. Когда складываешь так в столбик, каждая цифра встречается со своим соседом. Отсюда правило.',
   12:'12 = 10 + 2. Значит, '+N+' × 12 = '+N+' × 10 + '+N+' × 2 = '+N10+' + '+2*N+' = '+a+'. Поэтому цифру удваиваем и прибавляем соседа.',
   5:'5 — это половина от 10. Значит, '+N+' × 5 — это половина от '+N+' × 10, то есть половина от '+N10+', и это '+a+'. Когда делишь число пополам цифра за цифрой, нечётная цифра отдаёт соседке справа лишнюю единичку, а это 5 в следующем разряде. Вот почему мы добавляем 5.',
   6:'6 = 5 + 1. Значит, '+N+' × 6 = '+N+' × 5 + '+N+' = '+N5+' + '+N+' = '+a+'. Поэтому берём цифру и добавляем половину соседа.',
   7:'7 = 5 + 2. Значит, '+N+' × 7 = '+N+' × 5 + '+N+' × 2 = '+N5+' + '+2*N+' = '+a+'. Поэтому удваиваем цифру и добавляем половину соседа.',
   9:'9 = 10 − 1. Значит, '+N+' × 9 = '+N+' × 10 − '+N+' = '+N10+' − '+N+' = '+a+'. Вычитать «в столбик» удобно через «до 10» и «до 9», отсюда эти правила.',
   8:'8 = 10 − 2. Значит, '+N+' × 8 = '+N+' × 10 − '+N+' × 2 = '+N10+' − '+2*N+' = '+a+'. Поэтому в правилах есть «до 10», удвоение и сосед.',
   4:'4 = 5 − 1. Значит, '+N+' × 4 = '+N+' × 5 − '+N+' = '+N5+' − '+N+' = '+a+'. Поэтому в правилах есть «до 10» и половина соседа.',
   3:'3 = 5 − 2. Значит, '+N+' × 3 = '+N+' × 5 − '+N+' × 2 = '+N5+' − '+2*N+' = '+a+'. Поэтому в правилах есть «до 10», удвоение и половина соседа.'}[m];
  return p(t)+p('Правила Трахтенберга — это те же вычисления, только разложенные по цифрам. Поэтому они всегда работают.');}
function qkN(e){return e.N||374;}
function explain(e,vi,it){
  var q=mkQ(e),head='<div class="eq exq" aria-label="Пример">'+(isM(e)?e.N+' × '+e.m+' = ?':(e.type==='qk'?digs(qkN(e)).join(' '):q.eq))+'</div>',out='';
  if(isM(e)){var r=rsteps(e.m,e.N),S=r.steps;
    if(vi===0){var sk=it?(it.sk||0):S.length;
      out=p('<b>Правило.</b> '+RULE[e.m])+p('Пишем число с <b>нуликом слева</b>. Идём <b>справа налево</b>. У последней цифры справа стоит невидимый нулик, он и есть её сосед.')+legend()+tape(r,sk);
      if(sk>0)out+=lines(S.slice(0,sk).map(function(s,i){return (i+1)+') '+stepWords(s);}));
      out+=sk<S.length?p('<span class="small">Нажми «Покажи шаг», чтобы увидеть следующую цифру ответа.</span>'):p('<b>Ответ: '+r.product+'.</b> '+e.N+' × '+e.m+' = '+r.product+'.');}
    else if(vi===1){
      out=p('<b>Правило.</b> '+RULE[e.m])+'<div class="tz-scroll"><table class="tz-tab"><thead><tr><th>Шаг</th><th>Цифра</th><th>Сосед</th><th>Считаем</th><th>Пишем</th></tr></thead><tbody>'
       +S.map(function(s,i){return '<tr><td>'+(i+1)+'</td><td>'+(s.kind==='extra'?'—':s.d)+'</td><td>'+(s.kind==='extra'?'—':s.nb)+'</td><td>'+(s.kind==='extra'?'перенос '+s.cin:sumTxt(s))+'</td><td><b>'+s.write+'</b>'+(s.cout?' <span class="small">(+'+s.cout+' в уме)</span>':'')+'</td></tr>';}).join('')+'</tbody></table></div>'
       +p('<b>Ответ: '+r.product+'.</b>');}
    else out=whyHtml(e.m,e.N)+p('Проверим по-другому: '+e.N+' × '+e.m+' = '+e.N*e.m+'. Сходится.');
    return head+out;}
  if(e.type==='sq5'){var a=(e.n-5)/10,pr=a*(a+1);
    if(vi===0)out=p('Квадрат числа, которое кончается на 5, считается за один взгляд.')+lines(['1) Убираем пятёрку: остаётся '+a+'.','2) Берём следующее число: '+(a+1)+'.','3) Перемножаем: '+a+' × '+(a+1)+' = '+pr+'.','4) Дописываем справа 25: '+pr+'<b>25</b>.'])+p('<b>Ответ: '+e.n*e.n+'.</b>');
    else if(vi===1){var rows=[15,25,35,45,65,75,85,95].map(function(n){var b=(n-5)/10;return '<tr><td>'+n+'</td><td>'+b+' × '+(b+1)+' = '+b*(b+1)+'</td><td><b>'+n*n+'</b></td></tr>';}).join('');
      out=p('Вот как это работает для других чисел.')+'<div class="tz-scroll"><table class="tz-tab"><thead><tr><th>Число</th><th>Считаем</th><th>Квадрат</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+p('Каждый раз справа получается 25.');}
    else out=p('Проверим длинным способом. '+e.n+' × '+e.n+' = '+e.n+' × '+(e.n-5)+' + '+e.n+' × 5 = '+e.n*(e.n-5)+' + '+e.n*5+' = '+e.n*e.n+'.')+p('Значит, правило не волшебство. Число вида '+a+'5 — это '+a+' десятков и ещё 5. Если раскрыть скобки, получается '+a+' × '+(a+1)+' сотен и ещё 25.');
    return head+out;}
  if(e.type==='two'){var T=tsteps(e.A,e.B),a1=Math.floor(e.A/10),a0=e.A%10,b1=Math.floor(e.B/10),b0=e.B%10;
    if(vi===0)out=p('Идём по столбикам справа налево. В каждом столбике складываем <b>единицы</b> некоторых пар и <b>десятки</b> пар из прошлого столбика.')+lines(T.steps.map(function(s){return twoWords(s);}))+p('<b>Ответ: '+T.product+'.</b>');
    else if(vi===1)out=p('Как выбирать пары. У '+e.A+' цифры '+a1+' и '+a0+', у '+e.B+' цифры '+b1+' и '+b0+'.')+lines(['Столбик 1 — '+a0+' × '+b0+' (последние цифры)','Столбик 2 — '+a0+' × '+b1+' и '+a1+' × '+b0+' (крест-накрест)','Столбик 3 — '+a1+' × '+b1+' (первые цифры)','Столбик 4 — только то, что запомнили'])+p('В каждой паре берём единицы. А десятки пары идут в следующий столбик.');
    else out=p('Это обычное умножение, только складываем сразу всё, что стоит в одном столбике. '+e.A+' × '+e.B+' = '+e.A+' × '+b1*10+' + '+e.A+' × '+b0+' = '+e.A*b1*10+' + '+e.A*b0+' = '+e.A*e.B+'.')+p('Единицы и десятки пар — это те же маленькие кусочки, которые получаются в столбике. Мы просто не пишем их в разные строки, а сразу складываем.');
    return head+out;}
  if(e.type==='root'){var ds=digs(e.N),sm=ds.reduce(function(x,y){return x+y;},0);
    if(vi===0)out=p('«Девятка» числа — это то, что останется, если складывать его цифры, пока не получится одна цифра.')+lines([ds.join(' + ')+' = '+sm].concat(sm>9?[digs(sm).join(' + ')+' = '+droot(sm)]:[]))+p('<b>Девятка числа '+e.N+' равна '+droot(e.N)+'.</b>');
    else if(vi===1)out=p('Можно быстрее. Вычёркивай девятки и пары цифр, которые вместе дают 9.')+p('Пары на 9 — это 1 и 8, 2 и 7, 3 и 6, 4 и 5. Что останется, то и есть девятка. Если не осталось ничего, девятка равна 9.')+lines(['Число '+e.N+' даёт '+droot(e.N)]);
    else out=p('Почему можно складывать цифры. Десяток — это 9 + 1, сотня — это 99 + 1, тысяча — это 999 + 1. Девятки в числе нас не интересуют, а единички от каждого разряда складываются. Это и есть сумма цифр.')+p('Поэтому девятка числа — это остаток при делении на 9 (если остатка нет, пишем 9).');
    return head+out;}
  if(e.type==='chk'){var ra=droot(e.A),rb=droot(e.B),rp=droot(ra*rb),rc=droot(e.C);
    if(vi===0)out=p('Проверка девяткой ловит ошибки в умножении.')+lines(['1) Девятка '+e.A+' равна '+ra,'2) Девятка '+e.B+' равна '+rb,'3) '+ra+' × '+rb+' = '+ra*rb+', девятка равна '+rp,'4) Девятка ответа '+e.C+' равна '+rc,rp===rc?'Совпало. Ответ похож на верный.':'Не совпало. В ответе есть ошибка.']);
    else if(vi===1)out=p('Запомни порядок. Берём девятки множителей, перемножаем их и снова берём девятку. Потом сравниваем с девяткой ответа.')+lines(['девятка(A) × девятка(B) → девятка','сравниваем с девяткой(ответ)','Не совпало — есть ошибка','Совпало — скорее всего верно']);
    else out=p('Почему это работает. Девятка числа — это остаток при делении на 9. А остаток произведения всегда равен остатку от произведения остатков. Поэтому у верного ответа девятки должны сойтись.')+p('Но есть честная оговорка: если цифры в ответе поменялись местами, девятка этого не заметит. Проверка находит почти все ошибки, но не гарантирует, что ответ верный.');
    return head+out;}
  /* qk: сосед, половина, до 9 и до 10 */
  var N=qkN(e),ds2=digs(N),L2=ds2.length;
  if(vi===0){
    out=p('Соседом мы называем цифру, которая стоит <b>справа</b> от выбранной. Перед числом всегда ставим нулик.')+lines(['0 '+ds2.join(' ')].concat(['Нулик слева, сосед '+ds2[0]].concat(ds2.map(function(d,i){return 'Цифра '+d+', сосед '+(i<L2-1?ds2[i+1]:'0 (невидимый нулик справа)');})))) +p('У последней цифры справа никого нет. Считаем, что там стоит невидимый нулик.');}
  else if(vi===1){
    out=p('<b>Половина</b> — это число, поделённое пополам, без остатка. Остаток отбрасываем.')+lines(['½ от 0 и 1 — это 0','½ от 2 и 3 — это 1','½ от 4 и 5 — это 2','½ от 6 и 7 — это 3','½ от 8 и 9 — это 4'])+p('<b>До 10</b> — сколько не хватает до десятки: до 10 для 3 — это 7. <b>До 9</b> — сколько не хватает до девятки: до 9 для 3 — это 6.')+p('<b>Нечётные цифры</b> — 1, 3, 5, 7, 9. Если цифра нечётная, в некоторых правилах мы добавляем 5.');}
  else{
    out=p('Нулик слева нужен, чтобы было куда записать перенос или вычесть единицу. Невидимый нулик справа нужен, чтобы у самой последней цифры тоже был сосед.')+p('Тренируемся: число '+ds2.join(' ')+' с нуликами выглядит как <b>0 '+ds2.join(' ')+' 0</b>. Слева и справа стоят нули, они ничего не меняют в числе, зато помогают считать по одному правилу.');}
  return head+out;}

/* ---------- модули ---------- */
function ck(t,k){return t+'-'+k;}
var MODS=[
 {id:'z0',tag:'0 3 7 4 0',title:'Сосед и нулик',sub:'Сосед, половина, до 9 и до 10',type:'qk',guide:'m2',need:'free',canon:{type:'qk',q:'nb',N:374,i:0,key:'qk-nb-374-0'},ex2e:{type:'qk',q:'nb',N:5286,i:1,key:'qk-nb-5286-1'},art:['#2B59E6','#5B7FF0'],note:'сосед — цифра справа'},
 {id:'z11',tag:'36 × 11',title:'Умножение на 11',sub:'Цифра плюс сосед',type:'m11',need:'standard',canon:{type:'m11',m:11,N:36,key:'m11-36'},art:['#0E8F6A','#2FC79A'],note:'3 · 3+6 · 6 = 396'},
 {id:'z12',tag:'23 × 12',title:'Умножение на 12',sub:'Удвоить и прибавить соседа',type:'m12',need:'standard',canon:{type:'m12',m:12,N:23,key:'m12-23'},art:['#0E8FB0','#35C2D0'],note:'= 276'},
 {id:'z5',tag:'74 × 5',title:'Умножение на 5',sub:'Половина соседа',type:'m5',need:'standard',canon:{type:'m5',m:5,N:74,key:'m5-74'},art:['#C2255C','#FF6F91'],note:'= 370'},
 {id:'z6',tag:'74 × 6',title:'Умножение на 6',sub:'Цифра и половина соседа',type:'m6',need:'standard',canon:{type:'m6',m:6,N:74,key:'m6-74'},art:['#7A2FC4','#B05CF0'],note:'= 444'},
 {id:'z7',tag:'32 × 7',title:'Умножение на 7',sub:'Удвоить цифру и половина соседа',type:'m7',need:'standard',canon:{type:'m7',m:7,N:32,key:'m7-32'},art:['#E67700','#FFC53D'],note:'= 224'},
 {id:'z9',tag:'43 × 9',title:'Умножение на 9',sub:'До 10, до 9 и сосед',type:'m9',need:'standard',canon:{type:'m9',m:9,N:43,key:'m9-43'},art:['#2F9E44','#74D68A'],note:'= 387'},
 {id:'z8',tag:'32 × 8',title:'Умножение на 8',sub:'До 10, удвоить, сосед',type:'m8',need:'standard',canon:{type:'m8',m:8,N:32,key:'m8-32'},art:['#C92A2A','#FF8787'],note:'= 256'},
 {id:'z4',tag:'32 × 4',title:'Умножение на 4',sub:'До 10 и половина соседа',type:'m4',need:'standard',canon:{type:'m4',m:4,N:32,key:'m4-32'},art:['#5F3DC4','#9775FA'],note:'= 128'},
 {id:'z3',tag:'24 × 3',title:'Умножение на 3',sub:'До 10, удвоить, половина соседа',type:'m3',need:'standard',canon:{type:'m3',m:3,N:24,key:'m3-24'},art:['#1971C2','#4DABF7'],note:'= 72'},
 {id:'zsq',tag:'35²',title:'Квадрат числа на 5',sub:'Десятки × следующее и 25',type:'sq5',need:'standard',canon:{type:'sq5',n:35,key:'sq5-35'},art:['#D9480F','#FF922B'],note:'3 × 4 = 12, и 25 → 1225'},
 {id:'ztf',tag:'23 × 47',title:'Метод двух пальцев',sub:'Двузначное на двузначное',type:'two',need:'standard',canon:{type:'two',A:23,B:47,key:'two-23-47'},art:['#087F5B','#38D9A9'],note:'= 1081'},
 {id:'z9c',tag:'проверка',title:'Проверка девяткой',sub:'Девятка числа и поиск ошибки',type:'root',types:['root','chk','root'],guide:'root',ex2:'chk',need:'standard',canon:{type:'root',N:4786,key:'root-4786'},art:['#364FC7','#748FFC'],note:'4786 → 25 → 7'}];
function modById(id){for(var i=0;i<MODS.length;i++)if(MODS[i].id===id)return MODS[i];return null;}
function locked(m){return !atLeast(m.need);}
function lockSvg(){return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" style="vertical-align:-2px;margin-right:4px"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';}
function mArtSvg(id,c1,c2,inner){return '<svg class="modart" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false"><defs><linearGradient id="ma-'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs><rect x="-3" y="-3" width="306" height="126" fill="url(#ma-'+id+')"/><circle cx="270" cy="14" r="34" fill="#fff" opacity=".12"/>'+inner+'</svg>';}
function mtile(x,y,w,h,t,sz,col){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="#fff" stroke="#1A2747" stroke-width="2.5"/><text x="'+(x+w/2)+'" y="'+(y+h/2+sz*0.35)+'" font-family="Rubik,sans-serif" font-weight="700" font-size="'+sz+'" fill="'+(col||'#1A2747')+'" text-anchor="middle">'+t+'</text>';}
function modArt(m){
  var inner;
  if(m.id==='z0'){var t='',v=['0','3','7','4','0'],i;for(i=0;i<5;i++){t+='<rect x="'+(22+i*52)+'" y="20" width="46" height="52" rx="9" fill="'+(i===1?'#2B59E6':(i===2?'#FF8A4C':'#fff'))+'" stroke="#1A2747" stroke-width="2.5" '+(i===0||i===4?'stroke-dasharray="4 3" opacity=".8"':'')+'/><text x="'+(45+i*52)+'" y="56" font-family="Rubik,sans-serif" font-weight="700" font-size="28" fill="'+(i===1?'#fff':'#1A2747')+'" text-anchor="middle">'+v[i]+'</text>';}
    inner=t+'<text x="97" y="92" font-family="Rubik,sans-serif" font-weight="700" font-size="12" fill="#fff" text-anchor="middle">цифра</text><text x="149" y="92" font-family="Rubik,sans-serif" font-weight="700" font-size="12" fill="#fff" text-anchor="middle">сосед</text><text x="150" y="112" font-family="Rubik,sans-serif" font-weight="600" font-size="12" fill="#fff" text-anchor="middle">сосед — цифра справа</text>';}
  else inner='<text x="150" y="58" font-family="Rubik,sans-serif" font-weight="700" font-size="'+(m.tag.length>7?30:38)+'" fill="#fff" text-anchor="middle">'+m.tag+'</text><text x="150" y="92" font-family="Rubik,sans-serif" font-weight="600" font-size="15" fill="#fff" text-anchor="middle">'+m.note+'</text>';
  return mArtSvg(m.id,m.art[0],m.art[1],inner);}
function trainArt(){return mArtSvg('tr','#1E56D6','#52A2F5',mtile(20,28,84,56,'36 × 11',22)+mtile(108,20,84,56,'74 × 5',24,'#C2255C')+mtile(196,28,84,56,'35²',26,'#2E9E5B')+'<path d="M150 98l-8 14h10l-4 10 14-18h-10l5-6z" fill="#FFC83D" stroke="#1A2747" stroke-width="2" stroke-linejoin="round"/>');}

/* ---------- состояние экрана ---------- */
var app=$('#app'),view={name:'home'},R=null,tick=null,lastTick=0;
function startTimer(){stopTimer();lastTick=Date.now();tick=setInterval(function(){if(document.hidden){lastTick=Date.now();return;}var n=Date.now();var d=Math.min(10,Math.round((n-lastTick)/1000));lastTick=n;if(d>0)addTime(d);},5000);}
function stopTimer(){if(tick){clearInterval(tick);tick=null;}}
function go(v){stopTimer();view=v;R=null;render();window.scrollTo(0,0);}
function render(){
  if(tier()==='free'&&view.name==='train'&&usedMin()>=FREE_MIN&&!view.run){view={name:'buy',why:'limit'};}
  ({home:rHome,lesson:rRun,train:rTrain,parent:rParent,buy:rBuy,done:rDone,sum:rSum})[view.name]();
  var cur={lesson:'home',done:'home',sum:'train'}[view.name]||view.name;
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
  var free=tier()==='free'?'<section class="note" style="margin-top:14px"><h3>Бесплатный доступ</h3><p>Открыт первый модуль «Сосед и нулик»: в нём мы учимся находить соседа цифры, считать половину и умножать на 2. Бесплатный тренажёр даёт быстрые вопросы про соседа и половину, до '+FREE_MIN+' '+pl(FREE_MIN,'минуты','минут','минут')+' в день, сегодня осталось '+Math.max(0,FREE_MIN-usedMin())+' мин. Остальные 12 модулей откроет тариф «Быстрый счёт» или «Комбо».</p><button type="button" class="btn" data-v="plans">Посмотреть тарифы</button></section>':'';
  app.innerHTML='<section class="card lift"><p class="kicker">Система Якова Трахтенберга</p><h1>Быстрый счёт</h1><p class="lead" style="margin-top:12px">Умножаем большие числа без таблицы умножения: у каждой цифры есть сосед, и ответ складывается цифра за цифрой. Сначала объясняем приём, потом считаем вместе, потом сам. Не понял? Нажми «Объясни по-другому».</p><div class="today"><span class="clk-hi">'+clk('joy')+'<i>Привет! Я Клетик</i></span>'+today+'</div></section>'+free
   +'<h2>Модули</h2><div class="mods">'+cards+'</div><h2>Ещё</h2><div class="mods">'
   +'<button type="button" class="mod" data-v="train">'+trainArt()+'<span class="mod-tag">Тренажёр</span><span class="mod-s">Примеры подбираются под тебя'+(tier()==='free'?' · '+lockSvg()+'только быстрые вопросы':'')+'</span></button></div>'
   +'<p class="small" style="margin-top:18px">Хорошо заниматься по 5–10 минут каждый день. Таймера на вопросах нет: скорость придёт после понимания.</p>';}

/* ---------- урок ---------- */
function startModule(id){
  var m=modById(id);if(!m)return;
  if(locked(m)){view={name:'buy',why:'block',title:m.title};render();return;}
  var tp=m.types||[m.type],gt=m.guide||m.type;
  var items=[{kind:'explain',e:m.canon,v:0,sk:0},{kind:'explain',e:m.ex2e||gen(m.ex2||m.type),v:0,sk:0}];
  for(var a=0;a<2;a++)items.push({kind:'guide',q:mkQ(gen(gt)),phase:'Считаем вместе',w:0});
  for(var i=0;i<2;i++)items.push({kind:'ask',q:mkQ(gen(tp[i%tp.length])),phase:'Тренируемся',test:false,w:0});
  for(var j=0;j<3;j++)items.push({kind:'ask',q:mkQ(gen(tp[j%tp.length])),phase:'Проверка',test:true,w:0});
  R={mod:m,items:items,i:0,mode:'lesson'};view={name:'lesson'};startTimer();render();window.scrollTo(0,0);}
function barHtml(){var s='';R.items.forEach(function(_,i){s+='<i class="'+(i<R.i?'on':(i===R.i?'now':''))+'"></i>';});return '<div class="bar" aria-hidden="true">'+s+'</div>';}
function rRun(){
  if(!R){go({name:'home'});return;}
  if(R.i>=R.items.length){finishModule();return;}
  var it=R.items[R.i];app.innerHTML='';
  if(it.kind==='explain')rExplain(it);else if(it.kind==='guide')rGuide(it);else rAsk(it);}
function rExplain(it){
  var card=h('<section class="card lift"></section>');
  function paint(){
    var vi=it.v%3,stepper=vi===0&&isM(it.e),tot=stepper?rsteps(it.e.m,it.e.N).steps.length:0;
    card.innerHTML=barHtml()+'<div class="phase">'+(R.i===0?'Узнаём':'Ещё пример')+' · '+VNAME[vi]+'</div><h2 style="margin:0 0 8px">'+R.mod.title+'</h2><div id="expl" class="expl">'+explain(it.e,vi,it)+'</div><p class="small">Объяснение '+(vi+1)+' из 3</p><div class="row"></div>';
    var rw=$('.row',card);
    if(R.i>0){var b=h('<button type="button" class="btn ghost">Назад</button>');b.onclick=function(){R.i--;render();};rw.appendChild(b);}
    var al=h('<button type="button" class="btn ghost alt">Объясни по-другому</button>');al.onclick=function(){it.v++;M.alts[R.mod.id]=(M.alts[R.mod.id]||0)+1;save();paint();};rw.appendChild(al);
    if(stepper&&(it.sk||0)<tot){var sb=h('<button type="button" class="btn">'+((it.sk||0)?'Следующий шаг':'Покажи шаг')+'</button>');sb.onclick=function(){it.sk=(it.sk||0)+1;paint();};rw.appendChild(sb);}
    var nx=h('<button type="button" class="btn'+(stepper&&(it.sk||0)<tot?' ghost':'')+'">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);
    card.insertAdjacentHTML('beforeend','<div class="clk-corner">'+clk('think')+'</div>');}
  paint();app.appendChild(card);}

/* ---------- вопрос с ответом ---------- */
function stepsHtml(q){return '<div class="hint"><p><b>Решение по шагам</b></p>'+lines(q.steps)+'</div>';}
function ansBlock(q){
  if(q.choices)return '<div class="answer choice">'+q.choices.map(function(c,i){return '<button type="button" class="btn ghost" data-c="'+i+'">'+c+'</button>';}).join('')+'</div>';
  return '<div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div>';}
function headFor(it,r){return R.mode==='lesson'?barHtml()+'<div class="phase">'+it.phase+'</div>':'<div class="phase">'+(R.mode==='train'?'Тренажёр '+(R.i+1)+' из '+R.items.length:'')+'</div>';}
function rAsk(it){
  var q=it.q;q.first=true;var t0=Date.now();
  var card=h('<section class="card lift"></section>');
  card.innerHTML=headFor(it)+'<p class="ask-lead">'+q.lead+'</p><div class="eq'+(q.eq.length>14?' sm':'')+'">'+q.eq+'</div>'+ansBlock(q)+'<div id="fb" aria-live="polite"></div><div class="row" style="margin-top:14px"></div>';
  app.appendChild(card);
  var inp=$('#ans',card),chk=$('#chk',card),fb=$('#fb',card),rw=$('.row',card),cbs=card.querySelectorAll('[data-c]');
  if(inp)inp.focus({preventScroll:true});
  var showBtn=null;
  function next(){R.i++;render();window.scrollTo(0,0);}
  function nextBtn(){var b=h('<button type="button" class="btn">Дальше</button>');b.onclick=next;rw.appendChild(b);setTimeout(function(){b.focus();},200);}
  function addShow(){if(showBtn||it.test&&!it.done)return;showBtn=h('<button type="button" class="btn ghost">Покажи решение по шагам</button>');showBtn.onclick=function(){fb.insertAdjacentHTML('beforeend',stepsHtml(q));showBtn.remove();};rw.appendChild(showBtn);}
  function done(ok,msg){
    it.done=true;
    if(inp){inp.disabled=true;chk.textContent='Дальше';chk.disabled=false;chk.onclick=next;setTimeout(function(){chk.focus();},200);}
    else{Array.prototype.forEach.call(cbs,function(b){b.disabled=true;});nextBtn();}
    if(it.test&&R.mode==='lesson'){R.testN=(R.testN||0)+1;if(ok&&q.first)R.testOk=(R.testOk||0)+1;}
    fb.innerHTML=msg;}
  function ansTxt(){return q.choices?q.choices[q.ans]:q.ans;}
  function check(v){
    if(it.done)return;
    if(v===q.ans){
      var ms=Date.now()-t0;recordResult(q,q.first,ms);
      var rec=M.rec[q.type],extra='';
      if(q.first&&R.mode!=='lesson'&&!q.choices){var sec=Math.max(1,Math.round(ms/1000));extra='<span>За '+sec+' с.'+(rec&&rec.best===ms?' Новый личный рекорд!':(rec?' Твой рекорд: '+Math.max(1,Math.round(rec.best/1000))+' с.':''))+'</span>';}
      done(true,'<div class="fb ok hc">'+clk('joy')+'<strong>'+pick(['Верно!','Да, точно!','Правильно!','Отлично!'])+'</strong>'+extra+'</div>');return;}
    it.w++;q.first=false;
    if(it.test||it.w>=2||q.choices){
      recordResult(q,false,0);
      done(false,'<div class="fb try hc">'+clk('sorry')+'<strong>'+(it.w>=2&&!it.test?'Ничего страшного.':'Пока не получилось.')+' Правильный ответ — '+ansTxt()+'.</strong>'+stepsHtml(q)+'<span>Этот пример мы ещё повторим.</span></div>');
      if(R.mode==='train'&&R.queue)R.queue.push(q.e);return;}
    fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ой, я тоже иногда путаюсь. Давай посмотрим ещё раз.</strong><div class="hint">'+q.hint+'</div><span>Попробуй ещё раз.</span></div>';
    addShow();inp.value='';inp.focus();}
  function fromInput(){var raw=String(inp.value).trim();if(raw===''||isNaN(Number(raw))){fb.innerHTML='<div class="fb try"><strong>Введи число.</strong></div>';return;}check(Number(raw));}
  if(inp){chk.onclick=fromInput;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)(chk.textContent==='Дальше')?next():fromInput();};}
  Array.prototype.forEach.call(cbs,function(b){b.onclick=function(){check(Number(b.getAttribute('data-c')));};});}

/* ---------- считаем вместе: пишем цифры ответа по одной ---------- */
function rGuide(it){
  var q=it.q,g=mkG(q.e),k=0,ms=0,card=h('<section class="card lift"></section>'),t0=Date.now();
  card.innerHTML=headFor(it)+'<p class="ask-lead">'+q.lead+' Вместе: ты пишешь по одной цифре ответа.</p><div class="eq'+(q.eq.length>14?' sm':'')+'">'+q.eq+'</div><div id="vis"></div><div id="gp" class="gp"></div><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" enterkeyhint="go" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div><div id="fb" aria-live="polite"></div>';
  app.appendChild(card);
  var inp=$('#ans',card),chk=$('#chk',card),fb=$('#fb',card),gp=$('#gp',card),vis=$('#vis',card),fin=false;
  function paint(){
    if(g.vis)vis.innerHTML=g.vis(k);
    if(k>=g.steps.length){fin=true;recordResult({type:q.type,key:q.key,e:q.e,first:it.w===0},it.w===0,0);
      gp.innerHTML='<p><b>Готово! Ответ: '+q.ans+'.</b></p>';inp.disabled=true;chk.textContent='Дальше';chk.disabled=false;chk.onclick=next;setTimeout(function(){chk.focus();},200);return;}
    var s=g.steps[k];gp.innerHTML='<p>'+s.p+'</p>'+(s.sub?'<p class="small">'+s.sub+'</p>':'');inp.value='';inp.disabled=false;inp.focus({preventScroll:true});ms=0;}
  function next(){R.i++;render();window.scrollTo(0,0);}
  function check(){
    if(fin){next();return;}
    var raw=String(inp.value).trim();if(raw===''||isNaN(Number(raw))){fb.innerHTML='<div class="fb try"><strong>Введи число.</strong></div>';return;}
    var v=Number(raw),s=g.steps[k];
    if(s.acc.indexOf(v)>=0){fb.innerHTML='<div class="fb ok hc">'+clk('joy')+'<strong>'+pick(['Верно!','Да!','Точно!'])+'</strong>'+(s.ok?'<span>'+s.ok+'</span>':'')+'</div>';k++;paint();return;}
    it.w++;ms++;
    if(ms>=2){fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ничего страшного. Здесь пишем '+s.acc[0]+'.</strong><div class="hint">'+s.hint+'</div><span>Идём дальше.</span></div>';k++;paint();return;}
    fb.innerHTML='<div class="fb try hc">'+clk('sorry')+'<strong>Ой, давай посмотрим ещё раз.</strong><div class="hint">'+s.hint+'</div><span>Попробуй ещё раз.</span></div>';inp.value='';inp.focus();}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter'||e.keyCode===13)check();};
  paint();}

function finishModule(){
  stopTimer();var m=R.mod,n=R.testN||3,ok=R.testOk||0;
  var st=ok>=n?3:(ok>=Math.ceil(n*2/3)?2:1);
  M.done[m.id]=true;M.stars[m.id]=Math.max(M.stars[m.id]||0,st);save();
  view={name:'done',id:m.id,ok:ok,n:n,st:st};render();}
function rDone(){
  var m=modById(view.id),idx=MODS.indexOf(m),nx=MODS[idx+1];
  app.innerHTML='<section class="card lift"><div class="clk-top">'+clk('party')+'</div><div class="phase">Модуль пройден</div><div class="big-stars" aria-label="'+view.st+' из 3">'+starsStr(view.st)+'</div><h2 style="margin:14px 0 10px">'+(view.st>=2?'Ты освоил приём':'Хорошее начало')+'</h2><p>В проверке с первого раза верно: '+view.ok+' из '+view.n+'. '+(view.st<3?'Пример, где была ошибка, вернётся в тренажёре.':'')+'</p><p class="small">Чтобы приём закрепился, вернись к нему в тренажёре завтра.</p><div class="row">'+(nx&&!locked(nx)?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий модуль</button>':(nx?'<button type="button" class="btn" data-v="plans">Открыть следующий модуль</button>':''))+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">К модулям</button></div></section>';}

/* ---------- тренажёр: адаптивный подбор ---------- */
function availTypes(){return tier()==='free'?['qk']:ALL_T.slice();}
function pickType(types){var w=types.map(function(t){return 1+4*badRate(t);}),sum=w.reduce(function(a,b){return a+b;},0),r=Math.random()*sum;for(var i=0;i<types.length;i++){r-=w[i];if(r<=0)return types[i];}return types[0];}
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
  app.innerHTML='<section class="card lift"><p class="kicker">5–10 минут в день</p><h1>Тренажёр</h1><p class="lead" style="margin-top:12px">Около десяти примеров. Таймера на вопросах нет: мы лишь запоминаем твоё лучшее время. Если пример не получился, он вернётся позже.</p>'
   +(weak.length?'<p>Чаще попадутся: <b>'+weak.join(', ')+'</b>.</p>':'<p class="small">Пока мы изучаем, что тебе даётся легко, а что труднее.</p>')
   +(atLeast('pro')?'<p class="small">Примеров на повторении: '+sr+'. Они возвращаются через 1, 3, 7 и 14 дней.</p>':'<p class="small">В бесплатной версии тренажёр даёт быстрые вопросы про соседа, половину и «до 10», до '+FREE_MIN+' минут в день. Умножение и остальные приёмы откроет тариф «Быстрый счёт» или «Комбо».</p>')
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
var _rRun=rRun;
rRun=function(){
  if(!R){go({name:'home'});return;}
  if(R.mode==='train'){
    if(tier()==='free'&&usedMin()>=FREE_MIN&&R.i>0){stopTimer();view={name:'buy',why:'limit'};R=null;render();return;}
    if(R.i>=R.items.length){
      if(!R.repeated&&R.queue.length){R.repeated=true;R.queue.slice(0,3).forEach(function(e){R.items.push({kind:'ask',q:mkQ(e),phase:'Повторим',test:false,w:0});});}
      else{finishRun();return;}}
    app.innerHTML='';rAsk(R.items[R.i]);return;}
  _rRun();};

/* ---------- кабинет родителя ---------- */
function exportData(){return {app:'trahtenberg',schemaVersion:1,exportedAt:new Date().toISOString(),progress:JSON.parse(JSON.stringify(M))};}
function rParent(){
  var rows=ALL_T.map(function(t){var s=M.stats[t]||{ok:0,bad:0},tot=s.ok+s.bad,rec=M.rec[t];return '<div><span>'+TYPES[t].name+'</span><b>'+(tot?Math.round(100*s.ok/tot)+'% верно · '+tot+' '+pl(tot,'пример','примера','примеров'):'пока нет данных')+(rec?' · рекорд '+Math.max(1,Math.round(rec.best/1000))+' с':'')+'</b></div>';}).join('');
  var mins=Math.round((M.days[dayKey()]||0)/60);
  app.innerHTML='<section class="card lift"><p class="kicker">Родителям</p><h1>Прогресс по быстрому счёту</h1><p class="lead" style="margin-top:12px">Занятия сегодня: '+mins+' мин. Лучше 5–10 минут каждый день, чем час раз в неделю.</p></section>'
   +'<section class="card" style="margin-top:14px"><h3>Модули</h3><div class="bars">'+MODS.map(function(m){return '<div><span>'+m.title+'</span><b>'+(M.done[m.id]?starsStr(M.stars[m.id]||1):(locked(m)?'закрыт':'не пройден'))+'</b></div>';}).join('')+'</div></section>'
   +'<section class="card" style="margin-top:14px"><h3>Над чем поработать</h3><div class="bars">'+rows+'</div><p class="small">Примеры, которые давались трудно, тренажёр показывает чаще. «Верно» считается по всем попыткам.</p></section>'
   +'<section class="card" style="margin-top:14px"><h3>Доступ</h3><p class="small">«Быстрый счёт по Трахтенбергу»: <b>'+TIER_NAME[tier()]+'</b>. «Умножение»: <b>'+TIER_NAME[mainMult]+'</b>. «Устный счёт»: <b>'+TIER_NAME[mainMental]+'</b>. «Ментальная арифметика»: <b>'+TIER_NAME[mainAbak]+'</b>. Коды тарифа «Комбо» открывают все четыре тренажёра сразу.</p><div class="row"><button type="button" class="btn ghost" data-v="plans">Тарифы и код доступа</button><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="trainer.html">Умножение</a><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="mental.html">Устный счёт</a><a class="btn ghost" style="text-decoration:none;display:inline-flex;align-items:center" href="abakus.html">Ментальная арифметика</a></div></section>'
   +'<section class="card" style="margin-top:14px"><h3>Сохранить прогресс</h3><p class="small">Прогресс хранится в браузере этого устройства. Сохраните файл, чтобы перенести его на другое устройство.</p><div class="row"><button type="button" class="btn" id="exp">Экспортировать</button><label class="btn ghost" for="imp" style="cursor:pointer">Импортировать</label><input type="file" id="imp" accept="application/json,.json" hidden></div><div id="expmsg" class="small" aria-live="polite"></div></section>'
   +'<p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">К модулям</button></p>';
  $('#exp').onclick=function(){
    var txt=JSON.stringify(exportData(),null,1),msg=$('#expmsg');
    try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='trahtenberg-progress-'+dayKey()+'.json';document.body.appendChild(a);a.click();a.remove();msg.textContent='Файл сохранён. Если он не появился в загрузках, скопируйте текст ниже.';}catch(e){msg.textContent='Не получилось сохранить файл. Скопируйте текст ниже.';}
    msg.insertAdjacentHTML('afterend','<textarea class="ans" style="width:100%;height:120px;font-size:13px" readonly>'+txt.replace(/</g,'&lt;')+'</textarea>');};
  $('#imp').onchange=function(){var f=this.files[0],msg=$('#expmsg');if(!f)return;if(f.size>2e6){msg.textContent='Файл слишком большой.';return;}
    var r=new FileReader();r.onload=function(){var o;try{o=JSON.parse(r.result);}catch(e){msg.textContent='Файл повреждён: это не JSON.';return;}
      if(!o||o.app!=='trahtenberg'||!o.progress){msg.textContent='Это не файл прогресса «Быстрого счёта».';return;}
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
  /* g: {mult, mental, trach}. Свой тариф хранится здесь и дублируется в общую запись, чтобы его увидели «Умножение» и «Устный счёт». */
  if(g.trach&&RANK[g.trach]>RANK[M.tier]){M.tier=g.trach;save();}
  Store.get('progress').then(function(v){
    v=(v&&typeof v==='object')?v:{};
    var ch=false,ti=function(x){return RANK[x]||0;};
    if(g.trach&&ti(g.trach)>ti(v.tierTrach)){v.tierTrach=g.trach;ch=true;mainTier=g.trach;}
    if(g.mental&&ti(g.mental)>ti(v.tierMental)){v.tierMental=g.mental;ch=true;mainMental=g.mental;}
    if(g.abak&&ti(g.abak)>ti(v.tierAbak)){v.tierAbak=g.abak;ch=true;mainAbak=g.abak;}
    if(g.mult&&ti(g.mult)>ti(v.tierMult)){v.tierMult=g.mult;v.tier=g.mult;ch=true;mainMult=g.mult;}
    if(ch){v.adv=true;return Store.put('progress',v);}}).catch(function(){});}
function tryCode(code,msg,ok){
  if(!(window.crypto&&crypto.subtle)){msg.textContent='Проверка кода недоступна в этом браузере.';return;}
  if(!anyCodes()){msg.textContent='Коды доступа ещё не настроены.';return;}
  sha256hex(String(code).trim().toUpperCase()).then(function(hx){
    var g=codeGrant(hx);
    if(!g){msg.textContent='Код не подошёл. Проверьте, нет ли лишних символов.';return;}
    var nt=g.trach&&RANK[g.trach]>RANK[tier()],nm=g.mental&&RANK[g.mental]>RANK[mainMental],nu=g.mult&&RANK[g.mult]>RANK[mainMult],na=g.abak&&RANK[g.abak]>RANK[mainAbak];
    if(!nt&&!nm&&!nu&&!na){msg.textContent='Этот код ничего не добавит: у вас уже открыт такой тариф или выше.';return;}
    applyTier(g);ok();}).catch(function(){msg.textContent='Не удалось проверить код.';});}
function rBuy(){
  var why=view.why||'plans',title,lead;
  if(why==='limit'){title='На сегодня всё!';lead='Бесплатный доступ: '+FREE_MIN+' минут занятий в день. Прогресс сохранён. Чтобы заниматься без ограничений, выберите «Быстрый счёт» или «Комбо». Завтра бесплатные минуты появятся снова.';}
  else if(why==='block'){title='Модуль «'+(view.title||'')+'» входит в платные тарифы';lead='В бесплатной версии открыт первый модуль «Сосед и нулик». Остальные модули откроет тариф «Быстрый счёт» или «Комбо». Оплата один раз, без подписки.';}
  else{title='Тарифы';lead='Бесплатная версия остаётся навсегда: модуль «Сосед и нулик» и быстрые вопросы до '+FREE_MIN+' минут в день. Платные тарифы оплачиваются один раз, без подписки. Коды «Комбо» открывают все три тренажёра сразу.';}
  app.innerHTML='<section class="card lift"><h1 style="margin:0 0 10px">'+title+'</h1><p class="lead">'+lead+'</p></section>'+tariffCols('trach')
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
  Store.get('trach').then(function(v){storage.mode='idb';if(v)M=adopt(v);})
   .catch(function(){storage.mode='memory';})
   .then(function(){return Store.get('progress').then(function(v){if(v){if(RANK[v.tierTrach]!==undefined)mainTier=v.tierTrach;if(RANK[v.tierAbak]!==undefined)mainAbak=v.tierAbak;if(RANK[v.tierMental]!==undefined)mainMental=v.tierMental;if(RANK[v.tierMult]!==undefined)mainMult=v.tierMult;else if(RANK[v.tier]!==undefined)mainMult=v.tier;}}).catch(function(){});})
   .then(function(){render();});}
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});}
boot();
})();
