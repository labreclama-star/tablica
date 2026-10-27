# -*- coding: utf-8 -*-
import re, os, json
ROOT=os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(ROOT,p),encoding='utf-8').read()
def wr(p,t):
    os.makedirs(os.path.dirname(os.path.join(ROOT,p)) or ROOT,exist_ok=True)
    open(os.path.join(ROOT,p),'w',encoding='utf-8').write(t)
def PH(t): return '<mark class="ph">['+t+']</mark>'
DRAFT='<div class="draft"><b>Черновик.</b> Заполните поля в квадратных скобках, покажите текст юристу и удалите эту плашку. Это не юридическая консультация.</div>'

HOW='''<h1>Как хранятся данные</h1>
<p>Коротко: мы не знаем, кто вы и кто ваш ребёнок.</p>
<ul>
<li><b>Нет регистрации.</b> Сервис не просит email, телефон, имя ребёнка или родителя.</li>
<li><b>Прогресс хранится только в браузере</b> на вашем устройстве. Мы его не видим и не получаем.</li>
<li><b>Нет аналитики и рекламных трекеров.</b> Сервис никому не отправляет сведения о ваших действиях.</li>
<li><b>Всё нужное для работы загружается с этого же сайта.</b> Шрифты, скрипты и картинки не приходят со сторонних серверов.</li>
<li><b>Оплата.</b> Платежи принимает '''+PH('название платёжного сервиса')+'''. Он сам отвечает за данные плательщика. Мы получаем только уведомление об успешной оплате без персональных данных.</li>
<li><b>Технические журналы сервера.</b> Сервер, который отдаёт страницы, записывает IP-адрес в технические журналы. '''+PH('выберите честную формулировку под ваш хостинг: «Журналы удаляются через N дней» или «Журналы не ведутся»')+'''</li>
<li><b>Если очистить данные браузера, прогресс не восстановится.</b> Поэтому есть сохранение файла прогресса и установка на экран «Домой».</li>
</ul>
<h2>Как не потерять прогресс</h2>
<ul>
<li>Добавьте сервис на экран «Домой»: так браузер реже удаляет данные.</li>
<li>В разделе «Для родителя» нажмите «Экспортировать прогресс» и сохраните файл.</li>
<li>На новом устройстве или после очистки браузера нажмите там же «Импортировать прогресс» и выберите файл.</li>
</ul>
<h2>Вопросы</h2>
<p>Напишите нам: '''+PH('контакт, например email')+'''.</p>'''

NOTICE=DRAFT+'''<h1>Уведомление о локальном хранении данных</h1>
<p>Дата редакции: '''+PH('дата')+'''.</p>
<h2>1. Что хранится</h2>
<p>Только учебный прогресс: какие блоки пройдены, оценка за проверки, статистика по примерам (сколько раз получилось и не получилось), число минут занятий по дням, сколько раз нажималась кнопка «Объясни по-другому», отметка об открытом полном доступе и служебные отметки интерфейса. Эти данные хранятся в браузере на устройстве пользователя (IndexedDB). Они не передаются исполнителю и никому другому.</p>
<h2>2. Что не хранится</h2>
<p>Имя, возраст, фотографии, email, телефон, адрес, аккаунты и пароли. Сервис их не запрашивает и не собирает. Данные банковских карт сервис не видит и не обрабатывает.</p>
<h2>3. Внешние запросы</h2>
<p>Страница не обращается к сторонним серверам: шрифты, скрипты, стили и иконки загружаются с самого сайта. Сервис не использует аналитику, рекламные пиксели и внешние виджеты. Проверка: в инструментах разработчика браузера, вкладка «Сеть» (Network), все запросы идут на один и тот же адрес.</p>
<h2>4. Платежи</h2>
<p>Платежи обрабатывает '''+PH('название платёжного сервиса')+''', который является самостоятельным оператором персональных данных плательщика. Исполнитель получает только уведомление об успешной оплате '''+PH('проверьте, какие данные видны в личном кабинете платёжного сервиса, и поправьте фразу')+'''.</p>
<h2>5. Журналы хостинга</h2>
<p>Сервер, который отдаёт страницы сайта, может записывать технические данные запросов, включая IP-адрес. '''+PH('честная формулировка под ваш хостинг: срок хранения журналов или «журналы не ведутся»')+'''</p>
<h2>6. Права пользователя</h2>
<ul>
<li><b>Очистить данные.</b> Кнопка «Сбросить прогресс» в разделе «Для родителя» или очистка данных сайта в настройках браузера.</li>
<li><b>Экспортировать.</b> Кнопка «Экспортировать прогресс» сохраняет файл с вашим прогрессом.</li>
<li><b>Импортировать.</b> Кнопка «Импортировать прогресс» загружает такой файл и объединяет его с текущим прогрессом после подтверждения.</li>
</ul>
<h2>7. Предупреждение о потере данных</h2>
<p>При очистке данных браузера, смене устройства или использовании приватного режима прогресс не восстанавливается, потому что исполнитель его не хранит. Сохраняйте файл прогресса.</p>
<h2>8. Контакты</h2>
<p>'''+PH('ФИО или наименование исполнителя, email')+'''</p>'''

