# 🔧 Исправление: psql не найден

## ❌ Проблема

При выполнении `psql --version` возникает ошибка:
```
psql : Имя "psql" не распознано...
```

Это означает, что либо PostgreSQL не установлен, либо путь к `psql.exe` не добавлен в переменную окружения PATH.

---

## ✅ Решения

### Решение 1: Добавить PostgreSQL в PATH (рекомендуется)

**Шаг 1: Найти путь к psql.exe**

Обычно PostgreSQL устанавливается в одну из этих папок:
- `C:\Program Files\PostgreSQL\17\bin\`
- `C:\Program Files\PostgreSQL\16\bin\`
- `C:\Program Files (x86)\PostgreSQL\17\bin\`

**Проверьте вручную:**
1. Откройте Проводник
2. Перейдите в `C:\Program Files\PostgreSQL\`
3. Найдите папку с номером версии (например, `17`)
4. Зайдите в папку `bin`
5. Убедитесь, что там есть файл `psql.exe`

**Или через PowerShell:**
```powershell
# Поиск psql.exe на диске C:
Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue
```

**Шаг 2: Добавить путь в PATH**

**Вариант А: Через PowerShell (временно для текущей сессии):**
```powershell
# Замените 17 на вашу версию PostgreSQL
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

# Проверить что работает
psql --version
```

**Вариант Б: Постоянно (рекомендуется):**

1. Нажмите `Win + R`
2. Введите `sysdm.cpl` и нажмите Enter
3. Перейдите на вкладку **"Дополнительно"**
4. Нажмите **"Переменные среды"**
5. В разделе **"Системные переменные"** найдите переменную `Path`
6. Выберите её и нажмите **"Изменить"**
7. Нажмите **"Создать"**
8. Введите путь (например): `C:\Program Files\PostgreSQL\17\bin`
9. Нажмите **"ОК"** во всех окнах
10. **Перезапустите PowerShell** (закройте и откройте заново)

**Или через PowerShell (постоянно):**
```powershell
# Замените 17 на вашу версию PostgreSQL
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\17\bin", [EnvironmentVariableTarget]::Machine)

# Нужны права администратора!
# Перезапустите PowerShell после выполнения
```

---

### Решение 2: Использовать полный путь к psql

Если не хотите менять PATH, можно использовать полный путь:

```powershell
# Замените 17 на вашу версию PostgreSQL
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version

# Подключение к reg.ru (полный путь):
$env:PGPASSWORD="Gdv2210974!"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 79.174.89.232 -p 15555 -U admin -d postgres
```

---

### Решение 3: Проверить установку PostgreSQL

**Если psql.exe не найден вообще:**

1. Проверьте, завершилась ли установка PostgreSQL
2. Если нет - завершите установку
3. Если да - возможно установка прошла в другое место

**Найти все установки PostgreSQL:**
```powershell
# Поиск всех psql.exe на диске C:
Get-ChildItem -Path "C:\" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object FullName
```

---

## 🚀 Быстрая проверка после исправления

После добавления PATH в PowerShell:

```powershell
# 1. Проверить версию
psql --version

# 2. Подключиться к reg.ru
$env:PGPASSWORD="Gdv2210974!"
psql -h 79.174.89.232 -p 15555 -U admin -d postgres

# Должно появиться приглашение: postgres=#
```

---

## 📝 Пошаговая инструкция (самый простой способ)

**1. Найти путь к psql:**
- Откройте Проводник
- Перейдите: `C:\Program Files\PostgreSQL\`
- Найдите папку с номером (например, `17`)
- Зайдите в `bin`
- Скопируйте полный путь (например: `C:\Program Files\PostgreSQL\17\bin`)

**2. Добавить в PATH временно (для проверки):**
```powershell
# В PowerShell (замените путь на ваш):
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
psql --version
```

**3. Если работает - добавить постоянно:**
- Нажмите `Win + X` → **"Система"**
- Справа нажмите **"Дополнительные параметры системы"**
- Вкладка **"Дополнительно"** → **"Переменные среды"**
- В **"Системные переменные"** выберите `Path` → **"Изменить"**
- **"Создать"** → вставьте путь → **"ОК"**
- Перезапустите PowerShell

---

## ✅ Готово!

После исправления `psql --version` должен работать, и вы сможете подключаться к reg.ru кластеру!
