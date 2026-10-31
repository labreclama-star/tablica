/* ---------- продвинутый режим ---------- */
var FINAL_N=30,FINAL_PASS=90,SR_INT=[0,1,3,7,14,30],gTimer=null;
function iso(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function addDays(n){var d=new Date();d.setDate(d.getDate()+n);return iso(d);}
function dailyNow(){return P.daily[iso()]||{ex:0,rev:0,game:0};}
function bump(f){var k=iso(),d=P.daily[k]||(P.daily[k]={ex:0,rev:0,game:0});d[f]=(d[f]||0)+1;save();}
function srUpdate(f,ok){var k=fk(f),e=P.sr[k]||(P.sr[k]={box:0,due:iso()});e.box=ok?Math.min(5,e.box+1):0;e.due=addDays(SR_INT[e.box]);}
function dueList(){var t=iso(),o=[];for(var k in P.sr){if(P.sr[k].due<=t){var p=k.split('×');o.push([+p[0],+p[1]]);}}
  return o.sort(function(x,y){return P.sr[fk(x)].box-P.sr[fk(y)].box;});}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=ri(0,i),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function syncChrome(){var sw=document.querySelector('.adv-sw');if(sw)sw.setAttribute('aria-checked',P.adv?'true':'false');
  var g=document.querySelector('.nav [data-v="games"]');if(g)g.hidden=!P.adv;}
function setAdv(on){P.adv=!!on;if(!P.adv&&view.name==='games')view={name:'home'};save();syncChrome();render();}

/* что вспомнить до объяснения и что рассказать после */
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
  if(t==='mul')return Mul(a,b,{key:'st'+a+'x'+b+it.o,lead:c.n+': '+a+'.'+per+' Сколько '+it.m+' всего?',eq:'?',fact:[a,b]});
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
  card.innerHTML=barHtml()+'<div class="phase">Сначала вспомним</div><p class="ask-lead">'+d.lead+'</p><div class="eq sm">'+d.eq+'</div><p class="small">Угадай. Ошибиться не страшно: сейчас всё разберём.</p><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Ответить</button><button type="button" class="btn ghost" id="idk">Не знаю</button></div><div id="fb" aria-live="polite"></div>';
  app.appendChild(card);
  var inp=card.querySelector('#ans'),chk=card.querySelector('#chk'),idk=card.querySelector('#idk'),fb=card.querySelector('#fb'),done=false;
  inp.focus({preventScroll:true});
  function next(){R.i++;render();window.scrollTo(0,0);}
  function fin(msg){done=true;inp.disabled=true;idk.hidden=true;chk.textContent='Дальше';chk.onclick=next;chk.focus();fb.innerHTML=msg;}
  function check(){if(done){next();return;}var v=parseInt(inp.value,10);if(isNaN(v)){inp.focus();return;}
    fin(v===d.ans?'<div class="fb ok"><strong>Ты уже многое знаешь!</strong><span>Сейчас разберёмся, почему так.</span></div>':'<div class="fb"><strong>Правильный ответ: '+d.ans+'.</strong><span>Сейчас разберёмся, как к нему прийти.</span></div>');}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter')check();};
  idk.onclick=function(){fin('<div class="fb"><strong>Ничего страшного.</strong><span>Правильный ответ: '+d.ans+'. Сейчас разберёмся, как к нему прийти.</span></div>');};}

/* объяснить вслух */
function sayBox(card,it){
  if(!P.adv||it.alt)return;var m=it.mod;if(it.idx!==m.steps.length-1)return;var s=SAY[m.id];if(!s)return;
  card.querySelector('.demo').insertAdjacentHTML('afterend','<div class="say"><b>Расскажи вслух</b><p>'+s.say+'</p><p class="small">Родителю. '+s.parent+'</p><button type="button" class="btn ghost" style="min-height:40px;font-size:15px">Я рассказал(а)</button></div>');
  var b=card.querySelector('.say button');b.onclick=function(){P.told[m.id]=(P.told[m.id]||0)+1;save();b.textContent='Записано';b.disabled=true;};}

/* тренажёр: повторения по расписанию, чередование, задачи, выбор приёма */
function qFor(f,kind){var a=f[0],b=f[1];if(Math.random()<.5){var x=a;a=b;b=x;}
  if(kind==='div')return Div(a*b,a);if(kind==='miss')return Miss(a,b);return Mul(a,b);}