OFFER=DRAFT+'''<h1>Публичная оферта</h1>
<p>Дата редакции: '''+PH('дата')+'''.</p>
<h2>1. Общие положения</h2>
<p>Настоящая публичная оферта (далее «Оферта») является предложением '''+PH('ФИО или наименование, статус: ИП, самозанятый или юридическое лицо, ИНН')+''' (далее «Исполнитель») любому физическому лицу (далее «Пользователь») заключить договор на изложенных ниже условиях. Акцептом Оферты считается оплата.</p>
<h2>2. Предмет</h2>
<p>Исполнитель предоставляет Пользователю доступ к интерактивному тренажёру «Таблица без зубрёжки» (далее «Сервис»): программе для самостоятельных занятий умножением и делением на устройстве Пользователя. Сервис не является образовательным курсом или образовательной организацией, не выдаёт документов об образовании и не заменяет школьные занятия. '''+PH('юрист: проверьте формулировку')+'''</p>
<h2>3. Цена и оплата</h2>
<p>Сервис имеет три уровня доступа. «Бесплатный»: пять блоков (смысл умножения, ×1, ×2, ×5, ×10) и до 10 минут занятий в день, предоставляется без оплаты и без ограничения срока. «Стандарт»: 990 ₽, единовременно. «Продвинутый»: 1 990 ₽, единовременно. '''+PH('НДС: не облагается или ставка')+''' Платные тарифы предоставляются без ограничения срока '''+PH('уточните: «в течение срока существования Сервиса»')+'''. Состав возможностей каждого тарифа указан на главной странице сайта на момент оплаты.</p>
<h2>4. Порядок доступа</h2>
<p>Оплата проходит на странице платёжного сервиса. После оплаты платёжный сервис показывает код доступа. Пользователь вводит код в Сервисе (раздел «Родителям» или экран с тарифами), после чего выбранный тариф открывается на этом устройстве. '''+PH('опишите, на скольких устройствах можно использовать один код')+'''</p>
<h2>5. Условия предоставления Сервиса, отсутствие гарантии результата</h2>
<p>Сервис предоставляется по модели «как есть». Пользователь может протестировать бесплатную версию перед покупкой. Исполнитель не гарантирует достижение конкретного учебного результата. Возврат средств за цифровой товар надлежащего качества не предусмотрен. '''+PH('юрист: проверьте формулировку на соответствие закону о защите прав потребителей (права при недостатках цифрового товара, порядок отказа до начала предоставления доступа) и при необходимости смягчите её')+'''</p>
<h2>6. Локальное хранение прогресса</h2>
<p>Прогресс хранится в браузере пользователя. При очистке данных браузера, смене устройства или использовании приватного режима прогресс не восстанавливается. Исполнитель не несёт ответственности за потерю локальных данных. Для сохранения прогресса в Сервисе предусмотрены экспорт и импорт файла, а также установка на экран «Домой».</p>
<h2>7. Платежи</h2>
<p>Платежи обрабатываются '''+PH('название платёжного сервиса')+''', который является самостоятельным оператором персональных данных. Исполнитель получает только уведомление об успешной оплате.</p>
<h2>8. Возврат в иных случаях</h2>
<p>'''+PH('юрист: порядок возврата по закону о защите прав потребителей для цифровых товаров')+'''</p>
<h2>9. Ответственность</h2>
<p>'''+PH('юрист: ограничения ответственности, доступность Сервиса, изменения Сервиса')+'''</p>
<h2>10. Персональные данные</h2>
<p>Порядок обработки данных описан в <a href="notice.html">Уведомлении о локальном хранении данных</a>.</p>
<h2>11. Реквизиты и контакты</h2>
<p>'''+PH('наименование, ИНН, ОГРН или ОГРНИП, email, адрес для заявлений')+'''</p>'''

PRIVACY=DRAFT+'''<h1>Политика конфиденциальности</h1>
<p>Дата редакции: '''+PH('дата')+'''.</p>
<h2>1. Кто мы</h2>
<p>'''+PH('ФИО или наименование исполнителя, статус, ИНН, email')+''' (далее «Исполнитель») предоставляет сервис «Таблица без зубрёжки».</p>
<h2>2. Какие данные мы получаем</h2>
<p>Исполнитель не собирает персональные данные пользователей и их детей. В сервисе нет регистрации, форм с именем, почтой или телефоном, нет аналитики и рекламных трекеров. Подробности: <a href="how.html">Как хранятся данные</a> и <a href="notice.html">Уведомление о локальном хранении данных</a>.</p>
<h2>3. Учебный прогресс</h2>
<p>Прогресс (пройденные блоки, статистика примеров, открытый тариф) хранится в браузере на устройстве пользователя. Исполнитель его не получает и не видит.</p>
<h2>4. Оплата</h2>
<p>Платежи принимает '''+PH('название платёжного сервиса')+'''. Данные плательщика обрабатывает он как самостоятельный оператор. Исполнитель получает только уведомление об успешной оплате.</p>
<h2>5. Журналы сервера</h2>
<p>'''+PH('честная формулировка про технические журналы хостинга, включая IP-адрес')+'''</p>
<h2>6. Обращения</h2>
<p>По вопросам данных пишите на '''+PH('email')+'''. '''+PH('юрист: сроки ответа, ссылки на 152-ФЗ при необходимости')+'''</p>'''

DOCS={'privacy':('Политика конфиденциальности',PRIVACY),'how':('Как хранятся данные',HOW),'offer':('Публичная оферта',OFFER),'notice':('Уведомление о хранении данных',NOTICE)}

HEAD_COMMON='''<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2B59E6">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Таблица">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="app.css">'''
FOOT='''<footer class="foot"><span class="age" title="Возрастная маркировка">6+</span><a href="about.html">О нас</a><a href="blog.html">Блог</a><a href="partners.html">Для партнёров</a><a href="contacts.html">Связаться с нами</a><a href="offer.html">Оферта</a><a href="privacy.html">Политика конфиденциальности</a><a href="how.html">Как хранятся данные</a><a href="notice.html">Уведомление о хранении данных</a></footer>'''
BRAND='<i aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i>Таблица без зубрёжки'
# ---------- SEO, блог, информационные страницы ----------
import html as _html, datetime
SITE_URL=os.environ.get('SITE_URL','https://example.com').rstrip('/')   # адрес сайта: задайте перед выкладкой (README)
CONTACT_EMAIL=''      # email поддержки; пусто = показывается заглушка [email поддержки]
CONTACT_TG=''         # ссылка на Telegram, например https://t.me/name; пусто = заглушка
TODAY=datetime.date.today().isoformat()
MONTHS=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
def date_ru(d):
    y,m,dd=d.split('-'); return '%d %s %s'%(int(dd),MONTHS[int(m)-1],y)
def E(t): return _html.escape(str(t),quote=True)
def ld_script(obj): return '<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False).replace('</','<\\/')+'</script>'
def abs_url(path): return SITE_URL+'/'+path if path else SITE_URL+'/'
def seo_head(path,title,desc,keywords,typ='website',ld=(),robots=None,published=None):
    u=abs_url(path); img=SITE_URL+'/img/og.png'
    h='<title>%s</title>\n<meta name="description" content="%s">\n<meta name="keywords" content="%s">\n<link rel="canonical" href="%s">\n'%(E(title),E(desc),E(keywords),E(u))
    if robots: h+='<meta name="robots" content="%s">\n'%robots
    h+='<meta property="og:type" content="%s">\n<meta property="og:site_name" content="Таблица без зубрёжки">\n<meta property="og:locale" content="ru_RU">\n<meta property="og:title" content="%s">\n<meta property="og:description" content="%s">\n<meta property="og:url" content="%s">\n<meta property="og:image" content="%s">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'%(typ,E(title),E(desc),E(u),E(img))
    if published: h+='<meta property="article:published_time" content="%s">\n'%published
    h+='<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="%s">\n<meta name="twitter:description" content="%s">\n<meta name="twitter:image" content="%s">\n'%(E(title),E(desc),E(img))
    for o in ld: h+=ld_script(o)+'\n'
    return h
