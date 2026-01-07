# 🔧 Исправление ошибки "Out of memory" при сборке

## Проблема
При выполнении `npm run build` процесс завершается с ошибкой:
```
Out of memory: Killed process 2332272 (node)
```

Это происходит потому, что серверу не хватает оперативной памяти для сборки Next.js.

## ✅ Решения

### Решение 1: Увеличить swap (виртуальную память) - РЕКОМЕНДУЕТСЯ

```bash
# Проверьте текущий swap
free -h

# Создайте файл подкачки (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Сделайте постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Проверьте
free -h
```

Теперь попробуйте снова:
```bash
npm run build
```

### Решение 2: Собрать локально и загрузить на сервер

**На вашем компьютере:**
```powershell
# Соберите проект
npm run build

# Создайте архив
tar -czf build.tar.gz .next node_modules/.cache
```

**Загрузите на сервер через веб-консоль или SCP:**
```bash
# В веб-консоли распакуйте
cd /var/www/tashi-ani
tar -xzf build.tar.gz
pm2 restart tashi-ani
```

### Решение 3: Уменьшить использование памяти при сборке

```bash
# Установите переменную окружения для ограничения памяти Node.js
export NODE_OPTIONS="--max-old-space-size=1024"

# Соберите проект
npm run build
```

### Решение 4: Собрать по частям (если ничего не помогает)

```bash
# Очистите кэш
rm -rf .next node_modules/.cache

# Соберите с ограничением памяти
NODE_OPTIONS="--max-old-space-size=1024" npm run build
```

## 🔍 Проверка памяти

```bash
# Проверьте доступную память
free -h

# Проверьте использование памяти процессами
ps aux --sort=-%mem | head -10
```

## 📝 Быстрое решение (увеличить swap)

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab && free -h
```

Затем:
```bash
npm run build
```

## ⚠️ Важно

- Swap медленнее RAM, но позволит собрать проект
- После сборки можно отключить swap (но лучше оставить)
- Если сборка всё равно не проходит, соберите локально

