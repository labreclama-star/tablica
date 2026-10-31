
(function(){
'use strict';
/* ---------- утилиты ---------- */
var app=document.getElementById('app');
function h(html){var t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstChild;}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[ri(0,a.length-1)];}
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ---------- прогресс (хранится в этом браузере) ---------- */
var KEY='tbl.v1';
var P={done:{},stars:{},attempts:{},stats:{},days:{},low:{},age:7};
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);for(var k in o)P[k]=o[k];}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(P));}catch(e){}}
function fk(f){return Math.min(f[0],f[1])+'×'+Math.max(f[0],f[1]);}
function rec(f,ok){if(!f)return;var k=fk(f);var s=P.stats[k]||(P.stats[k]={ok:0,bad:0});if(ok)s.ok++;else s.bad++;save();}

/* ---------- наглядность ---------- */
function rect(a,b,o){o=o||{};var s='';for(var r=0;r<b;r++)for(var c=0;c<a;c++)s+='<i'+(o.split&&c>=o.split?' class="c2"':'')+'></i>';
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
  function draw(){out.innerHTML=rect(a,b)+'<div class="eq sm">В ряду '+a+', рядов '+b+': '+a+' × '+b+' = <b>'+(a*b)+'</b></div>';}
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
    ?groups(n,1)+'<div class="eq sm">'+n+' × 1 = <b>'+n+'</b></div><p class="small" style="margin:0">Одна группа по '+n+': сколько было, столько и осталось.</p>'
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
    rd.innerHTML='9 × '+k+': загнули палец '+k+'. Слева пальцев: '+(k-1)+' (десятки). Справа: '+(10-k)+' (единицы). Получилось <b>'+9*k+'</b>.';};
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
    case 1:return 'Умножить на 1: число не меняется. '+n+' × 1 = '+n+'.';
    case 10:return 'Умножить на 10: допиши ноль справа. К числу '+n+' допиши 0. Какое число получилось?';
    case 9:return '9 × '+n+' = 10 × '+n+' − '+n+'. Сначала 10 × '+n+' = '+10*n+'. Теперь вычти '+n+': '+10*n+' − '+n+' = ?';
    case 5:return '5 × '+n+' — это половина от 10 × '+n+'. 10 × '+n+' = '+10*n+'. Чему равна половина от '+10*n+'?';
    case 2:return '2 × '+n+' = '+n+' + '+n+'. Сложи.';
    case 4:return '4 × '+n+': удвой '+n+', будет '+2*n+'. Удвой ещё раз: '+2*n+' + '+2*n+' = ?';
    case 3:return '3 × '+n+' = 2 × '+n+' + '+n+'. Сначала '+n+' + '+n+' = '+2*n+'. Теперь прибавь ещё '+n+': '+2*n+' + '+n+' = ?';
    case 6:return '6 × '+n+' = 5 × '+n+' + '+n+'. 5 × '+n+' = '+5*n+'. Прибавь '+n+': '+5*n+' + '+n+' = ?';
    case 8:return '8 × '+n+': сначала 4 × '+n+' = '+4*n+'. Удвой: '+4*n+' + '+4*n+' = ?';
    default:return '7 × '+n+' = 5 × '+n+' + 2 × '+n+'. 5 × '+n+' = '+5*n+', 2 × '+n+' = '+2*n+'. Сложи: '+5*n+' + '+2*n+' = ?';}}
function seq(d,upto){var s=[];for(var i=1;i<=Math.max(upto,1);i++)s.push(d*i);return s.join(', ');}
function hint(q,level){
  if(q.h&&q.h[level-1])return q.h[level-1]();
  var m=q.meta;
  if(m.t==='mul')return level===1?'<p>'+m.a+' × '+m.b+' значит: число '+m.a+' берём '+m.b+' раз. Вот '+m.b+' рядов по '+m.a+' клеток.</p>'+rect(m.a,m.b)+'<p class="mono">'+sumLine(m.a,m.b)+'</p>':'<p>'+strat(m.a,m.b)+'</p>';
  if(m.t==='div'){var qq=m.n/m.d;return level===1?'<p>Разложим '+m.n+' по '+m.d+'. Сколько групп получится? Посчитай их.</p>'+groups(m.d,qq):'<p>Считай по '+m.d+': '+seq(m.d,qq-1)+', … Сколько раз по '+m.d+' нужно взять, чтобы получить '+m.n+'? Вспомни: '+m.d+' × ? = '+m.n+'.</p>';}
  if(m.t==='missing')return level===1?'<p>Поменяем множители местами: '+m.b+' × ? = '+m.x*m.b+'. Сколько раз по '+m.b+' нужно взять? Посчитай группы.</p>'+groups(m.b,m.x):'<p>Считай по '+m.b+': '+seq(m.b,m.x-1)+', … Когда дойдёшь до '+m.x*m.b+', сколько раз ты взял '+m.b+'?</p>';
  return '';}