function trainItems(){
  if(!P.adv)return pickTrain(8).map(function(q){return {kind:'ask',q:q,scored:true,phase:'Тренажёр'};});
  var facts=allowedFacts(),map={},picked=[],used={};
  facts.forEach(function(f){map[fk(f)]=f;});
  function add(f){var k=fk(f);if(used[k]||!map[k])return false;used[k]=1;picked.push(map[k]);return true;}
  dueList().slice(0,4).forEach(add);
  shuffle(facts.filter(function(f){return !P.sr[fk(f)];})).slice(0,2).forEach(add);
  function w(f){var s=P.stats[fk(f)]||{ok:0,bad:0};return 1+5*s.bad/(s.ok+s.bad+1);}
  var guard=0;
  while(picked.length<8&&guard++<400){var tot=0;facts.forEach(function(f){tot+=w(f);});var r=Math.random()*tot,f=facts[0];
    for(var i=0;i<facts.length;i++){r-=w(facts[i]);if(r<=0){f=facts[i];break;}}add(f);}
  shuffle(picked);
  var kinds=['mul','mul'];if(P.done.m2)kinds.push('miss');if(P.done.m9)kinds.push('div','div');
  var strategies=!!(P.done.m4||P.done.m5||P.done.m6||P.done.m7||P.done.m8),storyAt={},choiceAt={};
  if(picked.length>2){storyAt[ri(0,picked.length-1)]=1;}
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
  card.innerHTML=barHtml()+'<div class="phase">Итоговая проверка: '+(R.i+1)+' из '+R.items.length+'</div><p class="ask-lead">'+q.lead+'</p><div class="eq">'+q.eq+'</div><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">'+(last?'Закончить':'Дальше')+'</button></div><p class="small">Здесь нет подсказок: так видно, что ты знаешь сам. Если не знаешь, оставь поле пустым и нажми кнопку.</p>';
  app.appendChild(card);
  var inp=card.querySelector('#ans');inp.value=it.val===undefined||it.val===null?'':String(it.val);inp.focus({preventScroll:true});
  function go2(){var v=parseInt(inp.value,10);it.val=isNaN(v)?null:v;R.i++;render();window.scrollTo(0,0);}
  card.querySelector('#chk').onclick=go2;inp.onkeydown=function(e){if(e.key==='Enter')go2();};}
function finishFinal(){
  var ok=0,wrong=[];
  R.items.forEach(function(it){var q=it.q,good=it.val===q.answer;if(good)ok++;else wrong.push(q);if(q.fact)rec(q.fact,good);});
  var n=R.items.length,pct=Math.round(ok/n*100);
  P.final.push({d:new Date().toISOString(),ok:ok,n:n});if(P.final.length>50)P.final=P.final.slice(-50);save();
  var pass=pct>=FINAL_PASS;
  app.innerHTML='<section class="card lift"><div class="phase">Итоговая проверка</div><div class="big-stars" aria-label="Результат">'+ok+' из '+n+'</div><h2 style="margin:14px 0 10px">'+(pass?'Цель достигнута: '+pct+'%':'Результат: '+pct+'%')+'</h2><p>'+(pass?'Ты хорошо знаешь таблицу умножения и деления.':'Цель: '+FINAL_PASS+'% и выше. Это не страшно: поработай в тренажёре над слабыми примерами и попробуй снова через несколько дней.')+'</p>'+(wrong.length?'<p class="small">Где были ошибки:</p><div class="chips" style="margin-bottom:14px">'+wrong.map(function(q){return '<span class="chip">'+q.eq.replace('?',q.answer)+'</span>';}).join('')+'</div>':'')+'<div class="row"><button type="button" class="btn" data-v="train">В тренажёр</button><button type="button" class="btn ghost" data-v="home">На главную</button></div></section>';}

