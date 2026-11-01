#!/usr/bin/env python3
"""Генерация кодов доступа. Коды в сайт не кладутся: в app.js попадают только их SHA-256.

  python3 tools/make-codes.py combo-std 50     # CMB-STD-XXXX-XXXX: Стандарт в обоих тренажёрах
  python3 tools/make-codes.py combo-pro 50     # CMB-PRO-XXXX-XXXX: Продвинутый в обоих тренажёрах
  python3 tools/make-codes.py mental-std 50    # MNT-STD-XXXX-XXXX: Стандарт только в «Устном счёте»
  python3 tools/make-codes.py mental-pro 50    # MNT-PRO-XXXX-XXXX: Продвинутый только в «Устном счёте»
  python3 tools/make-codes.py standard 50      # STANDARD-XXXX-XXXX: Стандарт только в «Умножении» (прежний формат)
  python3 tools/make-codes.py pro 50           # PRO-XXXX-XXXX: Продвинутый только в «Умножении» (прежний формат)

Псевдонимы для «Умножения»: mult-std = standard, mult-pro = pro.
Регистр при вводе не важен. Скрипт печатает коды и строку SHA-256 для app.js."""
import hashlib, secrets, sys

# тип: (префикс, переменная в app.js, что открывает)
TYPES = {
    'combo-std':  ('CMB-STD',  'CODES_CMB_STD', 'Стандарт в «Умножении» и «Устном счёте»'),
    'combo-pro':  ('CMB-PRO',  'CODES_CMB_PRO', 'Продвинутый в «Умножении» и «Устном счёте»'),
    'mental-std': ('MNT-STD',  'CODES_MNT_STD', 'Стандарт только в «Устном счёте»'),
    'mental-pro': ('MNT-PRO',  'CODES_MNT_PRO', 'Продвинутый только в «Устном счёте»'),
    'standard':   ('STANDARD', 'CODES_STD',     'Стандарт только в «Умножении»'),
    'pro':        ('PRO',      'CODES_PRO',     'Продвинутый только в «Умножении»'),
}
ALIAS = {'mult-std': 'standard', 'mult-pro': 'pro'}
ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   # без похожих символов 0/O, 1/I

def grp():
    return ''.join(secrets.choice(ALPH) for _ in range(4))

def main():
    kind = ALIAS.get((sys.argv[1] if len(sys.argv) > 1 else '').lower(), (sys.argv[1] if len(sys.argv) > 1 else '').lower())
    if kind not in TYPES:
        sys.exit('Укажите тип кода: ' + ', '.join(TYPES) + '. Пример: python3 tools/make-codes.py combo-pro 50')
    try:
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    except ValueError:
        sys.exit('Количество должно быть числом.')
    prefix, var, what = TYPES[kind]
    codes = [prefix + '-' + grp() + '-' + grp() for _ in range(n)]
    print('Тип: %s (%s)' % (kind, what))
    print('Коды (храните отдельно, в сайт их не кладите):')
    print('\n'.join(codes))
    print('\nВставьте в app.js вместо var %s=[...];' % var)
    print('var %s=[' % var + ','.join('"%s"' % hashlib.sha256(c.encode()).hexdigest() for c in codes) + '];')

if __name__ == '__main__':
    main()
