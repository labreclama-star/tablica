document.addEventListener('DOMContentLoaded', () => {
  // Ищем контейнер, где лежат карточки статей (обычно это div с классом mods или grid)
  const container = document.querySelector('.mods') || document.querySelector('.grid2');
  if (!container) return;

  const articles = Array.from(container.children);
  const itemsPerPage = 12; // Сколько статей показывать сразу
  let currentIndex = itemsPerPage;

  // Прячем все статьи после 12-й
  articles.forEach((el, i) => {
    if (i >= itemsPerPage) el.style.display = 'none';
  });

  // Создаем кнопку "Показать еще"
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Показать еще статьи';
  btn.style.margin = '20px auto';
  btn.style.display = currentIndex < articles.length ? 'block' : 'none';
  container.parentElement.appendChild(btn);

  // Логика подгрузки
  function loadMore() {
    const nextBatch = articles.slice(currentIndex, currentIndex + itemsPerPage);
    nextBatch.forEach(el => el.style.display = ''); // Показываем
    currentIndex += itemsPerPage;
    
    if (currentIndex >= articles.length) {
      btn.style.display = 'none'; // Прячем кнопку, если статьи кончились
    }
  }

  btn.addEventListener('click', loadMore);

  // АВТОЗАГРУЗКА ПРИ ПРОКРУТКЕ (Intersection Observer)
  // Как только кнопка показывается на экране, срабатывает подгрузка
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && currentIndex < articles.length) {
      loadMore();
    }
  }, { rootMargin: '200px' }); // Срабатывает за 200px до конца

  observer.observe(btn);
});