# --- мета-данные страниц: ключ -> (title, description, keywords)
META={
 'index':('Таблица умножения без слёз: онлайн-тренажёр для детей 1–5 классов','Интерактивный тренажёр таблицы умножения и деления для 1–5 классов. Объясняет смысл наглядно, без зубрёжки. Попробуйте бесплатно, без регистрации.','таблица умножения, тренажёр таблицы умножения, умножение для детей, таблица умножения онлайн, как выучить таблицу умножения'),
 'trainer':('Тренажёр таблицы умножения и деления онлайн — Таблица без зубрёжки','Онлайн-тренажёр: короткие уроки с картинками, проверка после каждого блока, объяснение другими словами при ошибке. Работает в браузере, без регистрации.','тренажёр таблицы умножения, умножение онлайн, деление для детей, обучение умножению'),
 'blog':('Блог о таблице умножения: советы родителям и игры для детей','Статьи для родителей: как объяснить умножение, выучить таблицу умножения на 9, на 5 и 10, какие игры помогут во 2 классе и что делать, если ребёнок не понимает.','блог про таблицу умножения, как выучить таблицу умножения, советы родителям, обучение детей математике'),
 'about':('О нас: зачем мы сделали тренажёр таблицы умножения','Почему появился сервис «Таблица без зубрёжки», во что мы верим и как устроено обучение: понимание вместо зубрёжки, маленькие шаги, никакой рекламы.','о нас, таблица без зубрёжки, тренажёр умножения, миссия'),
 'contacts':('Связаться с нами — Таблица без зубрёжки','Как написать в поддержку сервиса «Таблица без зубрёжки»: email, Telegram и реквизиты исполнителя. Отвечаем на вопросы про доступ, коды и работу тренажёра.','контакты, поддержка, таблица без зубрёжки'),
 'partners':('Для партнёров: реферальная программа для блогеров и педагогов','Условия сотрудничества с сервисом «Таблица без зубрёжки»: 50% от продаж платных тарифов для блогеров, педагогов и авторов образовательных каналов.','партнёрская программа, реферальная программа, образовательные блогеры, сотрудничество'),
 'offer':('Публичная оферта — Таблица без зубрёжки','Условия предоставления доступа к сервису «Таблица без зубрёжки»: тарифы, порядок оплаты и доступа, ответственность сторон.','публичная оферта, условия использования, тарифы'),
 'privacy':('Политика конфиденциальности — Таблица без зубрёжки','Какие данные получает и не получает сервис «Таблица без зубрёжки»: нет регистрации, нет аналитики, прогресс хранится только на вашем устройстве.','политика конфиденциальности, персональные данные, безопасность детей'),
 'how':('Как хранятся данные — Таблица без зубрёжки','Прогресс ребёнка хранится только в браузере на вашем устройстве. Рассказываем, как сохранить его в файл, перенести на другой телефон и не потерять.','хранение данных, прогресс тренажёра, экспорт прогресса'),
 'notice':('Уведомление о хранении данных — Таблица без зубрёжки','Уведомление о локальном хранении учебного прогресса: что хранится в браузере, что не собирается, как очистить или перенести данные.','уведомление о хранении данных, локальное хранение, конфиденциальность')}
# --- блог
BLOG=json.load(open(os.path.join(ROOT,'blog_data.json'),encoding='utf-8'))
ARTS=BLOG['articles']
for _a in ARTS: _a['file']='blog-'+_a['slug']+'.html'
SLUG2FILE={a['slug']:a['file'] for a in ARTS}
def md_inline(s):
    s=E(s)
    def lk(m):
        t,u=m.group(1),m.group(2)
        if u.startswith('blog:'): return '<a href="%s">%s</a>'%(SLUG2FILE[u[5:]],t)
        if u=='trainer': return '<a href="trainer.html">%s</a>'%t
        return '<a href="%s" rel="nofollow noopener" target="_blank">%s</a>'%(u,t)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lk,s)
def render_body(blocks):
    out=[];ul=[]
    def flush():
        if ul: out.append('<ul>'+''.join('<li>%s</li>'%x for x in ul)+'</ul>'); ul.clear()
    for b in blocks:
        if b.startswith('- '): ul.append(md_inline(b[2:])); continue
        flush()
        if b.startswith('### '): out.append('<h3>%s</h3>'%md_inline(b[4:]))
        elif b.startswith('## '): out.append('<h2>%s</h2>'%md_inline(b[3:]))
        else: out.append('<p>%s</p>'%md_inline(b))
    flush(); return '\n'.join(out)
CTA_TEXT='Попробуйте наш интерактивный тренажёр. Он объясняет умножение наглядно, без слёз и скучной зубрёжки.'
CTA_HTML='<aside class="cta"><p>'+CTA_TEXT+'</p><a class="btn" href="trainer.html">Попробовать тренажёр бесплатно</a></aside>'
def article_inner(a):
    others=[x for x in ARTS if x is not a]
    rel='<h2>Читайте также</h2><ul class="related">'+''.join('<li><a href="%s">%s</a></li>'%(x['file'],E(x['title'])) for x in others)+'</ul>'
    return ('<nav class="crumbs" aria-label="Хлебные крошки"><a href="./">Главная</a> / <a href="blog.html">Блог</a></nav><h1>'+E(a['h1'])+'</h1>'
      '<p class="post-meta">Автор: '+E(a['author'])+' · <time datetime="'+a['date']+'">'+date_ru(a['date'])+'</time> · Время чтения: '+E(a['read'])+'</p>'
      +CTA_HTML+render_body(a['body'])+CTA_HTML+rel)
def blog_inner():
    cards=''.join('<article class="post-card"><h2><a href="%s">%s</a></h2><p>%s</p><p class="post-meta"><time datetime="%s">%s</time> · Время чтения: %s</p><a class="btn ghost" href="%s">Читать статью</a></article>'%(a['file'],E(a['title']),E(a['description']),a['date'],date_ru(a['date']),E(a['read']),a['file']) for a in ARTS)
    return '<h1>Блог о таблице умножения</h1><p class="lead">Практические статьи для родителей: как объяснить умножение, какие приёмы помогают и во что играть дома. Без обещаний «за три дня», зато с понятными шагами.</p><div class="blog-grid">'+cards+'</div>'+CTA_HTML
