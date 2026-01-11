/**
 * Скрипт для тестирования PHP API endpoints
 * Использование: npm run php:test
 * 
 * Требует запущенный PHP сервер: npm run php:dev
 */

const http = require('http');

const API_BASE = 'http://localhost:8000';

const tests = [
  {
    name: 'Проверка подключения к БД',
    url: `${API_BASE}/api/db.php`,
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Получение профиля пользователя (должен вернуть ошибку без email)',
    url: `${API_BASE}/api/user/profile.php`,
    method: 'GET',
    expectedStatus: 400
  },
  {
    name: 'Portfolio API',
    url: `${API_BASE}/api/portfolio.php`,
    method: 'GET',
    expectedStatus: 200
  }
];

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname + url.search,
      method: test.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Тестирование PHP API...\n');
  console.log('⚠️  Убедитесь, что PHP сервер запущен: npm run php:dev\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await makeRequest(test);
      const success = response.status === test.expectedStatus;
      
      if (success) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.error(`❌ ${test.name}`);
        console.error(`   Ожидался статус ${test.expectedStatus}, получен ${response.status}`);
        console.error(`   Ответ: ${response.body.substring(0, 200)}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name}`);
      console.error(`   Ошибка: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Результаты: ${passed} прошло, ${failed} провалено`);
  
  if (failed > 0) {
    console.error('\n⚠️  Некоторые тесты провалились. Проверьте:');
    console.error('   1. PHP сервер запущен (npm run php:dev)');
    console.error('   2. config.php создан и настроен');
    console.error('   3. База данных доступна');
    process.exit(1);
  } else {
    console.log('\n✅ Все тесты прошли успешно!');
  }
}

// Проверяем, запущен ли сервер
http.get(`${API_BASE}/api/portfolio.php`, (res) => {
  runTests();
}).on('error', (error) => {
  console.error('❌ Не удалось подключиться к PHP серверу!');
  console.error('   Запустите сервер: npm run php:dev');
  console.error(`   Ошибка: ${error.message}`);
  process.exit(1);
});