/* ---------- уровень объяснения ---------- */
function lvLevel(){return (typeof P.age==='number'&&P.age>=3&&P.age<=12)?P.age:7;}
function eff(){return Math.max(3,lvLevel()-((R&&R.boost)||0));}
function tier(){var e=eff();return e<=4?'A':(e<=6?'B':(e<=8?'C':'D'));}
function ageWord(a){return a+'-летнего';}
function pickT(o,t){t=t||tier();if(!o)return '';if(t==='D')return o.D||o.C;if(t==='B')return o.B||o.A||o.C;if(t==='A')return o.A||o.B||o.C;return o.C;}
function times(n){var a=n%10,b=n%100;return n+' '+((a>=2&&a<=4&&!(b>=12&&b<=14))?'раза':'раз');}
function simpleHint(q){var m=q.meta;
  if(q.h&&q.h[0])return q.h[0]();
  if(m.t==='mul')return '<p>Число '+m.a+' берём '+times(m.b)+'. Считаем вместе, по одному кружку.</p>'+groups(m.a,m.b);
  if(m.t==='div')return '<p>Разложим '+m.n+' кружков по '+m.d+'. Сколько кучек получилось?</p>'+groups(m.d,m.n/m.d);
  if(m.t==='missing')return '<p>Сколько кучек по '+m.b+' нужно, чтобы стало '+m.x*m.b+'?</p>'+groups(m.b,m.x);
  return hint(q,1);}
function lvlBar(onSimpler,onChange){
  var e=eff(),b=e<lvLevel();
  var w=h('<section class="card lvl"><div class="lvl-h"><label for="lv">Объясняю как для <b></b> ребёнка</label></div><input id="lv" type="range" min="3" max="12" step="1"><div class="ticks" aria-hidden="true"><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span></div></section>');
  var lab=w.querySelector('b'),inp=w.querySelector('input');
  function paint(v,boost){lab.textContent=ageWord(v)+(boost?' (стало проще)':'');inp.setAttribute('aria-valuetext',v+' лет');}
  inp.value=e;paint(e,b);
  inp.oninput=function(){var v=+inp.value;P.age=v;if(R)R.boost=0;save();paint(v,false);app.dataset.tier=tier();};
  inp.onchange=function(){if(onChange)onChange();};
  if(onSimpler){var bt=h('<button type="button" class="btn ghost">'+(e===3?'Проще некуда':'Объясни ещё проще')+'</button>');bt.disabled=e===3;bt.onclick=onSimpler;w.querySelector('.lvl-h').appendChild(bt);}
  return w;}