/* игры */
var GAMES=[{id:'pairs',t:'Найди пару',d:'Открывай по две карточки. Найди пример и его ответ.',run:gPairs},{id:'odd',t:'Найди ошибку',d:'Среди четырёх равенств одно неверное. Найди его.',run:gOdd},{id:'rect',t:'Собери прямоугольник',d:'Подбери длину и ширину, чтобы получилась нужная площадь.',run:gRect},{id:'rhythm',t:'Счёт через n',d:'Прыгай по числовой ленте и считай вслух: 2, 4, 6…',run:gRhythm}];
function rGames(){
  if(!P.adv){app.innerHTML='<section class="card lift"><h1>Игры</h1><p class="lead" style="margin:12px 0">Игры входят в продвинутый режим.</p><button type="button" class="btn" data-act="adv">Включить продвинутый режим</button></section>';return;}
  var g=view.g;
  if(!g){app.innerHTML='<section class="card lift"><p class="kicker">Продвинутый режим</p><h1>Игры</h1><p class="lead" style="margin-top:12px">Короткие игры на 2–3 минуты. Без таймера и очков.</p></section><h2>Выбери игру</h2><div class="mods">'+GAMES.map(function(x){return '<button type="button" class="mod" data-g="'+x.id+'"><span class="mod-tag">'+x.t+'</span><span class="mod-s">'+x.d+'</span></button>';}).join('')+'</div>';return;}
  var def=GAMES.filter(function(x){return x.id===g;})[0];if(!def){go({name:'games'});return;}
  var card=h('<section class="card lift"><div class="phase">Игра</div><h2 style="margin:0 0 6px">'+def.t+'</h2><p class="lead" style="margin-bottom:12px">'+def.d+'</p><div class="demo" id="gbox"></div><div id="gend" aria-live="polite"></div><div class="row act" style="margin-top:14px"><button type="button" class="btn ghost" data-g="'+g+'">Заново</button><button type="button" class="btn ghost" data-g="">К играм</button></div></section>');
  app.appendChild(card);var finished=false;
  def.run(card.querySelector('#gbox'),function(){if(finished)return;finished=true;bump('game');card.querySelector('#gend').innerHTML='<div class="fb ok" style="margin-top:12px"><strong>Игра пройдена!</strong><span>Засчитано в цели на сегодня.</span></div>';});}
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
    box.innerHTML='<p class="ask-lead">Найди неверное равенство ('+(round+1)+' из '+total+')</p><div class="opts" id="ch"></div><p class="read" id="gm" aria-live="polite"></p><div class="row" id="gn"></div>';
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
    box.innerHTML='<p class="ask-lead">Собери прямоугольник из '+N+' клеток ('+(round+1)+' из '+T.length+')</p><div id="rs"></div><div id="rv"></div><p class="read" id="gm" aria-live="polite"></p><div class="row" id="gb"></div>';
    var rs=box.querySelector('#rs'),rv=box.querySelector('#rv'),msg=box.querySelector('#gm'),gb=box.querySelector('#gb'),solved=false;
    function view2(){rv.innerHTML=rect(w,hh)+'<div class="eq sm" style="margin-top:8px">'+w+' × '+hh+' = '+w*hh+'</div>';}
    rs.appendChild(row(stepper('Клеток в ряду',1,10,w,function(v){w=v;if(!solved)msg.textContent='';view2();}),stepper('Рядов',1,10,hh,function(v){hh=v;if(!solved)msg.textContent='';view2();})));
    view2();
    var chk=h('<button type="button" class="btn">Проверить</button>');gb.appendChild(chk);
    chk.onclick=function(){
      if(solved){round++;draw();return;}
      if(w*hh===N){solved=true;var ways=[];for(var d=1;d<=10;d++){if(N%d===0&&N/d<=10&&d<=N/d)ways.push(d+' × '+N/d);}
        msg.textContent='Верно! Ещё способы для '+N+': '+ways.join(', ')+'.';chk.textContent=round+1>=T.length?'Закончить':'Дальше';}
      else{msg.textContent='Сейчас клеток: '+w*hh+'. Нужно '+N+'. Измени длину или ширину.';}};}
  draw();}
function gRhythm(box,done){
  var step=2,pos=0,fin=false;
  var body=h('<div></div>');
  function stop(){if(gTimer){clearInterval(gTimer);gTimer=null;}}
  function jump(){if(pos<10){pos++;draw();}if(pos>=10){stop();draw();if(!fin){fin=true;done();}}}
  function draw(){
    var cells='',said=[];for(var i=0;i<=10;i++){cells+='<span class="nlc'+(i<pos?' on':'')+(i===pos?' now':'')+'">'+step*i+'</span>';if(i>=1&&i<=pos)said.push(step*i);}
    body.innerHTML='<div class="nl" role="img" aria-label="Числовая лента">'+cells+'</div><p class="read" aria-live="polite">'+(pos===0?'Нажми «Прыжок» и считай вслух.':'Скажи вслух: '+said.join(', ')+'.<br>'+step+' × '+pos+' = '+step*pos)+'</p><div class="row"><button type="button" class="btn" id="jp">Прыжок</button><button type="button" class="btn ghost" id="au">'+(gTimer?'Стоп':'Автоматом')+'</button></div>';
    body.querySelector('#jp').onclick=function(){stop();jump();};
    body.querySelector('#au').onclick=function(){if(gTimer){stop();draw();}else{if(pos>=10){pos=0;}gTimer=setInterval(jump,900);draw();}};}
  box.append(row(stepper('Считаем через',2,10,step,function(v){stop();step=v;pos=0;draw();})),body);draw();}

