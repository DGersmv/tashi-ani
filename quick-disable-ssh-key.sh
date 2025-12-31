#!/bin/bash
# Скрипт для быстрого отключения входа по SSH ключу
# Выполните в веб-консоли: bash quick-disable-ssh-key.sh

echo "=== Отключение входа по SSH ключу ==="
echo ""

# Шаг 1: Переименовать authorized_keys
echo "Шаг 1: Отключаем authorized_keys..."
if [ -f ~/.ssh/authorized_keys ]; then
    mv ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup
    echo "✅ authorized_keys переименован в authorized_keys.backup"
else
    echo "ℹ️  authorized_keys не найден (это нормально)"
fi

# Шаг 2: Настроить SSH для приема паролей
echo ""
echo "Шаг 2: Настраиваем SSH для приема паролей..."

# Создаем backup конфигурации
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# Включаем PasswordAuthentication
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Отключаем PubkeyAuthentication
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PubkeyAuthentication yes/PubkeyAuthentication no/' /etc/ssh/sshd_config

echo "✅ SSH конфигурация обновлена"

# Шаг 3: Перезапустить SSH
echo ""
echo "Шаг 3: Перезапускаем SSH сервер..."
if systemctl restart sshd 2>/dev/null; then
    echo "✅ SSH сервер перезапущен (systemctl)"
elif service ssh restart 2>/dev/null; then
    echo "✅ SSH сервер перезапущен (service)"
else
    echo "⚠️  Не удалось перезапустить SSH автоматически"
    echo "   Выполните вручную: systemctl restart sshd"
fi

echo ""
echo "=== Готово! ==="
echo ""
echo "Теперь можно подключиться по паролю:"
echo "ssh root@89.104.67.209"
echo ""
echo "Если пароль не установлен, выполните:"
echo "passwd root"
echo ""

