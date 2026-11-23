// Склейка двойных слэшей в URL для SEO
(function() {
  if (window.location.pathname.includes('//')) {
    var cleanPath = window.location.pathname.replace(/\/+/g, '/');
    window.history.replaceState(null, '', cleanPath + window.location.search);
  }
})();
