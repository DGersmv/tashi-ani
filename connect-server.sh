#!/bin/bash
# Скрипт для подключения к серверу
# Использование: ./connect-server.sh

SERVER="root@89.104.67.209"
PASSWORD="RzOFp5upP4a6MyDi"

echo "🔌 Подключение к серверу $SERVER..."
echo ""

# Проверяем, установлен ли sshpass
if command -v sshpass &> /dev/null; then
    echo "Используем sshpass для автоматического подключения..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER
else
    echo "sshpass не установлен. Подключаемся вручную..."
    echo "Пароль: $PASSWORD"
    echo ""
    ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no $SERVER
fi

