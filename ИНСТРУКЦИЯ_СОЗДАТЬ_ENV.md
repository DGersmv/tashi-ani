# 📝 Как создать файл .env

## ⚠️ Проблема

Prisma не находит `DATABASE_URL`, потому что читает из файла `.env`, а не из `.env.local`!

## ✅ Решение

**Создать файл `.env` в корне проекта.**

---

## 🚀 Способ 1: Через блокнот (простой)

1. Откройте **Блокнот** (Notepad)
2. Скопируйте и вставьте эту строку:

```
DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/tashi_ani_prod?sslmode=require"
```

**⚠️ ВАЖНО:** 
- Замените `tashi_ani_prod` на имя **существующей БД** (если у вас нет прав создать новую)
- Или оставьте `tashi_ani_prod` если поддержка reg.ru создаст БД

3. Сохраните файл как `.env` (именно `.env`, не `.env.txt`!)
   - В блокноте: **Сохранить как** → Тип файла: **"Все файлы"**
   - Имя: `.env`
   - Папка: `e:\tashi-ani\`

---

## 🚀 Способ 2: Через PowerShell (быстрый)

**Выполните в PowerShell (в папке проекта):**

```powershell
# Вариант А: Если используете существующую БД
'DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/ИМЯ_СУЩЕСТВУЮЩЕЙ_БД?sslmode=require"' | Out-File -FilePath .env -Encoding utf8

# Вариант Б: Если будет создана БД tashi_ani_prod
'DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/tashi_ani_prod?sslmode=require"' | Out-File -FilePath .env -Encoding utf8
```

**Замените `ИМЯ_СУЩЕСТВУЮЩЕЙ_БД` на реальное имя БД!**

---

## 🚀 Способ 3: Через VS Code (если открыт проект)

1. В VS Code нажмите **Ctrl+N** (новый файл)
2. Вставьте строку:
   ```
   DATABASE_URL="postgresql://admin:Gdv2210974!@79.174.89.232:15555/tashi_ani_prod?sslmode=require"
   ```
3. Сохраните как `.env` (Ctrl+S, имя файла: `.env`)

---

## ⚠️ ВАЖНО про БД

**У вас нет прав создать БД на reg.ru!**

**Два варианта:**

### Вариант А: Использовать существующую БД (рекомендуется)

1. Посмотрите список БД на reg.ru:
   ```powershell
   $env:PGPASSWORD="Gdv2210974!"
   & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 79.174.89.232 -p 15555 -U admin -d postgres
   
   # В psql:
   \l  # Показать список баз
   \q  # Выйти
   ```

2. Выберите одну из существующих БД (кроме postgres, template0, template1)

3. В `.env` замените `tashi_ani_prod` на имя существующей БД

### Вариант Б: Обратиться в поддержку reg.ru

Попросите поддержку reg.ru создать новую БД `tashi_ani_prod` или выдать права на создание БД.

---

## ✅ После создания .env

**Выполните:**

```powershell
npx prisma generate
npx prisma migrate deploy
```

**Теперь должно работать!**

---

**⚠️ Помните:** 
- Пароль для reg.ru: `Gdv2210974!` (с восклицательным знаком!)
- Это НЕ пароль от локального PostgreSQL
- Не коммитьте `.env` в git!
