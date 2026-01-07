// Загружаем переменные окружения из .env.local
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Убираем кавычки если есть
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    });
  }
  return env;
}

// Загружаем .env.local
const envLocal = loadEnvFile(path.join(__dirname, '.env.local'));

module.exports = {
  apps: [{
    name: 'tashi-ani',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s', // Минимальное время работы перед перезапуском
    max_restarts: 10, // Максимум перезапусков за период
    restart_delay: 4000, // Задержка перед перезапуском (4 секунды)
    exp_backoff_restart_delay: 100, // Экспоненциальная задержка
    kill_timeout: 5000, // Время на корректное завершение
    listen_timeout: 10000, // Время ожидания запуска
    shutdown_with_message: true,
    wait_ready: true, // Ждать готовности приложения
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Загружаем переменные из .env.local
      ...envLocal
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    // Мониторинг здоровья приложения
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
}

