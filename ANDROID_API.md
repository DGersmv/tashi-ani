# Документация API для Android-приложения

## Базовый URL API

- **Production:** `https://tashi-ani.ru`
- **IP:** `89.104.67.209`
- Все API endpoints начинаются с `/api/`

## Deep Links

### Для админа (загрузка фото)

**Схема:** `tashi-ani://upload`

**Параметры:**
- `userId` (required, number) - ID заказчика
- `objectId` (required, number) - ID объекта заказчика

**Пример:**
```
tashi-ani://upload?userId=3&objectId=1
```

**Описание:**
Открывает экран загрузки фото в Android-приложении для указанного объекта заказчика. Фото будут загружены в альбом "Все фото" объекта.

### Для заказчика (просмотр фото)

**Схема:** `tashi-ani://view`

**Параметры:**
- `email` (required, string) - Email заказчика
- `objectId` (required, number) - ID объекта

**Пример:**
```
tashi-ani://view?email=user%40example.com&objectId=1
```

**Описание:**
Открывает экран просмотра фото в Android-приложении. Показываются только фото, доступные заказчику (`isVisibleToCustomer = true`).

## Аутентификация

### Для админа

- Использовать JWT токен админа в заголовке `Authorization: Bearer {token}`
- Токен получается при входе админа в приложение через `/api/auth/login`
- Endpoint: `POST /api/auth/login`
- Body: `{ "email": "admin@example.com", "password": "password" }`
- Ответ содержит `token` в поле `token`

### Для заказчика

- Использовать email заказчика как параметр в запросах
- Email передается в query параметре `email` для всех endpoints заказчика

## API Endpoints

### Админ: Загрузка фото

**Endpoint:** `POST https://tashi-ani.ru/api/admin/objects/{objectId}/photos`

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Body:** `multipart/form-data`
- `file` (File, обязательно) - файл для загрузки
- `isVisibleToCustomer` (boolean, опционально, по умолчанию `false`) - видимость фото для заказчика

**Поддерживаемые форматы:**
- Изображения: JPEG, PNG, GIF, WebP
- Видео: MP4, AVI, MOV

**Максимальный размер файла:** 50MB

**Успешный ответ (200):**
```json
{
  "success": true,
  "photo": {
    "id": 123,
    "filename": "1234567890-abc123.jpg",
    "originalName": "photo.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "isVisibleToCustomer": false,
    "uploadedAt": "2025-01-20T12:00:00.000Z",
    "url": "/uploads/objects/1/1234567890-abc123.jpg"
  }
}
```

**Ошибки:**
- `401` - Не авторизован (неверный или отсутствующий токен)
- `403` - Доступ запрещен (недостаточно прав)
- `400` - Неверные параметры (файл не найден, неподдерживаемый тип, файл слишком большой)
- `500` - Внутренняя ошибка сервера

**Примечание:** Фото загружаются в альбом "Все фото" (без привязки к папке, `folderId = null`).

### Заказчик: Получение списка объектов

**Endpoint:** `GET https://tashi-ani.ru/api/user/objects?email={email}`

**Query параметры:**
- `email` (required) - Email заказчика

**Успешный ответ (200):**
```json
{
  "success": true,
  "objects": [
    {
      "id": 1,
      "title": "Участок на ул. Ленина",
      "description": "Описание объекта",
      "address": "ул. Ленина, 10",
      "status": "ACTIVE",
      "createdAt": "2025-01-20T12:00:00.000Z",
      "unreadMessagesCount": 2,
      "unreadCommentsCount": 5,
      "totalMessagesCount": 10,
      "totalCommentsCount": 15
    }
  ]
}
```

### Заказчик: Получение информации об объекте

**Endpoint:** `GET https://tashi-ani.ru/api/user/objects/{objectId}?email={email}`

**Query параметры:**
- `email` (required) - Email заказчика

**Успешный ответ (200):**
```json
{
  "success": true,
  "object": {
    "id": 1,
    "title": "Участок на ул. Ленина",
    "description": "Описание объекта",
    "address": "ул. Ленина, 10",
    "status": "ACTIVE",
    "photos": [
      {
        "id": 123,
        "filename": "photo.jpg",
        "originalName": "photo.jpg",
        "uploadedAt": "2025-01-20T12:00:00.000Z",
        "folder": {
          "id": 1,
          "name": "Дом"
        }
      }
    ],
    "documents": [...],
    "messages": [...],
    "projects": [...]
  }
}
```

