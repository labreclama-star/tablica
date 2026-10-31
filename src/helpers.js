/* ---------- вспомогательное ---------- */
var ICON='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.5-5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function times(n){var a=n%10,b=n%100;return n+' '+((a>=2&&a<=4&&!(b>=12&&b<=14))?'раза':'раз');}
function simpleHint(q){var m=q.meta;
  if(q.h&&q.h[0])return q.h[0]();
  if(m.t==='mul')return '<p>Число '+m.a+' берём '+times(m.b)+'. Считаем вместе, по одному кружку.</p>'+groups(m.a,m.b);
  if(m.t==='div')return '<p>Разложим '+m.n+' кружков по '+m.d+'. Сколько кучек получилось?</p>'+groups(m.d,m.n/m.d);
  if(m.t==='missing')return '<p>Сколько кучек по '+m.b+' нужно, чтобы стало '+m.x*m.b+'?</p>'+groups(m.b,m.x);
  return hint(q,1);}
function mNeighbor(box){var a=4,n=5;var out=h('<div style="display:grid;gap:12px"></div>');
  function draw(){out.innerHTML=rect(a,n+1,{rowSplit:n})+'<div class="chain"><span class="chip">'+a+' × '+n+' = '+a*n+'</span><span class="op">ещё одно число '+a+'</span><span class="chip hl">'+a+' × '+(n+1)+' = '+a*n+' + '+a+' = '+a*(n+1)+'</span></div>';}
  box.append(row(stepper('Число',2,9,a,function(v){a=v;draw();}),stepper('Знаю на',2,9,n,function(v){n=v;draw();})),out);draw();}
function nbQ(){var a=ri(3,9),n=ri(3,8);
  return Q({key:'nb'+a+'n'+n,lead:a+' × '+n+' = '+a*n+'. Значит '+a+' × '+(n+1)+' = '+a*n+' + '+a+' = ?',eq:'?',answer:a*(n+1),meta:{t:'mul',a:a,b:n+1},fact:[a,n+1],
    h:[function(){return '<p>Было '+a+' × '+n+' = '+a*n+'. Добавь ещё одно число '+a+'.</p>'+rect(a,n+1,{rowSplit:n});},function(){return '<p>'+a*n+' + '+a+' = ?</p>';}]});}
