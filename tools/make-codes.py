#!/usr/bin/env python3
"""Генерация кодов доступа. Коды в сайт не кладутся: в app.js попадают только их SHA-256.

  python3 tools/make-codes.py mental 50    # MNT-XXXX-XXXX: «Устный счёт» целиком (Продвинутый)
  python3 tools/make-codes.py combo 50     # CMB-XXXX-XXXX: оба тренажёра, Продвинутый
  python3 tools/make-codes.py standard 50  # STANDARD-XXXX-XXXX: «Умножение», Стандарт
  python3 tools/make-codes.py pro 50       # PRO-XXXX-XXXX: «Умножение», Продвинутый

Псевдонимы: mult-std = standard, mult-pro = pro. Коды MNT и CMB всегда открывают Продвинутый уровень.
Регистр при вводе не важен. Скрипт печатает коды и строку SHA-256 для app.js."""
import hashlib, secrets, sys

# тип: (префикс, переменная в app.js, что открывает)
TYPES = {
    'mental':   ('MNT',      'CODES_MNT', 'Устный счёт целиком (Продвинутый)'),
    'combo':    ('CMB',      'CODES_CMB', 'Умножение и Устный счёт, оба Продвинутый'),
    'standard': ('STANDARD', 'CODES_STD', 'Умножение, Стандарт'),
    'pro':      ('PRO',      'CODES_PRO', 'Умножение, Продвинутый'),
}
ALIAS = {'mult-std': 'standard', 'mult-pro': 'pro', 'mental-pro': 'mental', 'mental-std': 'mental', 'combo-pro': 'combo', 'combo-std': 'combo'}
ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   # без похожих символов 0/O, 1/I

def grp():
    return ''.join(secrets.choice(ALPH) for _ in range(4))

def main():
    kind = ALIAS.get((sys.argv[1] if len(sys.argv) > 1 else '').lower(), (sys.argv[1] if len(sys.argv) > 1 else '').lower())
    if kind not in TYPES:
        sys.exit('Укажите тип кода: ' + ', '.join(TYPES) + '. Пример: python3 tools/make-codes.py combo 50')
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
