import gulp from 'gulp';
import clean from 'gulp-clean';
import file from 'gulp-file';
import path from 'path';
import fs from 'fs';
import Fontmin from 'fontmin';

const paths = {
  src: 'src/fonts/',
  dist: 'dist/fonts/',
  css: 'dist/css/',
  demo: 'dist/demo/'
};

// Очищення dist
export const cleanDist = () => {
  return gulp.src('dist', { read: false, allowEmpty: true }).pipe(clean());
};

// Конвертація + копіювання оригінальних TTF/OTF
export const convertFonts = (done) => {
  const files = fs
    .readdirSync(paths.src)
    .filter(f => f.endsWith('.ttf') || f.endsWith('.otf'));

  if (files.length === 0) {
    console.log('⚠️ Немає .ttf або .otf файлів у src/fonts/');
    done();
    return;
  }

  const tasks = files.map(fontFile => {
    const srcPath = path.join(paths.src, fontFile);
    const ext = path.extname(fontFile).toLowerCase();
    const baseName = path.basename(fontFile, ext);
    const ttfPath = path.join(paths.dist, `${baseName}.ttf`);

    // Якщо це OTF — конвертуємо в TTF перед подальшою обробкою
    const convertToTtf = () => {
      if (ext === '.otf') {
        console.log(`🔄 Конвертація ${fontFile} → ${baseName}.ttf`);
        const fontminOtf = new Fontmin()
          .src(srcPath)
          .use(Fontmin.otf2ttf())
          .dest(paths.dist);

        return new Promise((resolve, reject) => {
          fontminOtf.run((err) => (err ? reject(err) : resolve()));
        });
      } else {
        // Копіюємо TTF як є
        return new Promise((resolve, reject) => {
          gulp.src(srcPath)
            .pipe(gulp.dest(paths.dist))
            .on('end', resolve)
            .on('error', reject);
        });
      }
    };

    // Потім конвертуємо ttf → web-формати
    const convertToWeb = () => {
      const fontmin = new Fontmin()
        .src(ext === '.otf' ? ttfPath : srcPath)
        .use(Fontmin.ttf2eot())
        .use(Fontmin.ttf2woff())
        .use(Fontmin.ttf2woff2())
        .use(Fontmin.ttf2svg())
        .dest(paths.dist);

      return new Promise((resolve, reject) => {
        fontmin.run((err, out) => (err ? reject(err) : resolve(out)));
      });
    };

    return convertToTtf().then(convertToWeb);
  });

  Promise.all(tasks)
    .then(() => {
      console.log('✅ Усі шрифти успішно конвертовані!');
      done();
    })
    .catch(err => {
      console.error('❌ Помилка при конвертації шрифтів:', err);
      done(err);
    });
};

// Генерація CSS з @font-face
export const generateCSS = () => {
  const files = fs.readdirSync(paths.dist).filter(file => file.endsWith('.ttf'));

  let css = '';
  files.forEach(file => {
    const fontName = path.basename(file, path.extname(file));
    css += `
@font-face {
  font-family: '${fontName}';
  src: url('../fonts/${fontName}.eot');
  src: url('../fonts/${fontName}.eot?#iefix') format('embedded-opentype'),
       url('../fonts/${fontName}.woff2') format('woff2'),
       url('../fonts/${fontName}.woff') format('woff'),
       url('../fonts/${fontName}.ttf') format('truetype'),
       url('../fonts/${fontName}.svg#${fontName}') format('svg');
  font-weight: normal;
  font-style: normal;
}
`;
  });

  return file('fonts.css', css, { src: true }).pipe(gulp.dest(paths.css));
};

// Генерація демо-сторінки
export const generateDemo = () => {
  const files = fs.readdirSync(paths.dist).filter(file => file.endsWith('.ttf'));

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Font Demo</title>
  <link rel="stylesheet" href="../css/fonts.css">
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .sample { font-size: 36px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Font Demo</h1>
`;

  files.forEach(file => {
    const fontName = path.basename(file, path.extname(file));
    html += `<div class="sample" style="font-family: '${fontName}'">Sample Text (${fontName})</div>\n`;
  });

  html += `</body>\n</html>`;

  return file('index.html', html, { src: true }).pipe(gulp.dest(paths.demo));
};

// Основне завдання
export const build = gulp.series(
  cleanDist,
  convertFonts,
  generateCSS,
  generateDemo
);

export default build;