var TX={
'm1.0':{A:'Смотри: коробки. В каждой коробке по 4 конфеты. Коробок две. Сколько всего конфет? Нажимай плюс и минус: коробок станет больше. Когда коробки одинаковые, мы умножаем.',B:'Одинаковые коробки: в каждой по 4 конфеты, коробок две. Считать можно так: 4 и ещё 4. Это короткая запись: 4 × 2. Нажимай плюс и минус и смотри, как меняется ответ.',D:'Умножение — сокращённая запись суммы одинаковых слагаемых: 4 × 2 = 4 + 4. Первое число показывает, что повторяем, второе — сколько раз. Меняй числа и смотри, как растёт сумма.'},
'm1.1':{A:'Теперь конфеты лежат рядами, как плитка шоколада. В каждом ряду по 4 конфеты. Рядов два. Считаем все вместе. Нажимай плюс и минус.',B:'Те же конфеты можно выложить рядами, как шоколадку. 4 в ряду, рядов два. Всего столько, сколько в 4 × 2. Нажимай плюс и минус.',D:'Произведение a × b равно числу клеток прямоугольника: a клеток в ряду, b рядов. Так считают площадь. Меняй стороны и ищи закономерность.'},
'm2.0':{A:'Смотри на плитку шоколада. Положим её набок. Конфет стало больше или меньше? Столько же! Нажми «Повернуть».',B:'Повернём плитку набок. Было 3 ряда по 4, стало 4 ряда по 3. Конфет столько же. Нажми «Повернуть». Значит, 3 × 4 и 4 × 3 — одно и то же.',D:'Переместительное свойство: a × b = b × a. Поворот прямоугольника не меняет число клеток. Проверь на трёх парах.'},
'm2.1':{A:'Знаешь про одну плитку — знаешь и про повёрнутую. Учить нужно меньше. Это хорошо!',B:'Если знаешь 6 × 8, то знаешь и 8 × 6. Учить нужно почти вдвое меньше примеров. Здорово, правда?',D:'Из 100 примеров таблицы достаточно знать около 55: остальные получаются перестановкой. Примеры на диагонали, вроде 7 × 7, пар не имеют.'},
'm3.0':{A:'Это большая плитка с числами. Нажми на любую клетку и увидишь число. Это число — сколько всего.',B:'Это квадрат с числами. Выбери клетку: число в ней — строка, умноженная на столбец. Нажми и посмотри.',D:'Квадрат Пифагора: на пересечении строки i и столбца j стоит i × j. Исследуй: в какой строке числа растут через 3?'},
'm3.1':{A:'Видишь зеркало? Жёлтая клетка и её зеркальная пара — одинаковые числа. Нажимай!',B:'Синяя линия — диагональ. По бокам от неё числа повторяются, как в зеркале. Нажми на клетку и найди пару.',D:'Таблица симметрична относительно диагонали, на которой стоят квадраты 1, 4, 9 и дальше. Используй симметрию: i × j = j × i.'},
'm4.0':{A:'Одна тарелка, на ней несколько печенек. Сколько всего? Столько же, сколько на тарелке. Выбери число.',B:'Одна коробка с 5 конфетами — это 5 конфет. Умножить на 1 — число не меняется. Выбери число.',D:'a × 1 = a, потому что слагаемое взято один раз. Проверь на нескольких числах.'},
'm4.1':{A:'Десять тарелок. На каждой по 3 печеньки. Много! Получается 30. Видишь, рядом с тройкой появился ноль?',B:'Десять коробок по 3 конфеты — это 30. К тройке дописали ноль справа. Так всегда: умножить на 10 — дописать 0.',D:'a × 10 — это «a десятков», то есть число a0. Цифра сдвигается на один разряд влево.'},
'm5.0':{A:'Пара носков. В паре два носка. Сколько носков в нескольких парах? Выбери число. Сколько было, столько и ещё столько.',B:'Умножить на 2 — взять число два раза: 3 + 3 = 6. Выбери число и смотри.',D:'a × 2 = a + a — это удвоение. Заметь: результат умножения на 2 всегда чётный.'},
'm5.1':{A:'Было 3, стало 6. Удвоили ещё раз — стало 12. Так считаем по четыре.',B:'Чтобы умножить на 4, удвой, а потом ещё раз удвой: 3, 6, 12.',D:'a × 4 = (a × 2) × 2. Двойное удвоение — быстрый путь для ×4, а для ×8 удвой ещё раз.'},
'm6.0':{A:'На одной ладошке 5 пальчиков. Сначала посчитаем десятки, а потом возьмём половину. Выбери число ладошек.',B:'Пять — это половина десяти. Умножаем на 10, потом берём половину. Выбери число.',D:'5 × n = (10 × n) ÷ 2. Последняя цифра результата: 0 при чётном n и 5 при нечётном.'},
'm6.1':{A:'Пятёрки заканчиваются на 0 или на 5. Жёлтые — на ноль. Как стрелка на часах.',B:'Все ответы в пятёрках оканчиваются на 0 или на 5. Жёлтые на 0, остальные на 5.',D:'Ряд ×5 чередует окончания 5 и 0. На часах он соответствует минутам: каждые пять минут.'},
'm7.0':{A:'Покажи десять пальчиков. Загни один пальчик — получится ответ! Слева пальцы — десятки, справа — единицы. Выбери палец.',B:'Фокус! Загни палец с номером числа, на которое умножаешь 9. Пальцы слева — десятки, справа — единицы.',D:'Метод пальцев работает, потому что 9k = 10(k − 1) + (10 − k). Проверь формулу на нескольких числах.'},
'm7.1':{A:'Девять — это десять без одного. Сначала десять, потом убрали один. Выбери число.',B:'9 × 7 — это 10 × 7 без одного 7. А сумма цифр в ответе всегда 9.',D:'9n = 10n − n. Сумма цифр у первых десяти кратных девяти равна 9: так можно проверить ответ.'},
'm8.0':{A:'Если трудно, разбей на кусочки. Одна часть — синие клеточки, другая — жёлтые. Считаем сначала синие, потом жёлтые.',B:'Разбей число на две части. Каждую часть ты уже знаешь. Синие и жёлтые клетки — две части.',D:'Распределительное свойство: (p + q) × n = p × n + q × n. Разбивай множитель на знакомые числа.'},
'm8.1':{A:'Выбери другое число. Смотри, как кусочки складываются в целое.',B:'Выбери другое число и посмотри, какие знакомые примеры спрятались внутри.',D:'Выбирай удобное разбиение: 7 = 5 + 2 или 7 = 10 − 3. Сравни оба способа.'},
'm9.0':{A:'У тебя конфеты. Положим их в мешочки поровну. Сколько мешочков получится? Выбери пример.',B:'12 ÷ 3: раскладываем 12 конфет по 3 в мешочек. Получается 4 мешочка. Выбери пример.',D:'Деление — разбиение на равные части: 12 ÷ 3 = 4 значит, что тройка помещается в 12 четыре раза. Исследуй примеры.'},
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
m6:'На одной руке 5 пальцев. На двух руках 10. На трёх руках 15: десять и ещё пять.',
m7:'Девять — почти десять. Было десять конфет, одну съели. Стало на одну меньше.',
m8:'Большую башню можно сложить из двух маленьких. Сначала посчитай одну, потом другую, потом обе вместе.',
m9:'Раздавай конфеты по очереди: тебе, маме, папе, снова тебе, маме, папе. Когда конфеты кончились, посмотри, сколько у каждого.',
m10:'Три пакета по 4 конфеты. Высыпали все — стало 12. Разложили обратно по 4 — опять 3 пакета. Туда и обратно.'
};

/* ---------- блоки курса ---------- */
function rotHints(a,b,t2){return [function(){return '<p>Поверни прямоугольник: клеток столько же.</p><div class="pair">'+rect(a,b)+rect(b,a)+'</div>';},function(){return '<p>'+t2+'</p>';}];}
function tblHints(r,c){return [function(){return '<p>Найди строку '+r+' и столбец '+c+'. Клетка на пересечении — наша.</p>'+pyth({r:r,c:c,diag:true});},function(){return '<p>Строка '+r+', столбец '+c+': это '+r+' × '+c+'. Если забыл, вспомни зеркальную пару '+c+' × '+r+'.</p>';}];}

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
  {title:'Ещё раз удвоить',text:'Умножить на 4 — это удвоить, а потом удвоить ещё раз. 4 × 3: сначала 6, потом 12.',mount:mDouble}],
 alt:{text:'Носки продают парами. В паре 2 носка. В 6 парах будет 6 × 2 = 12 носков. А четыре пары перчаток — это 4 пары по 2, потом ещё раз по 2: всё те же удвоения.',mount:function(b){b.append(h(groups(2,6)));}},
 practice:function(){return build([function(){return Mul(2,ri(2,9));},function(){return Mul(4,ri(2,6));}],3);},
 test:function(){return build([function(){return Mul(2,ri(2,10));},function(){return Mul(ri(2,10),2);},function(){return Mul(4,ri(2,10));},function(){return Mul(ri(2,10),4);},function(){var n=ri(2,10);return Mul(4,n,{key:'dd'+n,lead:'Удвой число '+n+', потом удвой результат. Что получилось?',eq:'?',fact:[4,n]});}],5);}},