### Заказчик: Получение списка фото объекта

**Endpoint:** `GET https://tashi-ani.ru/api/user/objects/{objectId}/photos?email={email}`

**Query параметры:**
- `email` (required) - Email заказчика

**Успешный ответ (200):**
```json
{
  "success": true,
  "photos": [
    {
      "id": 123,
      "filename": "photo.jpg",
      "originalName": "photo.jpg",
      "uploadedAt": "2025-01-20T12:00:00.000Z",
      "folder": {
        "id": 1,
        "name": "Дом"
      },
      "comments": [
        {
          "id": 1,
          "content": "Комментарий к фото",
          "createdAt": "2025-01-20T12:00:00.000Z",
          "user": {
            "name": "Админ",
            "email": "admin@example.com"
          }
        }
      ]
    }
  ]
}
```

**Примечание:** Возвращаются только фото, видимые для заказчика (`isVisibleToCustomer = true`).

### Заказчик: Получение файла фото

**Endpoint:** `GET https://tashi-ani.ru/api/uploads/objects/{objectId}/{filename}?email={email}`

**Query параметры:**
- `email` (required) - Email заказчика

**Ответ:** Бинарный файл (изображение или видео)

**Ошибки:**
- `400` - Email не предоставлен
- `404` - Фото не найдено или нет доступа
- `500` - Внутренняя ошибка сервера

## Примеры использования

### Загрузка фото (админ)

```kotlin
// Пример на Kotlin
val url = "https://tashi-ani.ru/api/admin/objects/$objectId/photos"
val request = MultipartBody.Builder()
    .setType(MultipartBody.FORM)
    .addFormDataPart("file", "photo.jpg", 
        RequestBody.create(MediaType.parse("image/jpeg"), file))
    .addFormDataPart("isVisibleToCustomer", "false")
    .build()

val httpRequest = Request.Builder()
    .url(url)
    .addHeader("Authorization", "Bearer $adminToken")
    .post(request)
    .build()

val response = client.newCall(httpRequest).execute()
```

### Получение списка фото (заказчик)

```kotlin
// Пример на Kotlin
val url = "https://tashi-ani.ru/api/user/objects/$objectId/photos?email=${URLEncoder.encode(email, "UTF-8")}"
val request = Request.Builder()
    .url(url)
    .get()
    .build()

val response = client.newCall(request).execute()
val json = response.body()?.string()
```

## Обработка ошибок

Все API endpoints возвращают JSON с полем `success`:

**Успех:**
```json
{
  "success": true,
  ...
}
```

**Ошибка:**
```json
{
  "success": false,
  "message": "Описание ошибки"
}
```

**HTTP статус коды:**
- `200` - Успешный запрос
- `400` - Неверные параметры запроса
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Логика работы

### Админ: Загрузка фото

1. Админ на сайте выбирает заказчика и объект
2. Нажимает "Загрузить с телефона" в панели "Все фото"
3. Сайт открывает deep link: `tashi-ani://upload?userId={userId}&objectId={objectId}`
4. Android-приложение получает deep link и извлекает параметры
5. Приложение показывает экран загрузки фото с информацией о заказчике и объекте
6. При загрузке фото приложение отправляет POST запрос на `/api/admin/objects/{objectId}/photos`
7. Фото сохраняется в альбом "Все фото" (folderId = null)

### Заказчик: Просмотр фото

1. Заказчик на сайте выбирает объект
2. Нажимает "Открыть в приложении" в панели фото
3. Сайт открывает deep link: `tashi-ani://view?email={email}&objectId={objectId}`
4. Android-приложение получает deep link и извлекает параметры
5. Приложение загружает список фото через `/api/user/objects/{objectId}/photos?email={email}`
6. Приложение отображает фото, доступные для заказчика
7. При просмотре фото приложение загружает файл через `/api/uploads/objects/{objectId}/{filename}?email={email}`

## Дополнительные замечания

1. **Валидация email:** Убедитесь, что email правильно кодируется в URL (используйте `URLEncoder.encode()`)

2. **Обработка ошибок сети:** Реализуйте retry логику для сетевых запросов

3. **Кэширование:** Рассмотрите возможность кэширования списка фото для офлайн-доступа

4. **Прогресс загрузки:** Для больших файлов показывайте прогресс загрузки

5. **Обработка deep links:** Убедитесь, что приложение правильно обрабатывает deep links, даже если оно было закрыто