/* главная и родительский раздел */
function homeAdv(){
  var hero=app.querySelector('section.card.lift');if(!hero)return;var html='';
  if(!P.adv){html='<section class="note"><h3>Продвинутый режим</h3><p>Включите переключатель вверху страницы. Появятся повторения через дни, вопрос «что ты помнишь», выбор приёма, задачи, игры и итоговая проверка.</p><div class="row"><button type="button" class="btn ghost" data-act="adv">Включить</button></div></section>';}
  else{
    var d=dailyNow(),due=dueList().length;
    function row2(ok,txt,v){return '<button type="button" class="grow'+(ok?' done':'')+'" data-v="'+v+'"><i class="tick" aria-hidden="true">'+(ok?'✓':'')+'</i><span>'+txt+'</span></button>';}
    var last=P.final.length?P.final[P.final.length-1]:null;
    html='<section class="card goals"><h3>Сегодня три цели</h3><div class="goal-list">'+row2(d.ex>=5,'Примеры: '+Math.min(d.ex,5)+' из 5','train')+row2(d.rev>=1,'Повтор в тренажёре'+(due?' (ждут: '+due+')':''),'train')+row2(d.game>=1,'Одна игра','games')+'</div></section>'
     +'<section class="note"><h3>Итоговая проверка</h3><p>'+FINAL_N+' примеров без подсказок и таймера. Цель: '+FINAL_PASS+'% и выше.'+(last?' Последний результат: '+last.ok+' из '+last.n+'.':'')+'</p><div class="row"><button type="button" class="btn ghost" data-act="final">Пройти итоговую проверку</button></div></section>';}
  hero.insertAdjacentHTML('afterend',html);}
function advParent(){
  if(!P.adv)return '<h2>Продвинутый режим</h2><section class="card"><p>Выключен. Он добавляет повторения через дни, вопрос «что ты помнишь», выбор приёма, задачи, игры и итоговую проверку.</p><div class="row" style="margin-top:12px"><button type="button" class="btn" data-act="adv">Включить</button></div></section>';
  var due=dueList().length,known=0,tot=0,k;for(k in P.sr){tot++;if(P.sr[k].box>=4)known++;}
  var hist=P.final.length?'<div class="bars">'+P.final.slice(-5).reverse().map(function(r){var p=Math.round(r.ok/r.n*100);return '<div><span>'+new Date(r.d).toLocaleDateString('ru-RU')+'</span><span>'+r.ok+' из '+r.n+' ('+p+'%)'+(p>=FINAL_PASS?' · цель достигнута':'')+'</span></div>';}).join('')+'</div>':'<p class="small">Итоговая проверка ещё не проходилась.</p>';
  var say=MODS.map(function(m){var s=SAY[m.id];return '<li><b>'+m.title+'.</b> '+s.parent+(P.told[m.id]?' <span class="stars">Рассказано: '+P.told[m.id]+'</span>':'')+'</li>';}).join('');
  return '<h2>Продвинутый режим</h2><div class="grid2"><section class="card"><h3>Повторения</h3><p>К повтору сегодня: <b>'+due+'</b>.</p><p class="small">Пример считается надёжно выученным после четырёх верных ответов с растущими паузами (1, 3, 7, 14 дней). Таких примеров: '+known+' из 54, всего в расписании: '+tot+'.</p></section><section class="card"><h3>Итоговая проверка</h3>'+hist+'<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="final">Пройти</button></div></section></div><section class="card" style="margin-top:14px"><h3>Вопросы для разговора</h3><ul class="tips">'+say+'</ul></section><section class="card" style="margin-top:14px"><button type="button" class="btn ghost" data-act="adv">Выключить продвинутый режим</button></section>';}