def article_ld(a):
    return {"@context":"https://schema.org","@type":"Article","headline":a['h1'],"description":a['description'],"inLanguage":"ru","image":[SITE_URL+'/img/og.png'],"datePublished":a['date'],"dateModified":a['date'],"author":{"@type":"Organization","name":a['author']},"publisher":{"@type":"Organization","name":"Таблица без зубрёжки","logo":{"@type":"ImageObject","url":SITE_URL+'/icons/icon-512.png'}},"mainEntityOfPage":{"@type":"WebPage","@id":abs_url(a['file'])},"keywords":a['keywords']}
# --- информационные страницы
FILL='<div class="draft"><b>Заполните поля.</b> Замените значения в квадратных скобках и удалите эту плашку.</div>'
def _mail():
    return '<a href="mailto:%s">%s</a>'%(E(CONTACT_EMAIL),E(CONTACT_EMAIL)) if CONTACT_EMAIL else PH('email поддержки')
ABOUT=FILL+'''<h1>О нас</h1>
<p class="lead">Мы верим, что математика — это не про зубрёжку, а про понимание.</p>
<h2>Зачем мы сделали этот сервис</h2>
<p>Таблица умножения — первое место, где многие дети решают, что «математика не для меня». Они заучивают ответы, путаются, забывают, их торопят, и слёзы над тетрадью становятся привычными. При этом почти каждый пример можно понять: увидеть на картинке, найти закономерность, собрать из уже знакомого. Тогда запоминание получается само, а не через давление.</p>
<p>Так появился тренажёр «Таблица без зубрёжки». Он учит умножению и делению маленькими шагами: короткое объяснение с картинкой, затем задания, затем проверка. Если ребёнок ошибся, сервис не ругает, а показывает тот же приём другими словами.</p>
<h2>Кто это делает</h2>
<p>'''+PH('2–3 предложения о вас или команде: кто вы, чем занимаетесь, почему занялись этим сервисом')+'''</p>
<h2>Во что мы верим</h2>
<ul>
<li><b>Понимание важнее скорости.</b> Сначала смысл, потом запоминание, потом скорость.</li>
<li><b>Маленькие шаги.</b> Один приём за раз, пять-десять минут в день.</li>
<li><b>Ошибка — не провал.</b> На неё отвечают подсказкой и другим объяснением.</li>
<li><b>Никакого давления.</b> В тренажёре нет таймеров на вопросах, рейтингов и очков.</li>
<li><b>Приватность по умолчанию.</b> Мы не собираем имена, телефоны и почты, нет рекламы и трекеров. Прогресс хранится на вашем устройстве.</li>
</ul>
<h2>Что дальше</h2>
<p>Мы продолжаем добавлять блоки, игры и статьи для родителей в <a href="blog.html">блоге</a>. Если у вас есть идея или вы заметили ошибку, напишите нам: <a href="contacts.html">контакты</a>. А попробовать тренажёр можно бесплатно и без регистрации: <a href="trainer.html">открыть тренажёр</a>.</p>'''
def _tg():
    return '<p><a class="btn" href="%s" rel="noopener">Написать в Telegram</a></p>'%E(CONTACT_TG) if CONTACT_TG else '<p>Telegram: '+PH('ссылка на Telegram')+'</p>'
CONTACTS=FILL+'''<h1>Связаться с нами</h1>
<p class="lead">Напишите, если нужна помощь с доступом, кодом или работой тренажёра, есть идея или вопрос.</p>
<h2>Как написать</h2>
<p>Email поддержки: '''+_mail()+'''</p>
'''+_tg()+'''
<p class="small">Формы на сайте нет: у сервиса нет собственного сервера, и мы не собираем данные. Поэтому достаточно написать письмо или сообщение. Отвечаем в течение '''+PH('2')+''' рабочих дней.</p>
<h2>Что указать в письме</h2>
<ul>
<li>Что случилось и на каком устройстве (телефон, планшет, компьютер) и в каком браузере.</li>
<li>Если вопрос про доступ, номер заказа или время оплаты. Сам код доступа присылать не нужно.</li>
<li>Не присылайте персональные данные ребёнка. Они нам не нужны.</li>
</ul>
<h2>Реквизиты исполнителя</h2>
<p>'''+PH('ФИО или наименование, статус: ИП, самозанятый или юридическое лицо, ИНН, ОГРН или ОГРНИП, адрес для заявлений')+'''</p>
<p class="small">Юридические документы: <a href="offer.html">оферта</a>, <a href="privacy.html">политика конфиденциальности</a>, <a href="how.html">как хранятся данные</a>.</p>'''
PARTNERS=DRAFT+'''<h1>Для партнёров</h1>
<p class="lead">Если вы ведёте блог, канал, сообщество или занимаетесь с детьми, давайте работать вместе. Вы получаете 50% от продаж платных тарифов, которые пришли по вашей рекомендации.</p>
<h2>Кому подойдёт</h2>
<ul>
<li>Блогеры и авторы каналов о детях, школе и воспитании.</li>
<li>Репетиторы и педагоги, которые рекомендуют родителям тренажёры.</li>
<li>Администраторы родительских сообществ и чатов классов.</li>
</ul>
<h2>Условия</h2>
<ul>
<li><b>Вознаграждение:</b> 50% от стоимости платных тарифов («Стандарт» и «Продвинутый»), оплаченных по вашей ссылке или с вашим промокодом. Бесплатная версия вознаграждения не приносит.</li>
<li><b>Как учитываются продажи:</b> '''+PH('опишите механизм: партнёрская ссылка или промокод платёжного сервиса, как вы сверяете продажи; сайт сам аналитику не ведёт')+'''</li>
<li><b>Выплаты:</b> '''+PH('периодичность, минимальная сумма, способ и налоговый статус партнёра')+'''</li>
<li><b>Что мы даём:</b> описание сервиса для вашей аудитории, скриншоты и бесплатный доступ к тарифу «Продвинутый», чтобы вы могли честно оценить его до рекомендации.</li>
</ul>
<h2>Правила рекомендаций</h2>
<ul>
<li>Рассказывайте о сервисе честно: не обещайте гарантированный результат и сроки, не выдумывайте отзывы.</li>
<li>Соблюдайте законодательство о рекламе, включая маркировку рекламных материалов.</li>
<li>Не используйте чужие бренды и не выдавайте себя за сотрудников сервиса.</li>
</ul>
<h2>Как начать</h2>
<p>Напишите нам через страницу <a href="contacts.html">«Связаться с нами»</a>: расскажите о своей площадке и аудитории. Мы ответим и пришлём материалы. А чтобы узнать сервис лучше, прочитайте <a href="about.html">о нас</a> и посмотрите <a href="blog.html">блог</a>.</p>'''
EXTRA_DOCS={'about':('О нас',ABOUT),'contacts':('Связаться с нами',CONTACTS),'partners':('Для партнёров',PARTNERS)}

