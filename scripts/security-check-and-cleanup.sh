#!/bin/bash

# Скрипт для проверки безопасности и очистки сервера от вирусов/майнеров
# Использование: ./security-check-and-cleanup.sh

echo "🔍 Начинаем проверку безопасности сервера..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода предупреждений
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для вывода ошибок
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для вывода успеха
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Проверка подозрительных процессов
echo "1️⃣  Проверка подозрительных процессов..."
SUSPICIOUS_PROCESSES=$(ps aux | grep -E "(miner|boatnet|yamaha|broncano|xmrig|cpuminer|stratum)" | grep -v grep)
if [ -n "$SUSPICIOUS_PROCESSES" ]; then
    error "Найдены подозрительные процессы:"
    echo "$SUSPICIOUS_PROCESSES"
    echo ""
    read -p "Остановить эти процессы? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f miner
        pkill -f boatnet
        pkill -f yamaha
        pkill -f broncano
        pkill -f xmrig
        pkill -f cpuminer
        pkill -f stratum
        success "Подозрительные процессы остановлены"
    fi
else
    success "Подозрительные процессы не найдены"
fi
echo ""

# 2. Проверка подозрительных файлов
echo "2️⃣  Поиск подозрительных файлов..."
SUSPICIOUS_FILES=$(find / -name "*boatnet*" -o -name "*yamaha*" -o -name "*broncano*" -o -name "*.x86_64" -type f 2>/dev/null | head -20)
if [ -n "$SUSPICIOUS_FILES" ]; then
    error "Найдены подозрительные файлы:"
    echo "$SUSPICIOUS_FILES"
    echo ""
    read -p "Удалить эти файлы? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$SUSPICIOUS_FILES" | xargs rm -f 2>/dev/null
        success "Подозрительные файлы удалены"
    fi
else
    success "Подозрительные файлы не найдены"
fi
echo ""

# 3. Проверка cron задач
echo "3️⃣  Проверка cron задач..."
CRON_JOBS=$(crontab -l 2>/dev/null)
if [ -n "$CRON_JOBS" ]; then
    SUSPICIOUS_CRON=$(echo "$CRON_JOBS" | grep -E "(curl|wget|\.sh|miner|boatnet|yamaha|broncano)")
    if [ -n "$SUSPICIOUS_CRON" ]; then
        error "Найдены подозрительные cron задачи:"
        echo "$SUSPICIOUS_CRON"
        echo ""
        read -p "Удалить подозрительные cron задачи? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            crontab -l | grep -vE "(curl|wget|\.sh|miner|boatnet|yamaha|broncano)" | crontab -
            success "Подозрительные cron задачи удалены"
        fi
    else
        success "Подозрительные cron задачи не найдены"
    fi
else
    success "Cron задачи не настроены"
fi
echo ""

# 4. Проверка системных cron задач
echo "4️⃣  Проверка системных cron задач..."
if [ -f /etc/crontab ]; then
    SUSPICIOUS_SYS_CRON=$(cat /etc/crontab | grep -E "(curl|wget|\.sh|miner|boatnet|yamaha|broncano)")
    if [ -n "$SUSPICIOUS_SYS_CRON" ]; then
        error "Найдены подозрительные системные cron задачи:"
        echo "$SUSPICIOUS_SYS_CRON"
        warn "Требуется ручное удаление из /etc/crontab"
    else
        success "Подозрительные системные cron задачи не найдены"
    fi
fi
echo ""

# 5. Проверка сетевых соединений
echo "5️⃣  Проверка сетевых соединений..."
SUSPICIOUS_CONNECTIONS=$(netstat -tulpn 2>/dev/null | grep -E "(50\.6\.248\.160|suspicious_ip)" || ss -tulpn 2>/dev/null | grep -E "(50\.6\.248\.160|suspicious_ip)")
if [ -n "$SUSPICIOUS_CONNECTIONS" ]; then
    error "Найдены подозрительные сетевые соединения:"
    echo "$SUSPICIOUS_CONNECTIONS"
    warn "Рекомендуется заблокировать эти IP через iptables или ufw"
else
    success "Подозрительные сетевые соединения не найдены"
