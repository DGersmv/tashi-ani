/**
 * Добавляет generateStaticParams во все API route файлы для статического экспорта
 */

const fs = require('fs');
const path = require('path');

function findRouteFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findRouteFiles(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  
  return results;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const files = findRouteFiles(apiDir);

let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Проверяем, есть ли уже generateStaticParams
  if (content.includes('generateStaticParams')) {
    return; // Уже есть
  }
  
  // Проверяем, есть ли export const dynamic
  if (!content.includes('export const dynamic')) {
    content = 'export const dynamic = "force-static";\n\n' + content;
  }
  
  // Находим место после импортов для вставки generateStaticParams
  const importEnd = content.lastIndexOf('import');
  if (importEnd === -1) return;
  
  const nextLine = content.indexOf('\n', importEnd);
  if (nextLine === -1) return;
  
  const insertPos = content.indexOf('\n', nextLine + 1);
  if (insertPos === -1) return;
  
  const generateStaticParams = '\n// Для статического экспорта (не используется, т.к. API работает через PHP)\nexport async function generateStaticParams() {\n  return [];\n}\n';
  
  content = content.slice(0, insertPos) + generateStaticParams + content.slice(insertPos);
  
  fs.writeFileSync(file, content, 'utf8');
  fixed++;
  console.log(`✅ Исправлен: ${path.relative(process.cwd(), file)}`);
});

console.log(`\n📊 Исправлено файлов: ${fixed} из ${files.length}`);
