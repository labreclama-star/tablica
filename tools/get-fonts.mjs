// Скачивает шрифты и кладёт .woff2 в ../fonts под нужными именами.
// Запуск (нужен Node.js 18+ и интернет, один раз, на вашем компьютере):
//   cd tools
//   npm init -y
//   npm i @fontsource/rubik @fontsource/nunito @fontsource/caveat
//   node get-fonts.mjs
// Шрифты под лицензией SIL OFL, их можно размещать на своём сайте.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'fonts');
mkdirSync(out, { recursive: true });

const wanted = [
  ['rubik', [500, 700]],
  ['nunito', [600, 800]],
  ['caveat', [600]],
];
let missing = 0;
for (const [family, weights] of wanted) {
  for (const weight of weights) {
    for (const subset of ['cyrillic', 'latin']) {
      const name = `${family}-${subset}-${weight}-normal.woff2`;
      const src = join(here, 'node_modules', '@fontsource', family, 'files', name);
      if (!existsSync(src)) { console.error('Нет файла:', src); missing++; continue; }
      copyFileSync(src, join(out, name));
      console.log('OK', name);
    }
  }
}
console.log(missing ? `Не хватает файлов: ${missing}` : 'Готово: все шрифты в папке fonts/');
