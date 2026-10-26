#!/usr/bin/env python3
"""Генерация кодов доступа по тарифам.
  python3 tools/make-codes.py standard 50
  python3 tools/make-codes.py pro 50
Печатает коды (их вы загружаете в платёжный сервис или выдаёте покупателям)
и строку SHA-256 для app.js. Сами коды в app.js не попадают.
Код вида STANDARD-XXXX-XXXX или PRO-XXXX-XXXX; при вводе регистр не важен."""
import hashlib, secrets, sys
tier = (sys.argv[1] if len(sys.argv) > 1 else '').lower()
if tier not in ('standard', 'pro'):
    sys.exit('Укажите тариф: standard или pro. Пример: python3 tools/make-codes.py pro 50')
n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
def grp(): return ''.join(secrets.choice(ALPH) for _ in range(4))
codes = [tier.upper() + '-' + grp() + '-' + grp() for _ in range(n)]
print('Коды (храните отдельно, в сайт их не кладите):')
print('\n'.join(codes))
var = 'CODES_STD' if tier == 'standard' else 'CODES_PRO'
print('\nВставьте в app.js вместо var %s=[...];' % var)
print('var %s=[' % var + ','.join('"%s"' % hashlib.sha256(c.encode()).hexdigest() for c in codes) + '];')
