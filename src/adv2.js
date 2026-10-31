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
  if(!P.adv){app.innerHTML='<section class="card lift"><h1>Награды</h1><p class="lead" style="margin:12px 0">Награды входят в продвинутый режим.</p><button type="button" class="btn" data-act="adv">Включить продвинутый режим</button></section>';return;}
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
  if(!P.adv){app.innerHTML='<section class="card lift"><h1>Трудные примеры</h1><p class="lead" style="margin:12px 0">Этот раздел входит в продвинутый режим.</p><button type="button" class="btn" data-act="adv">Включить продвинутый режим</button></section>';return;}
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
function homeAdv(){
  var hero0=app.querySelector('section.card.lift');if(!hero0)return;var html='';
  if(!P.adv){html='<section class="note"><h3>Продвинутый режим</h3><p>Включите переключатель вверху страницы. Появятся повторения через дни, трудные примеры, игры, награды, озвучка и итоговая проверка.</p><div class="row"><button type="button" class="btn ghost" data-act="adv">Включить</button></div></section>';}
  else{
    var L=stickerList(),n=L.filter(function(x){return x.ok;}).length,wk=weakKeys()[0],hint2='';
    if(wk){var p=wk.split('×');hint2='<p class="small" style="margin:10px 0 0">Давай потренируем '+p[0]+' × '+p[1]+'. <button type="button" class="linkb" data-hard="'+wk+'">Открыть</button></p>';}
    function tile(v,t,s2){return '<button type="button" class="mod" data-v="'+v+'"><span class="mod-tag">'+t+'</span><span class="mod-s">'+s2+'</span></button>';}
    var d=dailyNow(),due=dueList().length,last=P.final.length?P.final[P.final.length-1]:null;
    function row2(ok,txt,v){return '<button type="button" class="grow'+(ok?' done':'')+'" data-v="'+v+'"><i class="tick" aria-hidden="true">'+(ok?'✓':'')+'</i><span>'+txt+'</span></button>';}
    html='<section class="card goals"><h3>Сегодня три цели</h3><div class="goal-list">'+row2(d.ex>=5,'Примеры: '+Math.min(d.ex,5)+' из 5','train')+row2(d.rev>=1,'Повтор в тренажёре'+(due?' (ждут: '+due+')':''),'train')+row2(d.game>=1,'Одна игра','games')+'</div></section>'
     +'<section class="note"><h3>Итоговая проверка</h3><p>'+FINAL_N+' примеров без подсказок и таймера. Цель: '+FINAL_PASS+'% и выше.'+(last?' Последний результат: '+last.ok+' из '+last.n+'.':'')+'</p><div class="row"><button type="button" class="btn ghost" data-act="final">Пройти итоговую проверку</button></div></section>'
     +'<section class="note"><h3>Ещё можно</h3><div class="mods">'+tile('hard','Трудные примеры','Пять самых сложных')+tile('games','Игры','Четыре короткие игры')+tile('stickers','Награды','Наклеек: '+n+' из '+L.length)+'</div>'+hint2+'</section>';}
  hero0.insertAdjacentHTML('afterend',html);}
function advParent(){
  if(!P.adv)return '<h2>Продвинутый режим</h2><section class="card"><p>Выключен. Он добавляет повторения через дни, трудные примеры, игры, награды, озвучку и итоговую проверку.</p><div class="row" style="margin-top:12px"><button type="button" class="btn" data-act="adv">Включить</button></div></section>';
  var due=dueList().length,known=0,tot=0,k;for(k in P.sr){tot++;if(P.sr[k].box>=4)known++;}
  var d=dailyNow();
  function row2(ok,txt){return '<div class="grow'+(ok?' done':'')+'" style="cursor:default"><i class="tick" aria-hidden="true">'+(ok?'✓':'')+'</i><span>'+txt+'</span></div>';}
  var hist=P.final.length?'<div class="bars">'+P.final.slice(-5).reverse().map(function(r){var p=Math.round(r.ok/r.n*100);return '<div><span>'+new Date(r.d).toLocaleDateString('ru-RU')+'</span><span>'+r.ok+' из '+r.n+' ('+p+'%)'+(p>=FINAL_PASS?' · цель достигнута':'')+'</span></div>';}).join('')+'</div>':'<p class="small">Итоговая проверка ещё не проходилась.</p>';
  var say=MODS.map(function(m){var s=SAY[m.id];return '<li><b>'+m.title+'.</b> '+s.parent+(P.told[m.id]?' <span class="stars">Рассказано: '+P.told[m.id]+'</span>':'')+'</li>';}).join('');
  var prn=PREVIEW?'<p class="small">Печатные карточки и квадрат Пифагора доступны в проекте на вашем хостинге (файл print.html).</p>':'<p><a href="print.html">Печатные карточки и квадрат Пифагора</a></p>';
  return '<h2>Продвинутый режим</h2><section class="card"><p style="font-weight:800">'+esc(weekLine())+'</p>'+tipHtml()+'</section>'
   +'<div class="grid2" style="margin-top:14px"><section class="card"><h3>Цели на сегодня</h3><div class="goal-list">'+row2(d.ex>=5,'Примеры: '+Math.min(d.ex,5)+' из 5')+row2(d.rev>=1,'Повтор в тренажёре'+(due?' (ждут: '+due+')':''))+row2(d.game>=1,'Одна игра')+'</div></section>'
   +'<section class="card"><h3>Повторения</h3><p>К повтору сегодня: <b>'+due+'</b>.</p><p class="small">Пример считается надёжно выученным после четырёх верных ответов с растущими паузами (1, 3, 7, 14 дней). Таких примеров: '+known+' из 54, всего в расписании: '+tot+'.</p></section></div>'
   +'<div class="grid2" style="margin-top:14px"><section class="card"><h3>Итоговая проверка</h3><p class="small">'+FINAL_N+' примеров без подсказок и таймера. Цель: '+FINAL_PASS+'% и выше.</p>'+hist+'<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="final">Пройти</button></div></section>'
   +'<section class="card"><h3>Материалы</h3>'+prn+'<p class="small">Озвучка работает через голос вашего устройства. Если голоса нет, включите русский голос в настройках телефона.</p></section></div>'
   +'<section class="card" style="margin-top:14px"><h3>Вопросы для разговора</h3><ul class="tips">'+say+'</ul></section><section class="card" style="margin-top:14px"><button type="button" class="btn ghost" data-act="adv">Выключить продвинутый режим</button></section>';}

