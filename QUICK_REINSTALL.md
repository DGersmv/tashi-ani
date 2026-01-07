# 🚨 БЫСТРАЯ ПЕРЕУСТАНОВКА СЕРВЕРА

## ⚡ Краткая инструкция (для опытных)

### На вашем компьютере:

1. **Создайте чистый архив:**
   ```powershell
   .\scripts\clean-server.ps1
   ```

2. **Или вручную через Git:**
   ```powershell
   git archive --format=zip --output=tashi-ani-clean.zip HEAD
   ```

### На сервере reg.ru:

1. **Подключитесь к серверу** (через веб-консоль reg.ru или SSH)

2. **Остановите все процессы:**
   ```bash
   pm2 stop all
   pm2 delete all
   pkill -f node
   ```

3. **Проверьте на вирусы:**
   ```bash
   chmod +x scripts/security-check-and-cleanup.sh
   ./scripts/security-check-and-cleanup.sh
   ```

4. **Удалите старый проект:**
   ```bash
   rm -rf /var/www/tashi-ani
   ```

5. **Создайте новую директорию:**
   ```bash
   mkdir -p /var/www/tashi-ani
   cd /var/www/tashi-ani
   ```

6. **Загрузите и распакуйте архив:**
   ```bash
   # Загрузите tashi-ani-clean.zip через файловый менеджер или SCP
   unzip tashi-ani-clean.zip
   ```

7. **Установите зависимости:**
   ```bash
   npm install --production
   npx prisma generate
   ```

8. **Создайте .env.local:**
   ```bash
   nano .env.local
   ```
   Вставьте:
   ```env
   DATABASE_URL="file:./prisma/prod.db"
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   MASTER_ADMIN_EMAIL="2277277@bk.ru"
   MASTER_ADMIN_PASSWORD="admin123"
   EMAIL_USER="your-email@example.com"
   EMAIL_PASS="your-password"
   NEXTAUTH_URL="https://tashi-ani.ru"
   ```

9. **Примените миграции:**
   ```bash
   npx prisma migrate deploy
   # или
   npx prisma db push
   ```

10. **Создайте директории:**
    ```bash
    mkdir -p public/uploads/objects public/uploads/projects logs
    chmod 755 public/uploads public/uploads/objects public/uploads/projects
    ```

11. **Соберите проект:**
    ```bash
    npm run build
    ```

12. **Запустите через PM2:**
    ```bash
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

13. **Проверьте работу:**
    ```bash
    pm2 status
    pm2 logs tashi-ani
    ```

---

## 📖 Подробная инструкция

См. файл **FULL_SERVER_REINSTALL.md** для полной пошаговой инструкции.

---

## 🔒 Важно!

- ✅ Используйте ТОЛЬКО чистый архив с вашего компьютера
- ✅ НЕ копируйте файлы со старого сервера (там могут быть вирусы)
- ✅ Смените все пароли после установки
- ✅ Настройте автоматические бэкапы
- ✅ Установите fail2ban и ufw для защиты




