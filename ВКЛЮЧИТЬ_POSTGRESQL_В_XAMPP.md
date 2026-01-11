# 🔧 Включение PostgreSQL в XAMPP

## Проблема
Расширения `pdo_pgsql` и `pgsql` не загружены в PHP из XAMPP.

## Решение

### Шаг 1: Проверить наличие DLL файлов

Откройте папку: `C:\xampp\php\ext\`

Проверьте наличие файлов:
- `php_pdo_pgsql.dll`
- `php_pgsql.dll`

Если файлов нет, их нужно скачать для вашей версии PHP.

### Шаг 2: Открыть php.ini

Откройте файл: `C:\xampp\php\php.ini`

Найдите строки (обычно около строки 900-1000):
```ini
;extension=pdo_pgsql
;extension=pgsql
```

### Шаг 3: Раскомментировать

Уберите точку с запятой в начале:
```ini
extension=pdo_pgsql
extension=pgsql
```

### Шаг 4: Сохранить и перезапустить

1. Сохраните `php.ini`
2. Перезапустите PHP сервер (если запущен)

### Шаг 5: Проверить

```powershell
C:\xampp\php\php.exe -r "echo extension_loaded('pdo_pgsql') ? 'OK' : 'NOT LOADED';"
```

Должно вывести: `OK`

---

## Альтернатива: Скачать DLL файлы

Если файлов нет в `ext\`:

1. Определите версию PHP: `C:\xampp\php\php.exe -v`
2. Скачайте соответствующие DLL:
   - Для PHP 8.2: https://windows.php.net/downloads/releases/
   - Или используйте PECL: https://pecl.php.net/package/pdo_pgsql

3. Поместите DLL в `C:\xampp\php\ext\`
4. Раскомментируйте в `php.ini` как указано выше

---

## ⚠️ Важно

После изменений в `php.ini` нужно перезапустить PHP сервер!
