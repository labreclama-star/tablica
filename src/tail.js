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
var NAMES={home:'home',run:'home',train:'train',table:'table',parent:'parent',doc:'',buy:'home'};
function dl(k){return PREVIEW?'#'+k:k+'.html';}
function go(v){view=v;render();window.scrollTo(0,0);}
function render(){
  document.querySelectorAll('.nav button').forEach(function(b){if(b.dataset.v===NAMES[view.name])b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  app.innerHTML='';
  ({home:rHome,run:rRun,train:rTrainStart,table:rTable,parent:rParent,doc:rDoc,buy:rBuy})[view.name]();}
function route(){var hs=(location.hash||'').replace('#','');
  if(window.__DOCS__&&window.__DOCS__[hs]){view={name:'doc',key:hs};}else if(view.name==='doc'){view={name:'home'};}
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
function locked(i){return PAYWALL&&!P.access&&i>=FREE_BLOCKS;}
function rHome(){
  var next=null,idx=-1;for(var i=0;i<MODS.length;i++){if(!P.done[MODS[i].id]){next=MODS[i];idx=i;break;}}
  var cards=MODS.map(function(m,i){var d=P.done[m.id];
    var st=d?'<span class="stars" aria-label="'+(P.stars[m.id]||2)+' из 3">'+starsStr(P.stars[m.id]||2)+'</span> пройдено':(locked(i)?'Нужен доступ':(next&&next.id===m.id?'Следующий':'Новое'));
    return '<button type="button" class="mod'+(d?' done':'')+'" data-start="'+m.id+'"><span class="mod-n">Блок '+(i+1)+'</span><span class="mod-tag">'+m.tag+'</span><span class="mod-t">'+m.title+'</span><span class="mod-s">'+st+'</span></button>';}).join('');
  var today=next?'<div><b>Сегодня: блок '+(idx+1)+'</b><span>'+next.title+'. Хватит 5–10 минут.</span></div><button type="button" class="btn" data-start="'+next.id+'">'+(idx===0&&!Object.keys(P.done).length?'Начать':'Продолжить')+'</button>':'<div><b>Все блоки пройдены</b><span>Тренажёр подберёт примеры, которые пока даются труднее.</span></div><button type="button" class="btn" data-v="train">В тренажёр</button>';
  app.innerHTML=banners()+'<section class="card lift"><p class="kicker">Умножение и деление <span class="age" title="Возрастная маркировка">6+</span></p><h1>Таблица без зубрёжки</h1><p class="lead" style="margin-top:12px">Сначала понимаем, потом запоминаем. В каждом блоке коротко объясняем, даём несколько задач и проверку. Не понял? Нажми «Объясни по-другому». Ошибка здесь часть учёбы.</p><div class="today">'+today+'</div></section><h2>Блоки</h2><div class="mods">'+cards+'</div><p class="small" style="margin-top:18px">Один блок удобно проходить 3–7 дней: в первый день урок и проверка, потом по 5 минут в тренажёре.</p>';}

/* ---------- прохождение блока ---------- */
function startModule(id){
  var i=-1;MODS.forEach(function(x,k){if(x.id===id)i=k;});if(i<0)return;
  if(locked(i)){go({name:'buy',id:id});return;}
  var m=MODS[i],items=[];
  m.steps.forEach(function(s,k){items.push({kind:'explain',step:s,mod:m,first:k===0,idx:k});});
  m.practice().forEach(function(q){items.push({kind:'ask',q:q,scored:false,phase:'Пробуем'});});
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
  if(it.kind==='explain')rExplain(it);else if(it.kind==='break')rBreak(it);else rAsk(it);}

function variantsFor(it){
  if(it.variants)return it.variants;
  var tx=TX[it.mod.id+'.'+it.idx]||{},v=[tx.B,it.step.text,tx.A];
  return v.filter(function(t,i){return t&&v.indexOf(t)===i;});}
function rExplain(it){
  var vs=variantsFor(it);if(it.v===undefined)it.v=0;
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">'+(it.alt?'Посмотрим по-другому':'Узнаём')+'</div>'+((it.first&&!it.alt)?'<p class="goal">'+it.mod.goal+'</p>':'')+'<h3>'+it.step.title+'</h3><p class="expl" id="expl" aria-live="polite"></p><p class="vcap small" id="vcap"></p><div class="demo"></div><div class="row act"></div>';
  function paint(){card.querySelector('#expl').textContent=vs[it.v%vs.length];card.querySelector('#vcap').textContent=vs.length>1?'Объяснение '+(it.v%vs.length+1)+' из '+vs.length:'';}
  paint();
  it.step.mount(card.querySelector('.demo'));
  var rw=card.querySelector('.row');
  if(R.i>0&&R.items[R.i-1].kind==='explain'){var back=h('<button type="button" class="btn ghost">Назад</button>');back.onclick=function(){R.i--;render();};rw.appendChild(back);}
  if(vs.length>1){var al=h('<button type="button" class="btn ghost alt">'+ICON+'Объясни по-другому</button>');
    al.onclick=function(){it.v++;countAlt();paint();var e=card.querySelector('#expl');e.classList.remove('swap');void e.offsetWidth;e.classList.add('swap');};rw.appendChild(al);}
  var nx=h('<button type="button" class="btn">Дальше</button>');nx.onclick=function(){R.i++;render();window.scrollTo(0,0);};rw.appendChild(nx);
  app.appendChild(card);app.insertAdjacentHTML('beforeend',restNote());}

var OKS=['Верно!','Да, точно!','Правильно!','Отлично!'];
var TRY=['Почти. Давай посмотрим вместе.','Хорошая попытка. Вот подсказка.','Тут легко запутаться. Смотри.'];
function rAsk(it){
  var q=it.q;if(it.w===undefined)it.w=0;
  var card=h('<section class="card lift"></section>');
  card.innerHTML=barHtml()+'<div class="phase">'+(R.mode==='train'?'Тренажёр':it.phase)+'</div><p class="ask-lead">'+q.lead+'</p>'+(q.vis||'')+'<div class="eq">'+q.eq+'</div><div class="answer"><input class="ans" id="ans" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Твой ответ"><button type="button" class="btn" id="chk">Проверить</button></div><div id="fb" aria-live="polite"></div><div class="row" style="margin-top:14px"><button type="button" class="btn ghost alt" id="alt">'+ICON+'Объясни по-другому</button></div>';
  app.appendChild(card);app.insertAdjacentHTML('beforeend',restNote());
  var inp=card.querySelector('#ans'),chk=card.querySelector('#chk'),fb=card.querySelector('#fb'),alt=card.querySelector('#alt');
  inp.focus({preventScroll:true});
  function next(){R.i++;render();window.scrollTo(0,0);}
  function done(msg){
    it.done=true;if(it.w===0)it.first=true;
    if(q.fact)rec(q.fact,it.first===true);
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
    fb.innerHTML='<div class="fb try"><strong>'+TRY[(it.w-1)%TRY.length]+'</strong><div class="hint">'+hint(q,it.w)+'</div><span>Попробуй ещё раз.</span></div>';inp.focus();}
  chk.onclick=check;inp.onkeydown=function(e){if(e.key==='Enter')check();};}

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
  if(R.mode==='train'){
    var asks=R.items.filter(function(x){return x.kind==='ask';});var ok=asks.filter(function(x){return x.first;}).length;var ms=missedFacts();
    app.innerHTML='<section class="card lift"><div class="phase">Итог</div><h2 style="margin:0 0 10px">С первого раза: '+ok+' из '+asks.length+'</h2><p>'+(ms.length?'Эти примеры мы покажем чаще:':'Все примеры получились. Так держать.')+'</p>'+chipsHtml(ms)+'<div class="row"><button type="button" class="btn" data-v="train">Ещё раз</button><button type="button" class="btn ghost" data-v="home">К урокам</button></div></section>';return;}
  var m=R.mod;var sc=R.items.filter(function(x){return x.scored&&x.first;}).length;var tot=R.items.filter(function(x){return x.scored;}).length;
  P.attempts[m.id]=(P.attempts[m.id]||0)+1;save();
  var ms2=missedFacts();
  if(sc>=tot-1){
    var st=sc===tot?3:2;P.done[m.id]=true;P.stars[m.id]=Math.max(P.stars[m.id]||0,st);save();
    var nx=MODS[MODS.indexOf(m)+1];
    app.innerHTML='<section class="card lift"><div class="phase">Проверка пройдена</div><div class="big-stars" aria-label="'+st+' из 3">'+starsStr(st)+'</div><h2 style="margin:14px 0 10px">Ты разобрался в этой теме</h2><p>С первого раза верно: '+sc+' из '+tot+'. '+(ms2.length?'Эти примеры вернутся в тренажёре:':'')+'</p>'+chipsHtml(ms2)+'<p class="small">Чтобы тема закрепилась, вернись к ней в тренажёре через день. На сегодня этого достаточно.</p><div class="row">'+(nx?'<button type="button" class="btn" data-start="'+nx.id+'">Следующий блок</button>':'')+'<button type="button" class="btn ghost" data-v="train">Тренажёр</button><button type="button" class="btn ghost" data-v="home">Закончить</button></div></section>';
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
  if(!CODES_SHA256.length){msg.textContent='Коды доступа ещё не настроены.';return;}
  sha256hex(String(code).trim().toUpperCase()).then(function(hx){
    if(CODES_SHA256.indexOf(hx)>=0){P.access=true;save();ok();}else{msg.textContent='Код не подошёл. Проверьте, нет ли лишних символов.';}
  }).catch(function(){msg.textContent='Не удалось проверить код.';});}
function codeForm(){return '<div class="answer"><input class="ans" style="width:14ch;font-size:24px" id="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Код доступа"><button type="button" class="btn" id="codego">Открыть доступ</button></div><p class="small" id="codemsg" aria-live="polite"></p>';}
function wireCode(after){var inp=document.getElementById('code'),msg=document.getElementById('codemsg');
  function go2(){tryCode(inp.value,msg,after);}
  document.getElementById('codego').onclick=go2;inp.onkeydown=function(e){if(e.key==='Enter')go2();};}
function rBuy(){
  app.innerHTML='<section class="card lift"><h2 style="margin:0 0 10px">Этот блок входит в полную версию</h2><p>Первые '+FREE_BLOCKS+' блока бесплатны. Полный доступ стоит '+PRICE+' один раз и открывает все блоки навсегда.</p><div class="row" style="margin:14px 0"><a class="btn" href="'+PAY_URL+'" rel="noopener">Купить за '+PRICE+'</a><button type="button" class="btn ghost" data-v="home">Назад</button></div><p class="small">Оплата проходит на странице платёжного сервиса. Здесь мы не просим данные карты, имя, почту или телефон. После оплаты на странице успеха появится код доступа. Вернись сюда и введи его.</p><h3 style="margin:18px 0 8px;font-size:19px">У меня есть код</h3>'+codeForm()+'</section>';
  wireCode(function(){var id=view.id;go({name:'home'});if(id)startModule(id);});}

/* ---------- тренажёр, квадрат ---------- */
function rTrainStart(){
  var any=Object.keys(P.done).length>0;
  app.innerHTML='<section class="card lift"><p class="kicker">5–10 минут в день</p><h1>Тренажёр</h1><p class="lead" style="margin-top:12px">Восемь примеров. Берём только то, что ты уже прошёл'+(any?'':', а пока самые простые, с числами до 5')+'. Чаще попадаются те, где раньше были сложности. Таймера нет, спешить не нужно. Если ответ не получается, появится подсказка.</p><div class="row" style="margin-top:16px"><button type="button" class="btn" id="go">Начать</button></div></section>';
  document.getElementById('go').onclick=function(){R={mode:'train',mod:null,items:pickTrain(8).map(function(q){return {kind:'ask',q:q,scored:true,phase:'Тренажёр'};}),i:0,retries:0};NAMES.run='train';go({name:'run'});};}
function rTable(){
  app.innerHTML='<section class="card lift"><h1>Квадрат Пифагора</h1><p class="lead" style="margin:12px 0">Вся таблица умножения на одном листе. Нажми на клетку: строка × столбец. Зеркальная пара подсветится жёлтым, а диагональ из квадратов окрашена синим.</p><div class="demo" id="tb"></div></section>';
  mPyth(document.getElementById('tb'),{diag:true});}
function rDoc(){var d=window.__DOCS__&&window.__DOCS__[view.key];
  if(!d){go({name:'home'});return;}
  app.innerHTML='<article class="card doc">'+d+'</article><p style="margin-top:14px"><button type="button" class="btn ghost" data-v="home">← К тренажёру</button></p>';}

/* ---------- сохранение файла и импорт ---------- */
function pad(n){return (n<10?'0':'')+n;}
function exportText(){return JSON.stringify({app:APP_ID,schemaVersion:SCHEMA,exportedAt:new Date().toISOString(),progress:{done:P.done,stars:P.stars,attempts:P.attempts,stats:P.stats,days:P.days,alts:P.alts,access:P.access===true}},null,2);}
function isInt(x,a,b){return typeof x==='number'&&isFinite(x)&&Math.floor(x)===x&&x>=a&&x<=b;}
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x);}
function validateImport(txt){
  var o;try{o=JSON.parse(txt);}catch(e){return {err:'Файл повреждён: это не JSON. Выберите файл progress-….json, который сохранил сервис.'};}
  if(!isObj(o)||o.app!==APP_ID)return {err:'Это не файл прогресса этого сервиса.'};
  if(!isInt(o.schemaVersion,1,1000))return {err:'В файле нет версии схемы. Он повреждён или чужой.'};
  if(o.schemaVersion>SCHEMA)return {err:'Файл сохранён более новой версией сервиса (v'+o.schemaVersion+'). Обновите страницу и попробуйте снова.'};
  var p=o.progress;if(!isObj(p))return {err:'В файле нет данных прогресса.'};
  var ids={};MODS.forEach(function(m){ids[m.id]=1;});
  var out={done:{},stars:{},attempts:{},stats:{},days:{},alts:{},access:p.access===true},k;
  if(p.done!==undefined){if(!isObj(p.done))return {err:'Раздел «done» повреждён.'};for(k in p.done){if(!ids[k]||typeof p.done[k]!=='boolean')return {err:'Неизвестный блок «'+k+'» в файле.'};out.done[k]=p.done[k];}}
  var sets=[['stars',0,3],['attempts',0,100000],['alts',0,1000000]];
  for(var i=0;i<sets.length;i++){var nm=sets[i][0];if(p[nm]!==undefined){if(!isObj(p[nm]))return {err:'Раздел «'+nm+'» повреждён.'};for(k in p[nm]){if(!ids[k]||!isInt(p[nm][k],sets[i][1],sets[i][2]))return {err:'Раздел «'+nm+'» содержит неверные значения.'};out[nm][k]=p[nm][k];}}}
  if(p.stats!==undefined){if(!isObj(p.stats))return {err:'Раздел «stats» повреждён.'};for(k in p.stats){var s=p.stats[k];if(!/^\d{1,2}×\d{1,2}$/.test(k)||!isObj(s)||!isInt(s.ok,0,1000000)||!isInt(s.bad,0,1000000))return {err:'Раздел «stats» содержит неверные значения.'};out.stats[k]={ok:s.ok,bad:s.bad};}}
  if(p.days!==undefined){if(!isObj(p.days))return {err:'Раздел «days» повреждён.'};for(k in p.days){var v=p.days[k];if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)||typeof v!=='number'||!isFinite(v)||v<0||v>86400)return {err:'Раздел «days» содержит неверные значения.'};out.days[k]=v;}}
  return {data:out};}
