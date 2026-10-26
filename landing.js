/* Демо на лендинге: пример 7 × 8, три объяснения. Работает без сети, ничего не сохраняет. */
(function(){
  var box=document.getElementById('dx'),btn=document.getElementById('dbtn');
  if(!box||!btn)return;
  function cells(rows,mark){var s='<div class="rect" style="--cols:7" aria-hidden="true">';
    for(var r=0;r<rows;r++)for(var c=0;c<7;c++)s+='<i'+(r>=mark?' class="c2"':'')+'></i>';
    return s+'</div>';}
  var V=[
    {t:'Разбей восемь рядов на пять и три. Получится 7 × 5 = 35 и 7 × 3 = 21. Сложи их. 35 + 21 = 56.',v:function(){return cells(8,5)+'<div class="eq sm">7 × 8 = 35 + 21 = <b>56</b></div>';}},
    {t:'Восемь — это десять без двух. Сначала 7 × 10 = 70. Жёлтые клетки лишние, это два ряда по семь. Убери их. 70 − 14 = 56.',v:function(){return cells(10,8)+'<div class="eq sm">70 − 14 = <b>56</b></div>';}},
    {t:'Удваивай три раза. Два раза по семь это 14. Ещё раз удвой, будет 28. И ещё раз, будет 56. Три удвоения дают умножение на восемь.',v:function(){return '<div class="eq sm">7 × 2 = 14<br>14 × 2 = 28<br>28 × 2 = <b>56</b></div>';}}];
  var i=-1,ICON='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.5-5.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.onclick=function(){
    i=(i+1)%V.length;var v=V[i];
    box.innerHTML='<p class="expl" id="dt"></p><p class="small">Объяснение '+(i+1)+' из '+V.length+'</p>'+v.v();
    box.querySelector('#dt').textContent=v.t;
    btn.innerHTML=ICON+'Объясни по-другому';
  };
})();