FAQ=[('Нужна ли установка?','Нет, всё работает прямо в браузере. Сайт можно добавить на экран «Домой», тогда он откроется как приложение и будет работать без интернета.'),
 ('Безопасно ли для ребёнка?','Да. Мы не собираем персональные данные, нет регистрации, рекламы и аналитики. Прогресс хранится только на вашем устройстве.'),
 ('Что будет с прогрессом, если сменить телефон?','В разделе «Родителям» есть сохранение прогресса в файл и загрузка его на новом устройстве.'),
 ('Как получить код после оплаты?','Оплата проходит на странице платёжного сервиса. После неё там появится код доступа. Введите его в разделе «Родителям» тренажёра, и тариф откроется.')]
def faq_html(): return '\n'.join('<details><summary>%s</summary><p>%s</p></details>'%(E(q),E(a)) for q,a in FAQ)
def faq_ld(): return {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]}
def preview_links(h):
    h=h.replace('href="trainer.html"','href="#" data-lp="free"')
    return re.sub(r'href="([\w-]+)\.html"',r'href="#\1"',h)


INDEX='''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
'''+seo_head('trainer.html',*META['trainer'])+'''
</head>
<body>
<div class="wrap">
  <header class="top">
    <button class="brand" type="button" data-v="home">'''+BRAND+'''</button>
    <nav class="nav" aria-label="Разделы">
      <button type="button" data-v="home">Уроки</button>
      <button type="button" data-v="train">Тренажёр</button>
      <button type="button" data-v="games" hidden>Игры</button>
      <button type="button" data-v="stickers" hidden>Награды</button>
      <button type="button" data-v="table">Квадрат</button>
      <button type="button" data-v="parent">Родителям</button>
      <a href="blog.html">Блог</a>
    </nav>
    <button type="button" class="adv-sw" role="switch" aria-checked="false" data-act="adv"><span class="knob" aria-hidden="true"></span>Продвинутый режим</button>
  </header>
  <main id="app"></main>
  <noscript><p class="card">Для работы тренажёра нужен включённый JavaScript.</p></noscript>
  '''+FOOT+'''
</div>
<script src="app.js" defer></script>
</body>
</html>
'''

HEADER_SIMPLE='<header class="top"><a class="brand" href="./" style="text-decoration:none">'+BRAND+'</a><nav class="nav" aria-label="Разделы"><a href="trainer.html">Тренажёр</a><a href="blog.html">Блог</a></nav></header>'
def content_page(path,title,desc,kw,inner,ld=(),typ='website',back=True,published=None):
    return '''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
'''+seo_head(path,title,desc,kw,typ=typ,ld=ld,published=published)+'''
</head>
<body class="docpage">
<div class="wrap">
  '''+HEADER_SIMPLE+'''
  <main><article class="card doc">'''+inner+'''</article>
  '''+('<p style="margin-top:14px"><a class="btn ghost" href="trainer.html" style="text-decoration:none;display:inline-flex;align-items:center">← К тренажёру</a></p>' if back else '')+'''</main>
  '''+FOOT+'''
</div>
</body>
</html>
'''

# ---------- лендинг ----------
import base64
_app=rd('app.js')
PAY_STD=re.search(r"var PAY_URL_STD='([^']+)'",_app).group(1)
PAY_PRO=re.search(r"var PAY_URL_PRO='([^']+)'",_app).group(1)
PRICE_STD=re.search(r"PRICE_STD='([^']+)'",_app).group(1)
PRICE_PRO=re.search(r"PRICE_PRO='([^']+)'",_app).group(1)
LCSS='''
.lp{max-width:1040px;margin:0 auto;padding:16px 16px 40px}
.lp-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 0 16px}
.lp-top a{font-weight:800}
.lp-hero{display:grid;grid-template-columns:1.15fr .85fr;gap:28px;align-items:center;padding:12px 0 28px}
.lp-hero h1{font-size:clamp(30px,5.2vw,48px);line-height:1.12;margin:10px 0 14px}
.lp-hero figure{margin:0}
.lp-hero img{display:block;width:100%;height:auto;border:2px solid var(--edge);border-radius:12px;box-shadow:0 6px 0 var(--edge);background:var(--card)}
.lp-hero figcaption{font-size:14px;color:var(--ink2);margin-top:10px;text-align:center}
.lp .btn.big{min-height:60px;font-size:20px;padding:10px 26px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
.lp h2{font-size:clamp(24px,4vw,32px);margin:36px 0 14px}
.lp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.lp-cards .card{margin:0}
.lp-cards h3{margin:0 0 6px}
.lp-cards p{margin:0}
.lp-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;align-items:stretch}
.lp-plan{border:2px solid var(--edge);border-radius:12px;background:var(--card);padding:18px;display:grid;gap:12px;grid-template-rows:auto auto auto 1fr auto;box-shadow:0 5px 0 var(--edge)}
.lp-plan.pro{background:var(--blue-soft)}
.lp-plan h3{margin:0;font-size:24px}
.lp-plan .tag{font-size:14px;font-weight:800;color:var(--blue);margin:0}
.lp-plan .price{margin:0;font:700 38px var(--f-head);color:var(--blue)}
.lp-plan .price small{font:600 15px var(--f-body);color:var(--ink2)}
.lp-plan ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
.lp-plan li{padding-left:26px;position:relative;font-size:16px}
.lp-plan li::before{content:'✓';position:absolute;left:0;font-weight:800;color:var(--ok)}
.lp-plan li.no{color:var(--ink2)}
.lp-plan li.no::before{content:'—';color:var(--ink2)}
.lp-plan .btn{text-decoration:none;display:inline-flex;align-items:center;justify-content:center;margin-top:4px}
.lp-note{font-size:15px;color:var(--ink2);margin:14px 0 0}
.lp details{border:2px solid var(--edge);border-radius:10px;background:var(--card);padding:12px 16px;margin-bottom:10px}
.lp summary{font-weight:800;cursor:pointer;min-height:32px}
.lp details p{margin:10px 0 0}
.lp-demo{margin-top:8px}
#dx{display:grid;gap:10px;justify-items:start}
.lp-demo h2{margin:0 0 8px}
.lp-sec{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center}
.lp-sec svg{width:72px;height:72px}
.lp-sec h2{margin:0 0 8px}
.lp-sec p{margin:0 0 8px}
.lp-rev{margin:0;display:grid;gap:12px;align-content:space-between}
.lp-rev blockquote{margin:0;font-size:17px}
.lp-rev figcaption{display:flex;align-items:center;gap:10px;font-size:15px;color:var(--ink2)}
.lp-rev .av{width:40px;height:40px;border-radius:50%;background:var(--yellow);color:var(--on-yellow);border:2px solid var(--edge);display:grid;place-items:center;font:700 18px var(--f-head);flex:none}
.lp-foot{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin-top:40px;padding-top:16px;border-top:2px dashed var(--edge);font-size:15px}
@media(max-width:780px){.lp-hero{grid-template-columns:1fr}.lp-sec{grid-template-columns:1fr}}
'''
def lp_btn(kind,label,cls,preview):
    if preview:
        return '<button type="button" class="btn %s" data-lp="%s">%s</button>'%(cls,kind,label)
    href={'free':'trainer.html','std':PAY_STD,'pro':PAY_PRO,'code':'trainer.html#parent'}[kind]
    ext=' rel="noopener"' if kind in('std','pro') else ''
    return '<a class="btn %s" href="%s"%s>%s</a>'%(cls,href,ext,label)
