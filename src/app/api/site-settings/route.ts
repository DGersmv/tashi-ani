export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/userManagement';

export type CustomFontItem = { fontFamily: string; url: string };

export type SiteSettingsPayload = {
  menuFont?: string;
  headingFont?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  contactTelegram?: string;
  contactEmail?: string;
  mapCenterLon?: number;
  mapCenterLat?: number;
  mapLogoPath?: string;
  siteLogoPath?: string;
  customFonts?: CustomFontItem[];
  /** Шрифт заголовка на главной */
  mainPageHeadingFont?: string;
  /** Шрифт основного текста на главной */
  mainPageTextFont?: string;
  /** Макс. ширина блока текста на главной (px), строки переносятся в пределах этой ширины */
  mainPageTextMaxWidth?: number;
};

const DEFAULTS: SiteSettingsPayload = {
  menuFont: 'ChinaCyr',
  headingFont: 'ChinaCyr',
  contactPhone: '+7 921 952-61-17',
  contactWhatsApp: 'https://wa.me/79219526117',
  contactTelegram: 'https://t.me/tashiani',
  contactEmail: 'info@tashi-ani.ru',
  mapCenterLon: 30.36,
  mapCenterLat: 59.94,
  mapLogoPath: '/points/default.png',
  siteLogoPath: '/logo_new.png',
  customFonts: [],
  mainPageHeadingFont: 'ChinaCyr',
  mainPageTextFont: 'ChinaCyr',
  mainPageTextMaxWidth: 720,
};

function ensureAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false as const, status: 401, message: 'Токен не предоставлен' };
  }
  const decoded = verifyToken(authHeader.slice(7));
  if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'MASTER')) {
    return { ok: false as const, status: 403, message: 'Недостаточно прав' };
  }
  return { ok: true as const };
}

export async function GET() {
  try {
    const row = await prisma.siteSettings.findFirst({ orderBy: { id: 'asc' } });
    const json = row?.json;
    const settings: SiteSettingsPayload = json
      ? { ...DEFAULTS, ...JSON.parse(json) }
      : { ...DEFAULTS };
    return NextResponse.json(settings);
  } catch (e) {
    console.error('site-settings GET', e);
    return NextResponse.json({ ...DEFAULTS }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = ensureAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }
  try {
    const body = (await request.json()) as SiteSettingsPayload;
    const allowed: (keyof SiteSettingsPayload)[] = [
      'menuFont', 'headingFont', 'contactPhone', 'contactWhatsApp',
      'contactTelegram', 'contactEmail', 'mapCenterLon', 'mapCenterLat', 'mapLogoPath', 'siteLogoPath',
      'customFonts', 'mainPageHeadingFont', 'mainPageTextFont', 'mainPageTextMaxWidth',
    ];
    const update: SiteSettingsPayload = {};
    for (const key of allowed) {
      if (body[key] !== undefined) (update as Record<string, unknown>)[key] = body[key];
    }
    const row = await prisma.siteSettings.findFirst({ orderBy: { id: 'asc' } });
    const current = row?.json ? { ...DEFAULTS, ...JSON.parse(row.json) } : { ...DEFAULTS };
    const merged = { ...current, ...update };
    const json = JSON.stringify(merged);
    if (row) {
      await prisma.siteSettings.update({ where: { id: row.id }, data: { json } });
    } else {
      await prisma.siteSettings.create({ data: { json } });
    }
    return NextResponse.json(merged);
  } catch (e) {
    console.error('site-settings PUT', e);
    return NextResponse.json({ success: false, message: 'Ошибка сохранения' }, { status: 500 });
  }
}
