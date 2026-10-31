/* ---------- настройки сборки ---------- */
var PREVIEW=!!window.__PREVIEW__;
var PAYWALL=false;            /* true: блоки после FREE_BLOCKS требуют код доступа */
var FREE_BLOCKS=2;
var PRICE='1 900 ₽';
var PAY_URL='https://example.com/pay';   /* страница оплаты у платёжного агрегатора */
var CODES_SHA256=[];                      /* SHA-256 кодов доступа (см. README) */

/* ---------- хранение прогресса: IndexedDB, запасной режим в памяти ---------- */
var SCHEMA=2,APP_ID='tablica-bez-zubrezhki',OLD_KEY='tbl.v1';
function freshP(){return {schemaVersion:SCHEMA,done:{},stars:{},attempts:{},stats:{},days:{},alts:{},access:false,onboarded:false,sessions:0,lastBackupAt:null,lastReminder:0};}
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
  ['done','stars','attempts','stats','days','alts'].forEach(function(k){if(!f[k]||typeof f[k]!=='object')f[k]={};});
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
function rec(f,ok){if(!f)return;var k=fk(f);var s=P.stats[k]||(P.stats[k]={ok:0,bad:0});if(ok)s.ok++;else s.bad++;save();}

