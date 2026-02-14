# Contributing to Tashi Ani

Спасибо за ваш интерес к проекту! Это руководство поможет вам внести вклад в разработку.

## 📋 Оглавление

- [Начало работы](#начало-работы)
- [Процесс разработки](#процесс-разработки)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Тестирование](#тестирование)

## 🚀 Начало работы

### Требования

- Node.js 20+
- npm 9+
- Git

### Настройка локального окружения

1. Форкните репозиторий
2. Клонируйте ваш форк:
```bash
git clone https://github.com/YOUR_USERNAME/tashi-ani.git
cd tashi-ani
```

3. Установите зависимости:
```bash
npm install
```

4. Создайте `.env.local`:
```bash
cp .env.local.example .env.local
# Отредактируйте .env.local с вашими настройками
```

5. Инициализируйте базу данных:
```bash
npx prisma generate
npx prisma migrate dev
node create-admin-user.js
```

6. Запустите dev сервер:
```bash
npm run dev
```

## 🔄 Процесс разработки

### Создание ветки

Создавайте новую ветку для каждой фичи или исправления:

```bash
git checkout -b feature/your-feature-name
# или
git checkout -b fix/bug-description
```

Используйте префиксы:
- `feature/` - новые функции
- `fix/` - исправление багов
- `docs/` - изменения в документации
- `refactor/` - рефакторинг кода
- `test/` - добавление тестов
- `perf/` - улучшения производительности

### Разработка

1. Пишите чистый, читаемый код
2. Следуйте существующим паттернам в проекте
3. Добавляйте комментарии для сложной логики
4. Обновляйте документацию при необходимости

## 📝 Code Style

### TypeScript

- Используйте строгую типизацию (избегайте `any`)
- Предпочитайте `interface` для объектов
- Используйте `type` для unions и aliases
- Добавляйте JSDoc комментарии к публичным функциям

```typescript
/**
 * Получить пользователя по ID
 * @param userId - ID пользователя
 * @returns Promise с данными пользователя или null
 */
export async function getUserById(userId: number): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id: userId } })
}
```

### React Components

- Используйте функциональные компоненты
- Предпочитайте TypeScript для props
- Деструктурируйте props в параметрах функции

```typescript
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {children}
    </button>
  )
}
```

### Naming Conventions

- **Компоненты**: PascalCase (`UserProfile.tsx`)
- **Файлы утилит**: camelCase (`userManagement.ts`)
- **Константы**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **API routes**: kebab-case в URL (`/api/user-profile`)

### Форматирование

Проект использует:
- ESLint для линтинга
- Prettier (если настроен) для форматирования

Перед коммитом:
```bash
npm run lint
# Автофикс (если доступно):
npm run lint:fix
```

## 💾 Commit Guidelines

### Формат коммитов

Используйте ясные и описательные сообщения коммитов:

```
<type>: <subject>

<body> (optional)
```

**Types:**
- `feat`: Новая функция
- `fix`: Исправление бага
- `docs`: Изменения в документации
- `style`: Форматирование, отсутствующие точки с запятой и т.д.
- `refactor`: Рефакторинг кода
- `perf`: Улучшение производительности
- `test`: Добавление тестов
- `chore`: Обновление задач сборки, настроек и т.д.

**Примеры:**
```
feat: add 3D model rotation controls
fix: resolve photo upload issue for large files
docs: update API documentation for user endpoints
refactor: simplify authentication logic
```

### Что коммитить

✅ **Коммитить:**
- Исходный код
- Конфигурационные файлы
- Документацию
- Тесты

❌ **Не коммитить:**
- `node_modules/`
- `.env` файлы с секретами
- Личные IDE настройки (`.vscode/`, `.idea/`)
- Build артефакты (`/dist`, `/.next`)
- Загруженные пользователями файлы
- База данных файлы (`*.db`)

## 🔍 Pull Request Process

### Перед созданием PR

1. Убедитесь, что код собирается:
```bash
npm run build
```

2. Проверьте линтинг:
```bash
npm run lint
```

3. Запустите тесты (если есть):
```bash
npm test
```

4. Обновите свою ветку с main:
```bash
git fetch origin
git rebase origin/main
```

### Создание Pull Request

1. Отправьте вашу ветку в GitHub:
```bash
git push origin feature/your-feature-name
```

2. Создайте Pull Request на GitHub

3. Заполните PR template:
   - **Заголовок**: Краткое описание изменений
   - **Описание**: Что и почему изменено
   - **Скриншоты**: Для UI изменений
   - **Related Issues**: Ссылки на связанные issues

### PR Template пример:

```markdown
## Описание
Краткое описание изменений

## Тип изменений
- [ ] Новая функция
- [ ] Исправление бага
- [ ] Рефакторинг
- [ ] Документация

## Как протестировать
1. Шаг 1
2. Шаг 2
3. ...

## Чеклист
- [ ] Код следует стилю проекта
- [ ] Добавлены/обновлены тесты
- [ ] Обновлена документация
- [ ] Нет breaking changes (или документированы)
```

### Review Process

1. Maintainer проверит ваш PR
2. Внесите запрошенные изменения
3. После approve, PR будет смержен

## 🧪 Тестирование

### Структура тестов (планируется)

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── lib/
│   ├── userManagement.ts
│   └── userManagement.test.ts
```

### Написание тестов

```typescript
// Example test (when test infrastructure is added)
import { getUserById } from './userManagement'

describe('getUserById', () => {
  it('should return user when exists', async () => {
    const user = await getUserById(1)
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')
  })

  it('should return null when user does not exist', async () => {
    const user = await getUserById(999999)
    expect(user).toBeNull()
  })
})
```

## 🐛 Reporting Bugs

### Перед созданием issue

1. Проверьте существующие issues
2. Убедитесь, что используете последнюю версию
3. Попробуйте воспроизвести на чистой установке

### Шаблон Bug Report

```markdown
**Описание бага**
Краткое и ясное описание

**Как воспроизвести**
1. Перейти на '...'
2. Кликнуть на '...'
3. Увидеть ошибку

**Ожидаемое поведение**
Что должно было произойти

**Скриншоты**
Если применимо

**Окружение:**
- OS: [например, Ubuntu 22.04]
- Browser: [например, Chrome 120]
- Node version: [например, 20.10.0]

**Дополнительный контекст**
Любая другая информация
```

## 💡 Feature Requests

### Предложение новой функции

```markdown
**Проблема, которую решает**
Описание проблемы или недостающей функциональности

**Предлагаемое решение**
Как вы видите реализацию

**Альтернативы**
Рассматривали ли вы другие варианты?

**Дополнительный контекст**
Диаграммы, mockups, примеры из других проектов
```

## 📚 Дополнительные ресурсы

- [README.md](./README.md) - Основная документация
- [RECOMMENDATIONS.md](./RECOMMENDATIONS.md) - Рекомендации по улучшению
- [SECURITY_FIX.md](./SECURITY_FIX.md) - Безопасность

## 🤝 Code of Conduct

- Будьте уважительны к другим участникам
- Конструктивная критика приветствуется
- Помогайте новичкам
- Соблюдайте профессиональную этику

## ❓ Вопросы?

Если у вас есть вопросы, не стесняйтесь:
- Создать issue с меткой "question"
- Связаться с maintainers

---

Спасибо за ваш вклад в проект Tashi Ani! 🎉
