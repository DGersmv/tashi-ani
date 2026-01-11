# ✅ Добавление PostgreSQL в PATH (простой способ)

## 🎯 Проблема

Команда `psql` не найдена, потому что путь к PostgreSQL не добавлен в PATH.

**PostgreSQL установлен здесь:** `C:\Program Files\PostgreSQL\17\bin\`

---

## ✅ Решение 1: Добавить через GUI (рекомендуется - самый простой)

### Пошаговая инструкция:

1. **Нажмите `Win + X`** (или правой кнопкой на меню Пуск)
2. Выберите **"Система"** (System)
3. Справа нажмите **"Дополнительные параметры системы"** (Advanced system settings)
4. Вкладка **"Дополнительно"** (Advanced)
5. Нажмите кнопку **"Переменные среды"** (Environment Variables)
6. В разделе **"Переменные пользователя"** (User variables) найдите `Path`
7. Выберите `Path` → нажмите **"Изменить"** (Edit)
8. Нажмите **"Создать"** (New)
9. Введите путь: **`C:\Program Files\PostgreSQL\17\bin`**
10. Нажмите **"ОК"** во всех окнах
11. **Закройте PowerShell и откройте заново**

### После этого проверьте:

```powershell
psql --version
```

Должно показать: `psql (PostgreSQL) 17.0`

---

## ✅ Решение 2: Использовать полный путь (временно)

Если не хотите менять PATH, можно использовать полный путь к psql:

```powershell
# Проверка версии
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version

# Подключение к reg.ru
$env:PGPASSWORD="Gdv2210974!"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 79.174.89.232 -p 15555 -U admin -d postgres
```

---

## 🚀 После добавления PATH

**1. Проверить версию:**
```powershell
psql --version
```

**2. Подключиться к reg.ru:**
```powershell
$env:PGPASSWORD="Gdv2210974!"
psql -h 79.174.89.232 -p 15555 -U admin -d postgres
```

**3. Создать базу данных:**
```sql
CREATE DATABASE tashi_ani_prod;
```

---

## 📝 Что нужно добавить в PATH

**Путь:** `C:\Program Files\PostgreSQL\17\bin`

Это папка, где находится файл `psql.exe`.

---

**Рекомендация:** Используйте Решение 1 (через GUI) - это проще и работает постоянно!
