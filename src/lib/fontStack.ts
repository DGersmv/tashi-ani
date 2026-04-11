/**
 * Стек font-family для меню/заголовков/главной.
 * Вынесено в отдельный файл без Prisma — иначе клиентские компоненты тянут @prisma/client в браузер.
 */

const SYSTEM_SANS = 'Arial, Helvetica, sans-serif';

const CHINA_CYR_STACK = `'ChinaCyr', ${SYSTEM_SANS}`;

export function buildFontStack(selectedFont: string): string {
  const font = selectedFont?.trim() || 'ChinaCyr';

  if (font === 'ChinaCyr') {
    return CHINA_CYR_STACK;
  }

  if (
    font === 'var(--font-montserrat)' ||
    font === 'Montserrat' ||
    font === 'Montserrat Alternates'
  ) {
    return `var(--font-montserrat), ${SYSTEM_SANS}, ${CHINA_CYR_STACK}`;
  }

  return `${font}, ${SYSTEM_SANS}, ${CHINA_CYR_STACK}`;
}
