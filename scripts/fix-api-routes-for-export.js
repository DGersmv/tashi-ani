/**
 * Добавляет export const dynamic = "force-static" во все API route файлы
 * чтобы Next.js мог их экспортировать как статические
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const apiRoutesPath = path.join(__dirname, '..', 'src', 'app', 'api', '**', 'route.ts');

function fixApiRoutes() {
  const files = glob.sync(apiRoutesPath);
  let fixed = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Проверяем, есть ли уже export const dynamic
    if (content.includes('export const dynamic')) {
      return; // Уже исправлен
    }
    
    // Добавляем в начало файла (после комментариев если есть)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Пропускаем комментарии в начале
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('//') || lines[i].trim() === '') {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    
    // Вставляем export const dynamic = "force-static"
    lines.splice(insertIndex, 0, 'export const dynamic = "force-static";');
    
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    fixed++;
    console.log(`✅ Исправлен: ${path.relative(process.cwd(), file)}`);
  });
  
  console.log(`\n📊 Исправлено файлов: ${fixed} из ${files.length}`);
}

fixApiRoutes();
