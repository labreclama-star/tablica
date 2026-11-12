document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.mods') || document.querySelector('.grid2');
  if (!container) return;

  // 1. Перемешиваем статьи (Fisher-Yates shuffle)
  const articles = Array.from(container.children);
  for (let i = articles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [articles[i], articles[j]] = [articles[j], articles[i]];
  }
  
  // 2. Возвращаем перемешанные статьи в контейнер
  articles.forEach(el => container.appendChild(el));

  // 3. Ленивая загрузка (скрываем все, кроме первых 12)
  const itemsPerPage = 12;
  let currentIndex = itemsPerPage;

  articles.forEach((el, i) => {
    if (i >= itemsPerPage) el.style.display = 'none';
  });

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Показать еще статьи';
  btn.style.margin = '20px auto';
  btn.style.display = currentIndex < articles.length ? 'block' : 'none';
  container.parentElement.appendChild(btn);

  function loadMore() {
    const nextBatch = articles.slice(currentIndex, currentIndex + itemsPerPage);
    nextBatch.forEach(el => el.style.display = '');
    currentIndex += itemsPerPage;
    
    if (currentIndex >= articles.length) {
      btn.style.display = 'none';
    }
  }

  btn.addEventListener('click', loadMore);

  // Автоподгрузка при прокрутке
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && currentIndex < articles.length) {
      loadMore();
    }
  }, { rootMargin: '200px' });

  observer.observe(btn);
});
