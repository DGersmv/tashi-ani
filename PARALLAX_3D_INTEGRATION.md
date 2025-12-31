# Интеграция 3D Parallax Lens Effect

## Что было изучено из папки `parallax-3d-lens-effect-website`

### Основные эффекты из оригинального проекта:

1. **3D Lens Effect** - эффект линзы, который реагирует на движение мыши
   - Слои вращаются по осям X и Y в зависимости от позиции курсора
   - Использует CSS переменные `--move-x` и `--move-y` для плавных переходов
   - Применяется `perspective` и `transform-style: preserve-3d`

2. **Parallax Layers** - несколько слоёв с разной глубиной (translateZ)
   - layer-1: translateZ(-55px) scale(1.06) - задний план
   - layer-2: translateZ(80px) scale(0.88)
   - layer-3: translateZ(180px) scale(0.8)
   - layer-5: translateZ(300px) scale(0.9)
   - layer-6: translateZ(380px) - передний план

3. **Rain Effect** - анимация дождя на canvas (опционально, не интегрировано)

4. **CSS Variables** - использование CSS переменных для плавных анимаций
   - `--move-x`, `--move-y` для углов поворота
   - `--transition` для timing function

## Что интегрировано в проект

### 1. Компонент `BackgroundSlideshow3D.tsx`
   - Базовый 3D lens effect
   - Реагирует на движение мыши
   - Сохраняет функциональность слайдшоу
   - Параметры:
     - `enable3D` - включить/выключить 3D эффект
     - `parallaxIntensity` - интенсивность эффекта (0-1)

### 2. Компонент `BackgroundSlideshow3DAdvanced.tsx`
   - Расширенная версия с поддержкой множественных слоёв
   - Параметр `enableLayers` - использовать несколько слоёв с разной глубиной
   - Более реалистичный parallax эффект

### 3. CSS стили в `globals.css`
   - Добавлены CSS переменные `--move-x`, `--move-y`
   - Стили для `.parallax-3d-container`, `.parallax-3d-wrapper`, `.parallax-layer`
   - Оптимизация производительности с `will-change` и `backface-visibility`

## Использование

### Текущая реализация (в `src/app/page.tsx`):
```tsx
<BackgroundSlideshow3D enable3D={true} parallaxIntensity={0.5} />
```

### Для более продвинутого эффекта с множественными слоями:
```tsx
<BackgroundSlideshow3DAdvanced 
  enable3D={true} 
  parallaxIntensity={0.5}
  enableLayers={true}
/>
```

## Настройка

- `parallaxIntensity={0.3}` - слабый эффект
- `parallaxIntensity={0.5}` - средний эффект (рекомендуется)
- `parallaxIntensity={0.8}` - сильный эффект
- `enable3D={false}` - отключить 3D эффект, использовать обычный слайдшоу

## Производительность

- Используется `will-change` для оптимизации GPU
- `backface-visibility: hidden` для предотвращения мерцания
- Плавные переходы через CSS переменные
- Эффект работает только на десктопе (реагирует на мышь)

## Дополнительные возможности (не интегрированы)

1. **Rain Effect** - можно добавить canvas-анимацию дождя из `rain.js`
2. **Дополнительные слои** - можно добавить больше слоёв для более глубокого parallax эффекта
3. **Touch поддержка** - можно добавить поддержку для мобильных устройств через touch события