{id:'m6',tag:'× 5',title:'Пятёрка — половина десятки',goal:'Считать ×5 через ×10: берём половину.',
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
  {title:'Попробуй разные числа',text:'Выбери другое число и другое множитель. Следи, какие знакомые примеры прячутся внутри.',mount:mSplit}],
 alt:{text:'Не помнишь 7 × 6? Не страшно. 5 × 6 = 30 ты знаешь, 2 × 6 = 12 тоже. Сложи: 30 + 12 = 42. Любой пример можно собрать из знакомых.',mount:function(b){b.append(h(rect(7,6,{split:5})));}},
 practice:function(){return build([function(){return Mul(pick([3,6]),ri(2,9));}],3);},
 test:function(){return build([function(){return Mul(pick([3,6,7,8]),ri(2,10));},function(){return Mul(ri(2,10),pick([3,6,7,8]));},function(){var n=ri(2,9);return Mul(6,n,{key:'s6'+n,lead:'6 × '+n+' = 5 × '+n+' + '+n+' = '+5*n+' + '+n+' = ?',eq:'?',fact:[6,n]});},function(){var n=ri(2,9);return Mul(7,n,{key:'s7'+n,lead:'7 × '+n+' = 5 × '+n+' + 2 × '+n+' = '+5*n+' + '+2*n+' = ?',eq:'?',fact:[7,n]});}],5);}},

{id:'m9',tag:'12 ÷ 3',title:'Деление: раздаём поровну',goal:'Понять деление как раскладывание на равные группы.',
 steps:[
  {title:'Раскладываем',text:'12 ÷ 3: берём 12 предметов и раскладываем по 3. Получается 4 группы. Попробуй другие примеры.',mount:mDivide},
  {title:'Делим поровну',text:'Переключи на «Делим поровну». Теперь 12 раздали 3 частям, и в каждой по 4. Ответ тот же, а вопрос другой.',mount:mDivide}],
 alt:{text:'У тебя 12 конфет. Если сложить в пакеты по 3, пакетов будет 4. Если раздать 3 друзьям поровну, каждому достанется 4. Оба раза 12 ÷ 3 = 4.',mount:function(b){b.append(h(groups(3,4)));}},
 practice:function(){return build([function(){var d=ri(2,4),q=ri(2,4);return Div(d*q,d,{lead:'Раздели поровну. Сколько получится?',vis:groups(d,q)});}],3);},
 test:function(){return build([function(){var d=ri(2,5),q=ri(2,5);return Div(d*q,d,{key:'dv'+d+'dv'+q,lead:'Раздели поровну.',vis:groups(d,q)});},function(){var d=ri(2,6),q=ri(2,6);return Div(d*q,d,{key:'w1'+d+'w'+q,lead:d*q+' конфет разложили по '+d+' в пакеты. Сколько пакетов?',eq:'?'});},function(){var d=ri(2,6),q=ri(2,6);return Div(d*q,d,{key:'w2'+d+'w'+q,lead:d*q+' яблок раздали поровну '+d+' детям. Сколько яблок у каждого?',eq:'?'});}],5);}},

{id:'m10',tag:'3×4 ↔ 12÷3',title:'Умножение и деление — родственники',goal:'Научиться делить через умножение: 56 ÷ 7 — это 7 × ? = 56.',
 steps:[
  {title:'Одна семья из четырёх примеров',text:'Три числа дают четыре записи. Выбери пару и посмотри, как умножение превращается в деление.',mount:mFamily},
  {title:'Не помнишь деление — спроси умножение',text:'56 ÷ 7: спроси себя, 7 умножить на что даст 56. Нажми кнопку и посмотри.',mount:mAskMul}],
 alt:{text:'Деление — это умножение наоборот. Если 6 × 7 = 42, то из 42 можно снова получить 6 и 7: 42 ÷ 6 = 7 и 42 ÷ 7 = 6.',mount:function(b){b.append(h(rect(6,7)));}},
 practice:function(){return build([function(){var a=ri(2,6),b=ri(2,6);return Div(a*b,a);}],3);},
 test:function(){return build([function(){var a=ri(2,9),b=ri(2,9);return Div(a*b,a);},function(){return Miss(ri(2,9),ri(2,9));},function(){var a=ri(2,9),b=ri(2,9);return Div(a*b,a,{key:'fm'+a+'f'+b,lead:a+' × '+b+' = '+a*b+'. Значит '+a*b+' ÷ '+a+' = ?',eq:'?'});}],5);}}
];

