# Запуск команд на Windows (PowerShell)

В PowerShell используйте **точку с запятой** вместо `&&`:

```powershell
# Так НЕ сработает в старом PowerShell:
cd e:\tashi-ani && npm install

# Так сработает:
cd e:\tashi-ani; npm install
```

Или две отдельные команды:
```powershell
cd e:\tashi-ani
npm install
```

В **CMD** или **PowerShell 7+** оператор `&&` уже поддерживается.