fi
echo ""

# 6. Проверка использования ресурсов
echo "6️⃣  Проверка использования ресурсов..."
HIGH_CPU=$(ps aux | sort -k3 -rn | head -5)
echo "Топ процессов по использованию CPU:"
echo "$HIGH_CPU"
echo ""

HIGH_MEM=$(ps aux | sort -k4 -rn | head -5)
echo "Топ процессов по использованию памяти:"
echo "$HIGH_MEM"
echo ""

# 7. Проверка автозагрузки
echo "7️⃣  Проверка автозагрузки..."
if [ -f ~/.bashrc ]; then
    SUSPICIOUS_BASHRC=$(cat ~/.bashrc | grep -E "(curl|wget|\.sh|miner|boatnet|yamaha|broncano)")
    if [ -n "$SUSPICIOUS_BASHRC" ]; then
        error "Найдены подозрительные команды в ~/.bashrc:"
        echo "$SUSPICIOUS_BASHRC"
        warn "Требуется ручная проверка ~/.bashrc"
    fi
fi

if [ -f ~/.bash_profile ]; then
    SUSPICIOUS_BASH_PROFILE=$(cat ~/.bash_profile | grep -E "(curl|wget|\.sh|miner|boatnet|yamaha|broncano)")
    if [ -n "$SUSPICIOUS_BASH_PROFILE" ]; then
        error "Найдены подозрительные команды в ~/.bash_profile:"
        echo "$SUSPICIOUS_BASH_PROFILE"
        warn "Требуется ручная проверка ~/.bash_profile"
    fi
fi
echo ""

# 8. Проверка systemd сервисов
echo "8️⃣  Проверка systemd сервисов..."
SUSPICIOUS_SERVICES=$(systemctl list-units --type=service --all | grep -E "(miner|boatnet|yamaha|broncano)" || true)
if [ -n "$SUSPICIOUS_SERVICES" ]; then
    error "Найдены подозрительные сервисы:"
    echo "$SUSPICIOUS_SERVICES"
    warn "Рекомендуется остановить и отключить эти сервисы"
else
    success "Подозрительные сервисы не найдены"
fi
echo ""

# 9. Проверка файлов проекта
echo "9️⃣  Проверка файлов проекта..."
if [ -d "/var/www/tashi-ani" ]; then
    PROJECT_SUSPICIOUS=$(find /var/www/tashi-ani -name "*.sh" -o -name "*.exe" -o -name "*.bin" -o -name "*miner*" 2>/dev/null)
    if [ -n "$PROJECT_SUSPICIOUS" ]; then
        error "Найдены подозрительные файлы в проекте:"
        echo "$PROJECT_SUSPICIOUS"
        warn "Рекомендуется удалить эти файлы"
    else
        success "Подозрительные файлы в проекте не найдены"
    fi
else
    warn "Директория проекта не найдена"
fi
echo ""

# 10. Рекомендации
echo "🔒 Рекомендации по безопасности:"
echo ""
echo "1. Установите fail2ban:"
echo "   apt install fail2ban -y"
echo ""
echo "2. Настройте firewall (ufw):"
echo "   apt install ufw -y"
echo "   ufw default deny incoming"
echo "   ufw default allow outgoing"
echo "   ufw allow ssh"
echo "   ufw allow 80/tcp"
echo "   ufw allow 443/tcp"
echo "   ufw enable"
echo ""
echo "3. Обновите систему:"
echo "   apt update && apt upgrade -y"
echo ""
echo "4. Регулярно проверяйте логи:"
echo "   pm2 logs tashi-ani"
echo "   tail -f /var/log/nginx/error.log"
echo ""
echo "5. Настройте автоматические бэкапы"
echo ""

echo "✅ Проверка безопасности завершена!"
echo ""
echo "⚠️  ВАЖНО: Если были найдены вирусы, рекомендуется:"
echo "   1. Полностью переустановить проект (см. FULL_SERVER_REINSTALL.md)"
echo "   2. Сменить все пароли"
echo "   3. Проверить все файлы проекта на наличие вирусов"
echo "   4. Настроить мониторинг и автоматические бэкапы"