/* ---------- тренажёр ---------- */
function pickTrain(n){
  var facts=[];for(var a=2;a<=10;a++)for(var b=a;b<=10;b++)facts.push([a,b]);
  function w(f){var s=P.stats[fk(f)]||{ok:0,bad:0};return 1+5*s.bad/(s.ok+s.bad+1);}
  var out=[],seen={},t=0;
  while(out.length<n&&t<400){t++;var tot=0;facts.forEach(function(f){tot+=w(f);});var r=Math.random()*tot,f=facts[0];
    for(var i=0;i<facts.length;i++){r-=w(facts[i]);if(r<=0){f=facts[i];break;}}
    var a2=f[0],b2=f[1];if(Math.random()<.5){var x=a2;a2=b2;b2=x;}
    var kind=pick(['mul','div','mul','miss']),q;
    if(kind==='mul')q=Mul(a2,b2);else if(kind==='div')q=Div(a2*b2,a2);else q=Miss(a2,b2);
    if(seen[q.key])continue;seen[q.key]=1;out.push(q);}
  return out;}

/* ---------- маршрутизация ---------- */
var view={name:'home'},R=null;
var NAMES={home:'home',run:'home',train:'train',table:'table',parent:'parent'};
function go(v){view=v;render();window.scrollTo(0,0);}
function render(){
  document.querySelectorAll('.nav button').forEach(function(b){if(b.dataset.v===NAMES[view.name])b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  app.innerHTML='';app.dataset.tier=tier();
  ({home:rHome,run:rRun,train:rTrainStart,table:rTable,parent:rParent})[view.name]();}

function starsStr(n){return '★'.repeat(n)+'☆'.repeat(3-n);}
function rHome(){
  var next=null,idx=-1;for(var i=0;i<MODS.length;i++){if(!P.done[MODS[i].id]){next=MODS[i];idx=i;break;}}
  var cards=MODS.map(function(m,i){var d=P.done[m.id];var st=d?'<span class="stars" aria-label="'+P.stars[m.id]+' из 3">'+starsStr(P.stars[m.id]||2)+'</span> пройдено':(next&&next.id===m.id?'Следующий':'Новое');
    return '<button type="button" class="mod'+(d?' done':'')+'" data-start="'+m.id+'"><span class="mod-n">Блок '+(i+1)+'</span><span class="mod-tag">'+m.tag+'</span><span class="mod-t">'+m.title+'</span><span class="mod-s">'+st+'</span></button>';}).join('');
  var today=next?'<div><b>Сегодня: блок '+(idx+1)+'</b><span>'+next.title+'. Хватит 5–10 минут.</span></div><button type="button" class="btn" data-start="'+next.id+'">'+(idx===0&&!Object.keys(P.done).length?'Начать':'Продолжить')+'</button>':'<div><b>Все блоки пройдены</b><span>Тренажёр подберёт примеры, которые пока даются труднее.</span></div><button type="button" class="btn" data-v="train">В тренажёр</button>';
  app.innerHTML='<section class="card lift"><p class="kicker">Для детей от 3 до 12 лет</p><h1>Таблица без зубрёжки</h1><p class="lead" style="margin-top:12px">Сначала понимаем, как устроено умножение и деление, потом запоминаем. В каждом блоке объяснение, несколько задач и короткая проверка. Если что-то не получилось, объясним по-другому и дадим попробовать снова. Ошибка здесь часть учёбы. Ползунком ниже можно сделать объяснение проще или сложнее: от 3 до 12 лет.</p><div class="today">'+today+'</div></section><h2>Блоки</h2><div class="mods">'+cards+'</div><p class="small" style="margin-top:18px">Один блок удобно проходить 3–7 дней: в первый день урок и проверка, потом по 5 минут в тренажёре.</p>';var hl=h('<div><h2>Как объяснять</h2></div>');hl.appendChild(lvlBar(null,null));app.insertBefore(hl,app.querySelector('h2'));}

/* ---------- прохождение ---------- */
function startModule(id){
  var m=MODS.filter(function(x){return x.id===id;})[0];if(!m)return;
  var items=[];
  m.steps.forEach(function(s,i){items.push({kind:'explain',step:s,mod:m,first:i===0,idx:i});});
  m.practice().forEach(function(q){items.push({kind:'ask',q:q,scored:false,phase:'Пробуем'});});
  m.test().forEach(function(q){items.push({kind:'ask',q:q,scored:true,phase:'Проверка'});});
  R={mode:'lesson',mod:m,items:items,i:0,retries:0,w:0,boost:0};go({name:'run'});}

function barHtml(){var s='';R.items.forEach(function(_,i){s+='<i class="'+(i<R.i?'on':(i===R.i?'now':''))+'"></i>';});return '<div class="bar" aria-hidden="true">'+s+'</div>';}
function restNote(){var mins=(P.days[dayKey()]||0)/60;return mins>=10?'<div class="rest">Ты занимаешься уже 10 минут. Можно закончить на сегодня: всё сохранено. <button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px;margin-left:6px" data-v="home">Закончить на сегодня</button></div>':'';}

function rRun(){
  if(!R){go({name:'home'});return;}
  if(R.i>=R.items.length){finish();return;}
  var it=R.items[R.i];
  if(it.kind==='explain')rExplain(it);else rAsk(it);}

function rExplain(it){
  var s=it.step,t=tier();
  var tx=(!it.alt)&&TX[it.mod.id+'.'+it.idx];
  var text=tx?pickT({A:tx.A,B:tx.B,C:s.text,D:tx.D}):s.text;
  app.appendChild(lvlBar(function(){R.boost=(R.boost||0)+1;render();},function(){render();}));
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">'+(it.alt?'Посмотрим по-другому':'Узнаём')+'</div>'+((it.first&&(t==='C'||t==='D'))?'<p class="goal">Цель: '+it.mod.goal+'</p>':'')+'<h3>'+s.title+'</h3><p style="margin-top:10px">'+text+'</p><div class="demo"></div><div class="row"></div>';
  var box=card.querySelector('.demo');s.mount(box);
  var rw=card.querySelector('.row');
  if(R.i>0&&R.items[R.i-1].kind==='explain'){var back=h('<button type="button" class="btn ghost">Назад</button>');back.onclick=function(){R.i--;render();};rw.appendChild(back);}
  var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;R.w=0;render();window.scrollTo(0,0);};rw.appendChild(nx);
  app.appendChild(card);app.insertAdjacentHTML('beforeend',restNote());}

var OKS=['Верно!','Да, точно!','Правильно!','Отлично!'];
var TRY=['Почти. Давай посмотрим вместе.','Хорошая попытка. Вот подсказка.','Тут легко запутаться. Смотри.'];
function rAsk(it){
  var q=it.q;if(it.w===undefined)it.w=0;
  var t=tier(),lead=q.lead,vis=q.vis||'',extra='',m=q.meta;
  if(t==='A'||t==='B'){
    if(lead==='Сколько будет?')lead=t==='A'?'Посчитай всё вместе. Сколько всего?':'Сколько всего? Считай по группам.';
    if(m&&m.t==='mul'&&q.fact&&q.eq===m.a+' × '+m.b+' = ?'){if(!vis&&m.a<=10&&m.b<=10)vis=groups(m.a,m.b);extra='<p class="read">Число '+m.a+' берём '+times(m.b)+'.</p>';}}
  var lb=lvlBar(simpler,null);app.appendChild(lb);
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">'+(R.mode==='train'?'Тренажёр':it.phase)+'</div><p class="ask-lead">'+lead+'</p>'+vis+'<div class="eq">'+q.eq+'</div>'+extra+'<div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div><div id="fb" aria-live="polite"></div>';
  app.appendChild(card);app.insertAdjacentHTML('beforeend',restNote());
  var inp=card.querySelector('#ans'),chk=card.querySelector('#chk'),fb=card.querySelector('#fb');
  inp.focus({preventScroll:true});
  function swapBar(){app.dataset.tier=tier();var nb=lvlBar(simpler,null);lb.replaceWith(nb);lb=nb;}
  function simpler(){R.boost=(R.boost||0)+1;swapBar();if(!it.done)fb.innerHTML='<div class="fb try"><strong>Объясню проще.</strong><div class="hint">'+simpleHint(q)+'</div></div>';}
  function next(){R.i++;render();window.scrollTo(0,0);}
  function done(msg){
    it.done=true;if(it.w===0)it.first=true;
    if(q.fact)rec(q.fact,it.first===true);
    inp.disabled=true;chk.textContent='Дальше';chk.disabled=false;chk.onclick=next;chk.focus();
    fb.innerHTML=msg;}
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
      if(eff()>3&&!it.low){it.low=true;R.boost=(R.boost||0)+1;if(R.mod){P.low[R.mod.id]=(P.low[R.mod.id]||0)+1;save();}swapBar();}
      fb.innerHTML='<div class="fb try"><strong>Давай объясню проще.</strong><div class="hint">'+simpleHint(q)+'</div><span>Попробуй ещё раз.</span></div>';inp.focus();return;}
    fb.innerHTML='<div class="fb try"><strong>'+TRY[(it.w-1)%TRY.length]+'</strong><div class="hint">'+hint(q,it.w)+'</div><span>Попробуй ещё раз.</span></div>';inp.focus();}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter')check();};}

