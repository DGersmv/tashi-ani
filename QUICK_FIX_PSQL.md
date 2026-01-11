# ⚡ Быстрое исправление: psql не найден

## ✅ Решение (выполните в PowerShell)

**PostgreSQL установлен, но путь не добавлен в PATH.**

### Вариант 1: Временно (для текущей сессии PowerShell)

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
psql --version
```

### Вариант 2: Постоянно (рекомендуется)

**Через GUI (самый простой способ):**

1. Нажмите `Win + X` → выберите **"Система"**
2. Справа нажмите **"Дополнительные параметры системы"**
3. Вкладка **"Дополнительно"** → кнопка **"Переменные среды"**
4. В разделе **"Переменные пользователя"** найдите `Path`
5. Выберите `Path` → нажмите **"Изменить"**
6. Нажмите **"Создать"**
7. Введите: `C:\Program Files\PostgreSQL\17\bin`
8. Нажмите **"ОК"** во всех окнах
9. **Закройте и откройте PowerShell заново**

**Или через PowerShell (нужны права администратора):**
```powershell
# Добавить в PATH пользователя (не требует прав администратора)
[Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\Program Files\PostgreSQL\17\bin', [EnvironmentVariableTarget]::User)

# Закройте и откройте PowerShell заново
```

---

## 🚀 После исправления

**1. Проверить версию:**
```powershell
psql --version
# Должно показать: psql (PostgreSQL) 17.0
```

**2. Подключиться к reg.ru:**
```powershell
$env:PGPASSWORD="Gdv2210974!"
psql -h 79.174.89.232 -p 15555 -U admin -d postgres
```

---

**Путь к psql найден:** `C:\Program Files\PostgreSQL\17\bin\psql.exe`
