# -*- coding: utf-8 -*-
s=open('app.js',encoding='utf-8').read()
adv=open('src/adv.js',encoding='utf-8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,('COUNT',s.count(old),old[:90])
    s=s.replace(old,new)

# --- хранение
rep("var SCHEMA=2,","var SCHEMA=3,")
rep("access:false,onboarded:false,sessions:0,lastBackupAt:null,lastReminder:0};}","access:false,onboarded:false,sessions:0,lastBackupAt:null,lastReminder:0,adv:false,sr:{},daily:{},final:[],told:{}};}")
rep("['done','stars','attempts','stats','days','alts'].forEach(function(k){if(!f[k]||typeof f[k]!=='object')f[k]={};});","['done','stars','attempts','stats','days','alts','sr','daily','told'].forEach(function(k){if(!f[k]||typeof f[k]!=='object'||Array.isArray(f[k]))f[k]={};});if(!Array.isArray(f.final))f.final=[];")
rep("if(ok)s.ok++;else s.bad++;save();}","if(ok)s.ok++;else s.bad++;srUpdate(f,ok);save();}")

# --- новый блок перед событиями
rep("/* ---------- события ---------- */",adv+"/* ---------- события ---------- */")

# --- маршрутизация и вид
rep("parent:'parent',doc:'',buy:'home'};","parent:'parent',doc:'',buy:'home',games:'games'};")
rep("  app.innerHTML='';\n  ({home:rHome,run:rRun,train:rTrainStart,table:rTable,parent:rParent,doc:rDoc,buy:rBuy})[view.name]();}",
    "  if(gTimer){clearInterval(gTimer);gTimer=null;}\n  syncChrome();\n  app.innerHTML='';\n  ({home:rHome,run:rRun,train:rTrainStart,table:rTable,parent:rParent,doc:rDoc,buy:rBuy,games:rGames})[view.name]();}")
rep("потом по 5 минут в тренажёре.</p>';}","потом по 5 минут в тренажёре.</p>';homeAdv();}")
rep("var m=MODS[i],items=[];\n  m.steps.forEach(","var m=MODS[i],items=[];\n  if(P.adv&&PRE[m.id])items.push({kind:'pre',mod:m});\n  m.steps.forEach(")
rep("m.practice().forEach(function(q){items.push({kind:'ask',q:q,scored:false,phase:'Пробуем'});});\n  items.push({kind:'break'});","m.practice().forEach(function(q){items.push({kind:'ask',q:q,scored:false,phase:'Пробуем'});});\n  if(P.adv)items.push({kind:'ask',q:storyFor(m),scored:false,phase:'Задача'});\n  items.push({kind:'break'});")
rep("if(it.kind==='explain')rExplain(it);else if(it.kind==='break')rBreak(it);else rAsk(it);}","if(it.kind==='explain')rExplain(it);else if(it.kind==='break')rBreak(it);else if(it.kind==='pre')rPre(it);else if(it.kind==='choice')rChoice(it);else if(it.kind==='final')rFinalQ(it);else rAsk(it);}")
rep("it.step.mount(card.querySelector('.demo'));","it.step.mount(card.querySelector('.demo'));sayBox(card,it);")
rep("if(q.fact)rec(q.fact,it.first===true);\n    inp.disabled=true;alt.hidden=true;","if(q.fact)rec(q.fact,it.first===true);bump('ex');\n    inp.disabled=true;alt.hidden=true;")
rep("function finish(){\n  if(R.mode==='train'){\n","function finish(){\n  if(R.mode==='final'){finishFinal();return;}\n  if(R.mode==='train'){bump('rev');\n")
rep("R={mode:'train',mod:null,items:pickTrain(8).map(function(q){return {kind:'ask',q:q,scored:true,phase:'Тренажёр'};}),i:0,retries:0};","R={mode:'train',mod:null,items:trainItems(),i:0,retries:0};")
rep("Восемь примеров. Берём только","'+(P.adv?'Около десяти заданий: повторы по расписанию, задачи и выбор приёма. ':'Восемь примеров. ')+'Берём только")

# --- родителям, экспорт, импорт
rep("  +'<h2>Сохранить прогресс</h2>","  +advParent()\n  +'<h2>Сохранить прогресс</h2>")
rep("var a=P.access;P=freshP();P.access=a;P.onboarded=true;save();render();","var a=P.access,ad=P.adv;P=freshP();P.access=a;P.adv=ad;P.onboarded=true;save();render();")
rep("access:P.access===true}},null,2);}","access:P.access===true,adv:P.adv===true,sr:P.sr,daily:P.daily,final:P.final,told:P.told}},null,2);}")
rep("var out={done:{},stars:{},attempts:{},stats:{},days:{},alts:{},access:p.access===true},k;","var out={done:{},stars:{},attempts:{},stats:{},days:{},alts:{},sr:{},daily:{},final:[],told:{},access:p.access===true},k;")
rep("var sets=[['stars',0,3],['attempts',0,100000],['alts',0,1000000]];","var sets=[['stars',0,3],['attempts',0,100000],['alts',0,1000000],['told',0,1000000]];")
rep("  return {data:out};}\nfunction mergeInfo","""  if(p.sr!==undefined){if(!isObj(p.sr))return {err:'Раздел «sr» повреждён.'};for(k in p.sr){var e=p.sr[k];if(!/^\\d{1,2}×\\d{1,2}$/.test(k)||!isObj(e)||!isInt(e.box,0,5)||typeof e.due!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(e.due))return {err:'Раздел «sr» содержит неверные значения.'};out.sr[k]={box:e.box,due:e.due};}}
  if(p.daily!==undefined){if(!isObj(p.daily))return {err:'Раздел «daily» повреждён.'};for(k in p.daily){var g=p.daily[k];if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(k)||!isObj(g)||!isInt(g.ex||0,0,100000)||!isInt(g.rev||0,0,100000)||!isInt(g.game||0,0,100000))return {err:'Раздел «daily» содержит неверные значения.'};out.daily[k]={ex:g.ex||0,rev:g.rev||0,game:g.game||0};}}
  if(p.final!==undefined){if(!Array.isArray(p.final)||p.final.length>200)return {err:'Раздел «final» повреждён.'};for(var j=0;j<p.final.length;j++){var r=p.final[j];if(!isObj(r)||typeof r.d!=='string'||r.d.length>40||isNaN(Date.parse(r.d))||!isInt(r.n,1,200)||!isInt(r.ok,0,200)||r.ok>r.n)return {err:'Раздел «final» содержит неверные значения.'};out.final.push({d:r.d,ok:r.ok,n:r.n});}}
  return {data:out};}
function mergeInfo""")
rep("r.access=inc.access&&!P.access;return r;}","""r.access=inc.access&&!P.access;r.sr=0;for(k in inc.sr)if(!P.sr[k]||inc.sr[k].box>P.sr[k].box)r.sr++;
  r.fin=0;inc.final.forEach(function(x){if(!P.final.some(function(y){return y.d===x.d&&y.ok===x.ok&&y.n===x.n;}))r.fin++;});return r;}""")
rep("if(inc.access)P.access=true;save();}","""for(k in inc.sr){var c=P.sr[k],n=inc.sr[k];if(!c||n.box>c.box||(n.box===c.box&&n.due>c.due))P.sr[k]={box:n.box,due:n.due};}
  for(k in inc.daily){var d0=P.daily[k]||{ex:0,rev:0,game:0},d1=inc.daily[k];P.daily[k]={ex:Math.max(d0.ex||0,d1.ex),rev:Math.max(d0.rev||0,d1.rev),game:Math.max(d0.game||0,d1.game)};}
  inc.final.forEach(function(x){if(!P.final.some(function(y){return y.d===x.d&&y.ok===x.ok&&y.n===x.n;}))P.final.push(x);});
  P.final.sort(function(a,b){return Date.parse(a.d)-Date.parse(b.d);});if(P.final.length>50)P.final=P.final.slice(-50);
  for(k in inc.told)P.told[k]=Math.max(P.told[k]||0,inc.told[k]);
  if(inc.access)P.access=true;save();}""")
rep("(r.access?'<li>Откроется полный доступ</li>':'')","(r.sr?'<li>Расписание повторений: '+r.sr+'</li>':'')+(r.fin?'<li>Итоговых проверок: '+r.fin+'</li>':'')+(r.access?'<li>Откроется полный доступ</li>':'')")

# --- события
rep("  if(n==='onb-ok'){P.onboarded=true;save();render();}","  if(n==='adv'){setAdv(!P.adv);return;}\n  if(n==='final'){startFinal();return;}\n  if(n==='onb-ok'){P.onboarded=true;save();render();}")
rep("var s=e.target.closest('[data-start]');if(s){NAMES.run='home';startModule(s.dataset.start);return;}","var s=e.target.closest('[data-start]');if(s){NAMES.run='home';startModule(s.dataset.start);return;}\n  var gg=e.target.closest('[data-g]');if(gg){go({name:'games',g:gg.dataset.g||null});return;}")
open('app.js','w',encoding='utf-8').write(s)
print('patched ok')
