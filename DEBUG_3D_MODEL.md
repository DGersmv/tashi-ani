# 🔍 Диагностика проблемы с загрузкой 3D моделей

## Шаг 1: Проверка в браузере

Откройте консоль браузера (F12) и проверьте:

1. **Ошибки в консоли:**
   - Откройте вкладку Console
   - Попробуйте открыть модель
   - Посмотрите какие ошибки появляются

2. **Сетевые запросы:**
   - Откройте вкладку Network
   - Попробуйте открыть модель
   - Найдите запрос к `/api/user/objects/[id]/models/[modelId]/view`
   - Проверьте статус ответа (должен быть 200)
   - Если 404 - файл не найден
   - Если 500 - ошибка на сервере

## Шаг 2: Проверка на сервере

Выполните на сервере:

```bash
cd /var/www/tashi-ani

# 1. Проверьте логи PM2 на ошибки
pm2 logs tashi-ani --err --lines 50 --nostream | grep -i "model\|bim\|ifc\|gltf"

# 2. Проверьте что модель есть в БД
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const models = await prisma.bimModel.findMany({
    select: {
      id: true,
      name: true,
      viewableFilename: true,
      viewableFilePath: true,
      viewableFormat: true,
      objectId: true
    }
  });
  console.log('Модели в БД:');
  console.log(JSON.stringify(models, null, 2));
  await prisma.\$disconnect();
})();
"

# 3. Проверьте что файлы существуют на диске
# Замените [objectId] и [modelId] на реальные значения
ls -la /var/www/tashi-ani/public/uploads/objects/[objectId]/models/[modelId]/

# 4. Проверьте права доступа к файлам
find /var/www/tashi-ani/public/uploads/objects -name "*.ifc" -o -name "*.gltf" -o -name "*.glb" | head -10
```

## Шаг 3: Типичные проблемы

### Проблема 1: Файл для просмотра не загружен
**Симптомы:** Ошибка "Файл для просмотра не загружен"
**Решение:** 
- Убедитесь что при загрузке модели был выбран файл для просмотра (IFC или GLTF)
- Проверьте что `viewableFilePath` и `viewableFilename` заполнены в БД

### Проблема 2: Файл не найден на сервере
**Симптомы:** Ошибка 404 "Файл не найден на сервере"
**Решение:**
- Проверьте что файл существует по пути из `viewableFilePath`
- Проверьте права доступа к файлу
- Убедитесь что путь правильный (начинается с `/uploads/...`)

### Проблема 3: CORS ошибки
**Симптомы:** Ошибка CORS в консоли браузера
**Решение:**
- Проверьте что API route возвращает правильные заголовки
- Убедитесь что `Access-Control-Allow-Origin` установлен

### Проблема 4: Ошибка загрузки IFC
**Симптомы:** Модель не загружается, ошибки в консоли про web-ifc
**Решение:**
- Проверьте что WASM файлы доступны: `/wasm/web-ifc.wasm` и `/wasm/web-ifc-mt.wasm`
- Проверьте консоль браузера на ошибки загрузки WASM

### Проблема 5: Ошибка загрузки GLTF
**Симптомы:** GLTF модель не отображается
**Решение:**
- Проверьте что model-viewer библиотека загружается
- Проверьте что файл GLTF/GLB валидный
- Проверьте консоль браузера на ошибки

## Шаг 4: Проверка API route

Проверьте что API route работает:

```bash
# Замените [objectId], [modelId] и [email] на реальные значения
curl -I "http://127.0.0.1:3000/api/user/objects/[objectId]/models/[modelId]/view?email=[email]"

# Должен вернуть HTTP 200
# Если 404 - проверьте что модель существует и файл загружен
# Если 500 - проверьте логи PM2
```

## Шаг 5: Проверка компонента

Проверьте что компонент правильно определяет формат:

```javascript
// В консоли браузера проверьте:
// 1. Что модель имеет viewableFormat
console.log(model.viewableFormat); // Должно быть 'IFC' или 'GLTF'

// 2. Что модель имеет viewableFilePath
console.log(model.viewableFilePath); // Должен быть путь типа '/uploads/objects/1/models/1/viewable.ifc'

// 3. Что URL формируется правильно
const url = `/api/user/objects/${objectId}/models/${model.id}/view?email=${userEmail}`;
console.log(url);
```

## Что проверить в первую очередь

1. **Консоль браузера** - какие ошибки?
2. **Network tab** - какой статус у запроса к `/api/user/objects/[id]/models/[modelId]/view`?
3. **Логи PM2** - есть ли ошибки на сервере?
4. **Файл существует?** - проверьте что файл есть на диске по пути из БД

Пришлите результаты этих проверок для точной диагностики.