def lp_plan(name,tag,price,rows,btn,pro=False):
    li=''.join('<li%s>%s</li>'%('' if ok else ' class="no"',t) for ok,t in rows)
    return '<div class="lp-plan%s"><h3>%s</h3><p class="tag">%s</p><p class="price">%s <small>%s</small></p><ul>%s</ul>%s</div>'%(' pro' if pro else '',name,tag,price,'' if price=='0 ₽' else 'один раз',li,btn)
def security_html():
    shield='<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 6l20 7v16c0 14-8.5 23-20 29C20.500 52 12 43 12 29V13z" style="fill:var(--blue);stroke:var(--edge);stroke-width:3;stroke-linejoin:round"/><path d="M22 32l7 7 13-14" style="fill:none;stroke:#fff;stroke-width:5;stroke-linecap:round;stroke-linejoin:round"/></svg>'
    return '<section class="card lp-sec" style="margin-top:36px">'+shield+'<div><h2>Полная безопасность для вашего ребёнка</h2><p>Сервис работает по технологии Zero-Server. Мы не собираем имена, телефоны и почты. Прогресс хранится только на вашем устройстве. Никакой рекламы и трекеров.</p><p class="small">Как и любой сайт, хостинг может вести технические журналы запросов. Подробнее в политике конфиденциальности.</p></div></section>'
def reviews_html():
    # Отзывы показываются только если в reviews.json есть настоящие записи (с согласия авторов).
    p=os.path.join(ROOT,'reviews.json')
    try: items=json.load(open(p,encoding='utf-8'))
    except Exception: items=[]
    items=[x for x in items if isinstance(x,dict) and x.get('name') and x.get('text')][:6]
    if not items: return ''
    from html import escape as E
    cards=''.join('<figure class="card lp-rev"><blockquote>%s</blockquote><figcaption><span class="av" aria-hidden="true">%s</span><span>%s%s</span></figcaption></figure>'%(E(x['text']),E(x['name'][:1].upper()),E(x['name']),(', '+E(x['who'])) if x.get('who') else '') for x in items)
    return '<h2>Отзывы родителей</h2><div class="lp-cards">'+cards+'</div>'
def landing_body(preview,hero_src):
    free=lp_btn('free','Попробовать бесплатно','big',preview)
    rows_free=[(1,'Блоки: смысл умножения, ×1, ×2, ×5, ×10'),(1,'Кнопка «Объясни по-другому», три варианта'),(1,'Доступ навсегда'),(1,'10 минут занятий в день'),(1,'Базовый тренажёр'),(0,'Остальные блоки и деление'),(0,'Текстовые задачи и итоговая проверка'),(0,'Игры и повторения через дни')]
    rows_std=[(1,'Все блоки и деление'),(1,'Кнопка «Объясни по-другому», три варианта'),(1,'Занятия без ограничения по времени'),(1,'Тренажёр с чередованием примеров'),(1,'Текстовые задачи из жизни'),(1,'Итоговая проверка'),(1,'Трудные примеры, цели на день, простой отчёт'),(0,'Игры и интервальные повторения'),(0,'«Расскажи родителю», награды, озвучка')]
    rows_pro=[(1,'Всё из тарифа «Стандарт»'),(1,'Интервальные повторения через 1, 3, 7 дней'),(1,'Мини-игры: «Найди пару», «Счёт шагами» и другие'),(1,'«Расскажи родителю» (объяснение вслух)'),(1,'Награды-наклейки и озвучка заданий'),(1,'Печатные карточки и расширенный отчёт'),(1,'Доступ навсегда, один платёж')]
    plans=(lp_plan('Бесплатный','Чтобы попробовать','0 ₽',rows_free,lp_btn('free','Попробовать бесплатно','ghost',preview))
      +lp_plan('Стандарт','Всё для изучения таблицы',PRICE_STD,rows_std,lp_btn('std','Выбрать тариф','',preview))
      +lp_plan('Продвинутый','Всё включено',PRICE_PRO,rows_pro,lp_btn('pro','Выбрать тариф','',preview),True))
    fig=('<figure><img src="%s" alt="Экран тренажёра: объяснение умножения на клеточках" width="%d" height="%d"><figcaption>Так выглядит урок: картинка, короткое объяснение, затем задание.</figcaption></figure>'%((hero_src,)+HERO_WH)) if hero_src else ''
    code=('<button type="button" class="linkb" data-lp="code">ввести код</button>' if preview else '<a href="trainer.html#parent">ввести код</a>')
    foot=FOOT
    if preview: foot=preview_links(foot)
    return '''<div class="lp">
<header class="lp-top"><span class="brand" style="cursor:default">'''+BRAND+'''</span>'''+'<nav class="lp-nav" aria-label="Разделы">'+('<a href="#blog">Блог</a>' if preview else '<a href="#tariffs">Тарифы</a><a href="blog.html">Блог</a>')+'</nav>'+'''</header>
<section class="lp-hero"><div>
<p class="kicker">Умножение и деление</p>
<h1>Таблица умножения без слёз и вечерних скандалов. Ребёнок поймёт, а не просто зазубрит.</h1>
<p class="lead">Интерактивный тренажёр для 1–5 классов. Превращает скучные столбики в понятную игру. Всего 10 минут в день.</p>
<p style="margin:20px 0 10px">'''+free+'''</p>
<p class="small">Без регистрации. Прогресс хранится на вашем устройстве.</p>
</div>'''+fig+'''</section>
<section class="card lift lp-demo" id="demo-sec"><h2>Попробуй прямо сейчас</h2>
<p class="lead">Проверьте сами. Нажмите на кнопку, чтобы увидеть, как сервис объясняет сложный пример. Никакой регистрации.</p>
<div class="demo"><div class="eq">7 × 8 = ?</div><div id="dx" aria-live="polite"></div><div class="row"><button type="button" class="btn ghost alt" id="dbtn">Покажи, как посчитать</button></div><noscript><p class="small">Для демо нужен включённый JavaScript.</p></noscript></div>
</section>
<h2>Знакомо?</h2>
<div class="lp-cards">
<div class="card"><h3>Ребёнок плачет над домашкой?</h3><p>Зубрёжка без понимания превращается в слёзы и ссоры.</p></div>
<div class="card"><h3>Учит-учит, а завтра опять забыл?</h3><p>Выученное «на отлично» без повторений быстро стирается.</p></div>
<div class="card"><h3>Репетитор — это дорого и долго?</h3><p>Короткие занятия по 5–10 минут дома часто работают не хуже.</p></div>
</div>
<h2>Как это работает</h2>
<div class="lp-cards">
<div class="card"><h3>Понимание смысла</h3><p>Учим не «заклинаниям», а логике: 4 × 3 — это 4 + 4 + 4, а ещё прямоугольник из клеточек.</p></div>
<div class="card"><h3>Секретные приёмы</h3><p>Умножение на 9 на пальцах, на 5 как на часах, на 10 одним нулём.</p></div>
<div class="card"><h3>Повторения через дни</h3><p>В тарифе «Продвинутый» сервис сам напоминает повторить пример через 1, 3, 7 дней, чтобы знания держались дольше.</p></div>
</div>
'''+security_html()+reviews_html()+'''<h2 id="tariffs">Тарифы</h2>
<div class="lp-plans">'''+plans+'''</div>
<p class="lp-note">Платёж один раз, без подписки, доступ без ограничения срока. Сервис предоставляется «как есть». Сначала попробуйте бесплатную версию: возврат средств за цифровой товар надлежащего качества не предусмотрен. Уже купили? Можно '''+code+'''.</p>
<h2>Вопросы и ответы</h2>
'''+faq_html()+'''
'''+foot+'''
</div>'''
def hero_data():
    p=os.path.join(ROOT,'img','hero.png')
    return open(p,'rb').read() if os.path.exists(p) else None