function missedFacts(){var seen={},out=[];R.items.forEach(function(it){if(it.kind==='ask'&&!it.first&&it.q.fact){var f=it.q.fact,k=fk(f);if(!seen[k]){seen[k]=1;out.push(f[0]+' × '+f[1]+' = '+f[0]*f[1]);}}});return out;}

function finish(){
  if(R.mode==='train'){
    var asks=R.items.filter(function(x){return x.kind==='ask';});var ok=asks.filter(function(x){return x.first;}).length;var ms=missedFacts();
    app.innerHTML='<section class="card lift"><div class="phase">Итог</div><h2 style="margin:0 0 10px">С первого раза: '+ok+' из '+asks.length+'</h2><p>'+(ms.length?'Эти примеры мы покажем чаще:':'Все примеры получились. Так держать.')+'</p>'+(ms.length?'<div class="chips" style="margin-bottom:16px">'+ms.map(function(x){return '<span class="chip">'+x+'</span>';}).join('')+'</div>':'')+'<div class="row"><button type="button" class="btn" data-v="train">Ещё раз</button><button type="button" class="btn ghost" data-v="home">К урокам</button></div></section>';return;}
  var m=R.mod;var sc=R.items.filter(function(x){return x.scored&&x.first;}).length;var tot=R.items.filter(function(x){return x.scored;}).length;
  P.attempts[m.id]=(P.attempts[m.id]||0)+1;
  var ms=missedFacts();
  if(sc>=tot-1){
    var st=sc===tot?3:2;P.done[m.id]=true;P.stars[m.id]=Math.max(P.stars[m.id]||0,st);save();
    var ni=MODS.indexOf(m)+1;var nx=MODS[ni];
    app.innerHTML='<section class="card lift"><div class="phase">Проверка пройдена</div><div class="big-stars" aria-label="'+st+' из 3">'+starsStr(st)+'</div><h2 style="margin:14px 0 10px">Ты разобрался в этой теме</h2><p>С первого раза верно: '+sc+' из '+tot+'. '+(ms.length?'Эти примеры вернутся в тренажёре:':'')+'</p>'+(ms.length?'<div class="chips" style="margin-bottom:12px">'+ms.map(function(x){return '<span class="chip">'+x+'</span>';}).join('')+'</div>':'')+'<p class="small">Чтобы тема закрепилась, вернись к ней в тренажёре через день. На сегодня этого достаточно.</p><div class="row">'+(nx?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий блок</button>':'')+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">Закончить</button></div></section>';
  }else{
    var again=R.retries>=1;R.boost=(R.boost||0)+1;P.low[m.id]=(P.low[m.id]||0)+1;save();app.dataset.tier=tier();
    app.innerHTML='<section class="card lift"><div class="phase">Пока не получилось</div><h2 style="margin:0 0 10px">Это нормально. Посмотрим иначе</h2><p>С первого раза верно: '+sc+' из '+tot+'. Тема новая, и объяснение мы можем сменить. Сейчас объясню проще и другим способом, а потом ты попробуешь новые примеры.</p>'+(ms.length?'<div class="chips" style="margin-bottom:12px">'+ms.map(function(x){return '<span class="chip">'+x+'</span>';}).join('')+'</div>':'')+(again?'<p class="small">Если устал, закончи на сегодня. Прогресс сохранится, а завтра будет проще.</p>':'')+'<div class="row"><button type="button" class="btn" id="re">Объяснить по-другому</button><button type="button" class="btn ghost" data-v="home">Позже</button></div></section>';
    document.getElementById('re').onclick=function(){
      var items=[{kind:'explain',alt:true,mod:m,step:{title:'Посмотрим по-другому',text:((tier()==='A'||tier()==='B')?(ALT_A[m.id]||m.alt.text):m.alt.text),mount:m.alt.mount}}];
      m.test().forEach(function(q){items.push({kind:'ask',q:q,scored:true,phase:'Пересдача'});});
      R.items=items;R.i=0;R.retries++;render();window.scrollTo(0,0);};}}

/* ---------- тренажёр, квадрат, родители ---------- */
function rTrainStart(){
  app.innerHTML='<section class="card lift"><p class="kicker">5–10 минут в день</p><h1>Тренажёр</h1><p class="lead" style="margin-top:12px">Восемь примеров: умножение, деление и пропущенные числа. Чаще всего попадаются те, где раньше были сложности. Таймера нет, спешить не нужно. Если ответ не получается, появится подсказка.</p><div class="row" style="margin-top:16px"><button type="button" class="btn" id="go">Начать</button></div></section>';
  document.getElementById('go').onclick=function(){R={mode:'train',mod:null,items:pickTrain(8).map(function(q){return {kind:'ask',q:q,scored:true,phase:'Тренажёр'};}),i:0,retries:0,boost:0};NAMES.run='train';go({name:'run'});};}
function rTable(){
  app.innerHTML='<section class="card lift"><h1>Квадрат Пифагора</h1><p class="lead" style="margin:12px 0">Вся таблица умножения на одном листе. Нажми на клетку: строка × столбец. Зеркальная пара подсветится жёлтым, а диагональ из квадратов окрашена синим.</p><div class="demo" id="tb"></div></section>';
  mPyth(document.getElementById('tb'),{diag:true});}
function rParent(){
  var today=dayKey(),mins=Math.round((P.days[today]||0)/60*10)/10;
  var wk='',max=15;for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var m=(P.days[dayKey(d)]||0)/60;var hh=Math.round(Math.min(m,max)/max*100);
    wk+='<div'+(i===0?' class="today-col"':'')+'><i style="height:'+hh+'px" title="'+Math.round(m)+' мин"></i><span>'+['вс','пн','вт','ср','чт','пт','сб'][d.getDay()]+'</span></div>';}
  var done=MODS.map(function(m,i){return '<div><span>Блок '+(i+1)+'. '+m.title+'</span><span>'+(P.done[m.id]?'<span class="stars">'+starsStr(P.stars[m.id]||2)+'</span>':'ещё не пройден')+(P.attempts[m.id]?' · попыток: '+P.attempts[m.id]:'')+'</span></div>';}).join('');
  var weak=Object.keys(P.stats).map(function(k){var s=P.stats[k];return {k:k,bad:s.bad,n:s.ok+s.bad};}).filter(function(x){return x.bad>0;}).sort(function(a,b){return b.bad/b.n-a.bad/a.n||b.bad-a.bad;}).slice(0,8);
  var weakH=weak.length?'<div class="bars">'+weak.map(function(x){var p=x.k.split('×');return '<div><span class="mono">'+p[0]+' × '+p[1]+' = '+p[0]*p[1]+'</span><span class="small">ошибок: '+x.bad+' из '+x.n+'</span></div>';}).join('')+'</div>':'<p class="small">Пока нет данных о сложных примерах. Они появятся после первых занятий.</p>';
  var map='';for(var a=1;a<=10;a++)for(var b=1;b<=10;b++){var s=P.stats[Math.min(a,b)+'×'+Math.max(a,b)];var c=s?(s.bad>0?'w':'k'):'';map+='<i class="'+c+'">'+a*b+'</i>';}
  app.innerHTML='<h1 style="margin-top:14px">Родителям</h1>'
  +'<div class="grid2" style="margin-top:14px"><section class="card"><h3>Сегодня</h3><p class="eq" style="margin:8px 0 4px">'+mins+' мин</p><p class="small">Лучше всего 5–10 минут каждый день, чем час раз в неделю. После 10 минут сервис мягко предложит закончить.</p><div class="week" aria-label="Минуты за последние 7 дней"><span class="band" aria-hidden="true"></span>'+wk+'</div><p class="small" style="margin:6px 0 0">Зелёная полоса: 5–10 минут.</p></section>'
  +'<section class="card"><h3>Как помочь</h3><ul class="tips"><li>Спросите: «Как ты это посчитал?». Объяснение вслух показывает, понял ли ребёнок.</li><li>Не торопите и не засекайте время. Скорость придёт сама после понимания.</li><li>Если блок не получается с двух попыток, подождите день и вернитесь.</li><li>Играйте: карточки с примерами, настольные игры с кубиками, клеточки в тетради.</li></ul></section></div>'
  +'<h2>Блоки</h2><section class="card"><div class="bars">'+done+'</div></section>'
  +'<div class="grid2"><div><h2>Над чем поработать</h2><section class="card">'+weakH+'</section></div><div><h2>Карта таблицы</h2><section class="card"><div class="map" aria-label="Карта освоенных примеров">'+map+'</div><div class="legend"><span class="k">верно с первого раза</span><span class="w">были ошибки</span><span>ещё не встречались</span></div></section></div></div>'
  +'<p class="small" style="margin-top:20px">Прогресс хранится в этом браузере на этом устройстве. <span id="rs"><button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px" id="reset">Сбросить прогресс</button></span></p>';
  var lowTot=0,lowList=[];MODS.forEach(function(m,i){var c=P.low&&P.low[m.id]||0;lowTot+=c;if(c)lowList.push('блок '+(i+1)+': '+c);});
  var lc=h('<section class="card" style="margin-top:14px"><h3>Уровень объяснения</h3><p class="small" style="margin-top:6px">Сейчас: <b>'+lvLevel()+' лет</b>. Этот ползунок меняет только подачу: слова, примеры и размер картинок. Программа и порядок тем остаются теми же. Ребёнок тоже может двигать его сам или нажимать «Объясни ещё проще».</p><div id="lvhold"></div><p class="small">'+(lowTot?'Сервис сам делал объяснение проще: '+lowTot+' раз ('+lowList.join(', ')+'). '+(lowTot>=3?'Возможно, стоит поставить уровень ниже.':''):'Автоматически объяснение понижалось 0 раз.')+'</p><h3 style="margin-top:14px;font-size:19px">Один пример на четырёх уровнях: 3 × 4</h3><div><div class="ex"><b>3 года</b><span>Вот 4 тарелки. На каждой 3 печеньки. Посчитаем все вместе: раз, два, три… двенадцать! Печенек двенадцать.</span></div><div class="ex"><b>5 лет</b><span>У нас 4 тарелки, на каждой по 3 печенья. Это 3 и 3 и 3 и 3. Считаем по три: 3, 6, 9, 12. Так считать быстро, и это называется умножение.</span></div><div class="ex"><b>7 лет</b><span>3 × 4 значит: число 3 берём 4 раза, то есть 3 + 3 + 3 + 3 = 12. Можно выложить прямоугольник: 4 ряда по 3 клетки.</span></div><div class="ex"><b>9 лет</b><span>3 × 4 — это 12 клеток в прямоугольнике 3 на 4. Поверни его: 4 × 3, клеток столько же. Значит, 3 × 4 = 4 × 3, и учить нужно вдвое меньше примеров.</span></div></div></section>');
  lc.querySelector('#lvhold').appendChild(lvlBar(null,null));
  app.insertBefore(lc,app.querySelector('.grid2'));
  document.getElementById('reset').onclick=function(){document.getElementById('rs').innerHTML='Точно сбросить всё? <button type="button" class="btn" style="min-height:40px;padding:4px 14px;font-size:15px" id="yes">Да, сбросить</button> <button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px" id="no">Отмена</button>';
    document.getElementById('yes').onclick=function(){P={done:{},stars:{},attempts:{},stats:{},days:{},low:{},age:7};save();render();};
    document.getElementById('no').onclick=function(){render();};};}

/* ---------- события ---------- */
document.addEventListener('click',function(e){
  var s=e.target.closest('[data-start]');if(s){NAMES.run='home';startModule(s.dataset.start);return;}
  var v=e.target.closest('[data-v]');if(v){NAMES.run='home';if(v.dataset.v==='train')R=null;go({name:v.dataset.v});}});
setInterval(function(){if(!document.hidden&&(view.name==='run'||view.name==='train'||view.name==='table')){var k=dayKey();P.days[k]=(P.days[k]||0)+5;save();}},5000);
render();
})();