function mergeInfo(inc){var r={newDone:0,stars:0,statsNew:0,statsUp:0,days:0,access:false},k;
  for(k in inc.done)if(inc.done[k]&&!P.done[k])r.newDone++;
  for(k in inc.stars)if(inc.stars[k]>(P.stars[k]||0))r.stars++;
  for(k in inc.stats){var s=P.stats[k];if(!s)r.statsNew++;else if(inc.stats[k].ok>s.ok||inc.stats[k].bad>s.bad)r.statsUp++;}
  for(k in inc.days)if(inc.days[k]>(P.days[k]||0))r.days++;
  r.access=inc.access&&!P.access;return r;}
function applyMerge(inc){var k;
  for(k in inc.done)if(inc.done[k])P.done[k]=true;
  ['stars','attempts','alts'].forEach(function(n){for(k in inc[n])P[n][k]=Math.max(P[n][k]||0,inc[n][k]);});
  for(k in inc.stats){var s=P.stats[k]||(P.stats[k]={ok:0,bad:0});s.ok=Math.max(s.ok,inc.stats[k].ok);s.bad=Math.max(s.bad,inc.stats[k].bad);}
  for(k in inc.days)P.days[k]=Math.max(P.days[k]||0,inc.days[k]);
  if(inc.access)P.access=true;save();}
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
    msg.innerHTML='<div class="fb"><strong>Что изменится</strong><ul class="tips"><li>Новых пройденных блоков: '+r.newDone+'</li><li>Блоков с более высокой оценкой: '+r.stars+'</li><li>Новых примеров в статистике: '+r.statsNew+', обновится: '+r.statsUp+'</li><li>Дней занятий добавится или обновится: '+r.days+'</li>'+(r.access?'<li>Откроется полный доступ</li>':'')+'</ul><span class="small">Текущий прогресс не удаляется: берётся лучшее из двух вариантов.</span><div class="row"><button type="button" class="btn" id="apply">Объединить</button><button type="button" class="btn ghost" id="cancel">Отмена</button></div></div>';
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
  +'<h2>Сохранить прогресс</h2><section class="card" id="bk"><p>'+stTxt+'</p><p class="small">'+inst+' '+last+'</p>'
  +'<div class="row" style="margin:12px 0"><button type="button" class="btn" id="dl">Экспортировать прогресс</button><label class="btn ghost" for="imp" style="cursor:pointer">Импортировать прогресс</label><input type="file" id="imp" accept=".json,application/json" hidden></div><p class="small" id="dlmsg" aria-live="polite"></p><div id="imsg" aria-live="polite"></div>'
  +'<details><summary>Не скачался файл? Скопируйте текст</summary><textarea class="ta" id="exptext" rows="5" readonly aria-label="Текст файла прогресса"></textarea><button type="button" class="btn ghost" id="cpy" style="min-height:40px;font-size:15px">Скопировать</button></details>'
  +'<details><summary>Вставить текст вместо файла</summary><textarea class="ta" id="imptext" rows="4" aria-label="Вставьте текст файла прогресса"></textarea><button type="button" class="btn ghost" id="impgo" style="min-height:40px;font-size:15px">Проверить</button></details>'
  +'<p class="small" style="margin-top:12px"><a href="'+dl('how')+'">Как хранятся данные</a></p></section>'
  +(PAYWALL?'<h2>Доступ</h2><section class="card" id="acc">'+(P.access?'<p><b>Полный доступ открыт.</b> Он сохранится вместе с файлом прогресса.</p>':'<p>Сейчас открыты первые '+FREE_BLOCKS+' блока. Полный доступ: '+PRICE+' один раз.</p><div class="row" style="margin:12px 0"><a class="btn" href="'+PAY_URL+'" rel="noopener">Купить за '+PRICE+'</a></div><h3 style="font-size:19px;margin:8px 0">У меня есть код</h3>'+codeForm())+'</section>':'')
  +'<p class="small" style="margin-top:20px"><span id="rs"><button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px" id="reset">Сбросить прогресс</button></span></p>';
  wireBackup();
  if(PAYWALL&&!P.access&&document.getElementById('code'))wireCode(function(){render();});
  document.getElementById('reset').onclick=function(){document.getElementById('rs').innerHTML='Точно сбросить всё? <button type="button" class="btn" style="min-height:40px;padding:4px 14px;font-size:15px" id="yes">Да, сбросить</button> <button type="button" class="btn ghost" style="min-height:40px;padding:4px 14px;font-size:15px" id="no">Отмена</button>';
    document.getElementById('yes').onclick=function(){var a=P.access;P=freshP();P.access=a;P.onboarded=true;save();render();};
    document.getElementById('no').onclick=function(){render();};};}

/* ---------- события ---------- */
function act(n){
  if(n==='onb-ok'){P.onboarded=true;save();render();}
  if(n==='rem-later'){P.lastReminder=P.sessions;save();render();}}
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-act]');if(a){act(a.dataset.act);return;}
  var s=e.target.closest('[data-start]');if(s){NAMES.run='home';startModule(s.dataset.start);return;}
  var v=e.target.closest('[data-v]');if(v){NAMES.run='home';if(v.dataset.v==='train')R=null;if(location.hash&&PREVIEW)history.replaceState(null,'',location.pathname+location.search);go({name:v.dataset.v});}});
window.addEventListener('hashchange',route);
setInterval(function(){if(!document.hidden&&(view.name==='run'||view.name==='train'||view.name==='table')){var k=dayKey();if(P.days[k]===undefined)P.sessions=(P.sessions||0)+1;P.days[k]=(P.days[k]||0)+5;save();}},5000);
if(!PREVIEW&&'serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',function(){navigator.serviceWorker.register('service-worker.js').catch(function(){});});}
boot();
})();