_hd=hero_data()
import struct
HERO_WH=struct.unpack('>II',_hd[16:24]) if _hd else (480,640)
_pn=lambda s:re.sub(r'\D','',s)
SOFTAPP_LD={"@context":"https://schema.org","@type":"SoftwareApplication","name":"Таблица без зубрёжки","description":META['index'][1],"url":abs_url(''),"applicationCategory":"EducationalApplication","operatingSystem":"Web (любой современный браузер)","inLanguage":"ru","image":SITE_URL+'/img/og.png',"audience":{"@type":"PeopleAudience","suggestedMinAge":6},"offers":[{"@type":"Offer","name":"Бесплатный","price":"0","priceCurrency":"RUB"},{"@type":"Offer","name":"Стандарт","price":_pn(PRICE_STD),"priceCurrency":"RUB","url":PAY_STD},{"@type":"Offer","name":"Продвинутый","price":_pn(PRICE_PRO),"priceCurrency":"RUB","url":PAY_PRO}]}
LANDING=('''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
'''+seo_head('',*META['index'],ld=[SOFTAPP_LD,faq_ld()])+'''
<style>'''+LCSS+'''</style>
</head>
<body>
'''+landing_body(False,'img/hero.png' if _hd else '')+'''
<script src="landing.js" defer></script>
</body>
</html>
''')

# --- боевые файлы
wr('trainer.html',INDEX)
wr('index.html',LANDING)
ALLDOCS=dict(DOCS); ALLDOCS.update(EXTRA_DOCS)
for k,(t,body_) in ALLDOCS.items(): wr(k+'.html',content_page(k+'.html',*META[k],body_))
wr('blog.html',content_page('blog.html',*META['blog'],blog_inner(),ld=[{"@context":"https://schema.org","@type":"Blog","name":"Блог о таблице умножения","url":abs_url('blog.html'),"inLanguage":"ru","blogPost":[{"@type":"BlogPosting","headline":a['h1'],"url":abs_url(a['file']),"datePublished":a['date']} for a in ARTS]}],back=False))
for a in ARTS: wr(a['file'],content_page(a['file'],a['title'],a['description'],a['keywords'],article_inner(a),ld=[article_ld(a)],typ='article',back=False,published=a['date']))
# sitemap.xml, robots.txt
_pages=[('',1.0,'weekly',TODAY),('trainer.html',0.9,'weekly',TODAY),('blog.html',0.8,'weekly',max(a['date'] for a in ARTS))]
_pages+=[(a['file'],0.7,'monthly',a['date']) for a in ARTS]
_pages+=[('about.html',0.5,'yearly',TODAY),('contacts.html',0.5,'yearly',TODAY),('partners.html',0.4,'yearly',TODAY),('offer.html',0.3,'yearly',TODAY),('privacy.html',0.3,'yearly',TODAY),('how.html',0.3,'yearly',TODAY),('notice.html',0.3,'yearly',TODAY)]
wr('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%.1f</priority>\n  </url>\n'%(E(abs_url(p)),lm,cf,pr) for p,pr,cf,lm in _pages)+'</urlset>\n')
wr('robots.txt','User-agent: *\nAllow: /\nDisallow: /print.html\nDisallow: /print.js\nDisallow: /tools/\nDisallow: /src/\n\nSitemap: '+SITE_URL+'/sitemap.xml\n')
# service-worker: список страниц
_sw=rd('service-worker.js'); _pg=['index.html','trainer.html','blog.html','print.html']+[a['file'] for a in ARTS]+[k+'.html' for k in ALLDOCS]
_sw=re.sub(r"/\*PAGES\*/.*?/\*END\*/","/*PAGES*/ "+", ".join("'%s'"%p for p in _pg)+", /*END*/",_sw,flags=re.S); wr('service-worker.js',_sw)

