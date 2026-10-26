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
FOOT='''<footer class="foot"><span class="age" title="Возрастная маркировка">6+</span><a href="how.html">Как хранятся данные</a><a href="offer.html">Оферта</a><a href="privacy.html">Политика конфиденциальности</a><a href="notice.html">Уведомление о хранении данных</a></footer>'''
BRAND='<i aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i>Таблица без зубрёжки'

INDEX='''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
<title>Таблица без зубрёжки</title>
<meta name="description" content="Тренажёр умножения и деления для детей, 6+. Без регистрации, прогресс хранится на вашем устройстве.">
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

def doc_page(title,body):
    return '''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
<title>'''+title+''' — Таблица без зубрёжки</title>
<meta name="robots" content="noindex">
</head>
<body class="docpage">
<div class="wrap">
  <header class="top"><a class="brand" href="./" style="text-decoration:none">'''+BRAND+'''</a></header>
  <main><article class="card doc">'''+body+'''</article>
  <p style="margin-top:14px"><a class="btn ghost" href="trainer.html" style="text-decoration:none;display:inline-flex;align-items:center">← К тренажёру</a></p></main>
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
    foot=('<footer class="lp-foot"><span class="age" title="Возрастная маркировка">6+</span><a href="offer.html">Оферта</a><a href="privacy.html">Политика конфиденциальности</a><a href="how.html">Как хранятся данные</a><span>Контакты: '+PH('email поддержки')+'</span></footer>')
    if preview: foot=foot.replace('offer.html','#offer').replace('privacy.html','#privacy').replace('how.html','#how')
    return '''<div class="lp">
<header class="lp-top"><span class="brand" style="cursor:default">'''+BRAND+'''</span>'''+('' if preview else '<a href="#tariffs">Тарифы</a>')+'''</header>
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
<details><summary>Нужна ли установка?</summary><p>Нет, всё работает прямо в браузере. Сайт можно добавить на экран «Домой», тогда он откроется как приложение и будет работать без интернета.</p></details>
<details><summary>Безопасно ли для ребёнка?</summary><p>Да. Мы не собираем персональные данные, нет регистрации, рекламы и аналитики. Прогресс хранится только на вашем устройстве.</p></details>
<details><summary>Что будет с прогрессом, если сменить телефон?</summary><p>В разделе «Родителям» есть сохранение прогресса в файл и загрузка его на новом устройстве.</p></details>
<details><summary>Как получить код после оплаты?</summary><p>Оплата проходит на странице платёжного сервиса. После неё там появится код доступа. Введите его в разделе «Родителям» тренажёра, и тариф откроется.</p></details>
'''+foot+'''
</div>'''
def hero_data():
    p=os.path.join(ROOT,'img','hero.png')
    return open(p,'rb').read() if os.path.exists(p) else None
_hd=hero_data()
import struct
HERO_WH=struct.unpack('>II',_hd[16:24]) if _hd else (480,640)
LANDING=('''<!doctype html>
<html lang="ru">
<head>
'''+HEAD_COMMON+'''
<title>Таблица без зубрёжки: тренажёр умножения и деления для детей</title>
<meta name="description" content="Интерактивный тренажёр таблицы умножения и деления для 1–5 классов. Объясняет смысл, а не заставляет зубрить. Всего 10 минут в день. Без регистрации.">
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
for k,(t,b) in DOCS.items(): wr(k+'.html',doc_page(t,b))

# --- предпросмотр (один файл для артефакта: без service worker, шрифты с Google Fonts)
css=rd('app.css')
js=rd('app.js')
docs_js=json.dumps({k:b.replace('href="notice.html"','href="#notice"') for k,(t,b) in DOCS.items()},ensure_ascii=False).replace('</','<\\/')
foot_prev=FOOT.replace('privacy.html','#privacy').replace('how.html','#how').replace('offer.html','#offer').replace('notice.html','#notice')
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
document.addEventListener('click',function(e){var x=e.target.closest('[data-lp]');if(!x)return;var k=x.dataset.lp;
if(k==='back'){W.hidden=true;L.hidden=false;window.scrollTo(0,0);return;}
show(k==='free'?'':(k==='code'?'parent':'buy'));});})();</script>
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

wr('preview/tablica-preview.html',prev)
print('built', len(prev))