# --- предпросмотр (один файл для артефакта: без service worker, шрифты с Google Fonts)
css=rd('app.css')
js=rd('app.js')
_pd={k:preview_links(body_) for k,(t,body_) in ALLDOCS.items()}
_pd['blog']=preview_links(blog_inner())
for a in ARTS: _pd[a['file'][:-5]]=preview_links(article_inner(a))
docs_js=json.dumps(_pd,ensure_ascii=False).replace('</','<\\/')
foot_prev=preview_links(FOOT)
LP_PREV=landing_body(True,('data:image/png;base64,'+base64.b64encode(_hd).decode()) if _hd else '')
prev='''<meta charset="utf-8">
<title>Таблица без зубрёжки</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Nunito:wght@600;800&family=Rubik:wght@500;700&display=swap">
<style>
'''+css+'''
</style>
<style>'''+LCSS+'''</style>
<div id="landing">'''+LP_PREV+'''</div>
<div class="wrap" id="appwrap" hidden>
  <p style="margin:0 0 8px"><button type="button" class="linkb" data-lp="back">← Главная страница сайта</button></p>
  <header class="top">
    <button class="brand" type="button" data-v="home">'''+BRAND+'''</button>
    <nav class="nav" aria-label="Разделы">
      <button type="button" data-v="home">Уроки</button>
      <button type="button" data-v="train">Тренажёр</button>
      <button type="button" data-v="games" hidden>Игры</button>
      <button type="button" data-v="stickers" hidden>Награды</button>
      <button type="button" data-v="table">Квадрат</button>
      <button type="button" data-v="parent">Родителям</button>
      <a href="blog.html">Блог</a>
    </nav>
    <button type="button" class="adv-sw" role="switch" aria-checked="false" data-act="adv"><span class="knob" aria-hidden="true"></span>Продвинутый режим</button>
  </header>
  <main id="app"></main>
  '''+foot_prev+'''
</div>
<script>window.__PREVIEW__=true;window.__DOCS__='''+docs_js+''';</script>
<script>'''+rd('landing.js')+'''</script>
<script>(function(){var L=document.getElementById('landing'),W=document.getElementById('appwrap');
function show(h){L.hidden=true;W.hidden=false;window.scrollTo(0,0);if(h==='')document.querySelector('#appwrap .brand').click();else location.hash=h;}
document.addEventListener('click',function(e){var x=e.target.closest('[data-lp]');if(!x)return;e.preventDefault();var k=x.dataset.lp;
if(k==='back'){W.hidden=true;L.hidden=false;window.scrollTo(0,0);return;}
show(k==='free'?'':(k==='code'?'parent':'buy'));});
window.addEventListener('hashchange',function(){if(window.__DOCS__[location.hash.slice(1)]){L.hidden=true;W.hidden=false;window.scrollTo(0,0);}});})();</script>
<script>
'''+js+'''
</script>
'''
# ---------- печатные материалы (только для своего хостинга) ----------
HARDC=[(6,7,42,'Сначала 5 × 7 = 35. Прибавь ещё одну семёрку. Получится 42.'),
 (6,8,48,'Сначала 6 × 4 = 24. Потом удвой. 24 + 24 = 48.'),
 (7,8,56,'Запомни ряд чисел 5, 6, 7, 8. Первые два числа 5 и 6 дают 56. Последние два числа 7 и 8 — это множители.'),
 (7,9,63,'10 × 7 = 70. Вычти 7. Получится 63.'),
 (8,9,72,'10 × 8 = 80. Вычти 8. Получится 72.')]
def pyth():
    t='<table class="pt"><caption>Квадрат Пифагора</caption><tr><th>×</th>'+''.join('<th>%d</th>'%i for i in range(1,11))+'</tr>'
    for r in range(1,11):
        t+='<tr><th>%d</th>'%r+''.join('<td>%d</td>'%(r*c) for c in range(1,11))+'</tr>'
    return t+'</table>'
cards=''.join('<div class="cd"><div class="q">%d × %d</div><div class="fold">согни здесь</div><div class="a"><b>%d</b><p>%s</p></div></div>'%(a,b2,c,t) for a,b2,c,t in HARDC)
PRINT='''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
<title>Печатные материалы — Таблица без зубрёжки</title>
<meta name="robots" content="noindex">
<style>
.pt{border-collapse:collapse;margin:12px auto;font:700 18px var(--f-head)}
.pt caption{font:700 24px var(--f-head);margin-bottom:8px}
.pt th,.pt td{border:2px solid var(--edge);width:2.2em;height:2.2em;text-align:center}
.pt th{background:var(--yellow);color:var(--on-yellow)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.cd{border:2px dashed var(--edge);border-radius:8px;padding:12px;background:var(--card);break-inside:avoid}
.cd .q{font:700 36px var(--f-head);text-align:center;padding:10px 0}
.cd .fold{font-size:12px;text-align:center;color:var(--ink2);border-top:1px dashed var(--edge);padding-top:4px}
.cd .a{text-align:center}.cd .a b{font:700 30px var(--f-head);color:var(--blue)}
.cd .a p{margin:6px 0 0;font-size:15px}
@media print{.noprint{display:none!important}body{background:#fff}.cd,.pt th,.pt td{border-color:#000}.pt th{background:#eee}.pgb{break-before:page}}
</style>
</head>
<body class="docpage">
<div class="wrap">
  <header class="top noprint"><a class="brand" href="./" style="text-decoration:none">'''+BRAND+'''</a></header>
  <main>
  <section class="card noprint"><h1>Печатные материалы</h1><p>Распечатайте квадрат Пифагора и карточки трудных примеров. Карточки вырежьте и согните по пунктирной линии: сверху пример, снизу ответ и подсказка.</p><p><button type="button" class="btn" id="pr">Печать</button> <a class="btn ghost" href="trainer.html" style="text-decoration:none;display:inline-flex;align-items:center">← К тренажёру</a></p></section>
  <section class="card" style="margin-top:14px">'''+pyth()+'''</section>
  <section class="card pgb" style="margin-top:14px"><h2>Карточки трудных примеров</h2><div class="cards">'''+cards+'''</div></section>
  </main>
  '''+FOOT+'''
</div>
<script src="print.js"></script>
</body>
</html>
'''
wr('print.html',PRINT)
wr('print.js',"document.getElementById('pr').addEventListener('click',function(){window.print();});\n")

prev=prev.replace('<a href="blog.html">Блог</a>','<a href="#blog">Блог</a>')
wr('preview/tablica-preview.html',prev)
print('built', len(prev))
