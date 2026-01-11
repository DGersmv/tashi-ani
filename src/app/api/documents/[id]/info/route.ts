export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Для статического экспорта (не используется, т.к. API работает через PHP)
export async function generateStaticParams() {
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = parseInt(id);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        filename: true,
        originalName: true,
        objectId: true,
        projectId: true,
        isPaid: true
      }
    });

    if (!document) {
      return NextResponse.json({ 
        success: false, 
        message: 'Документ не найден' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Ошибка получения информации о документе:', error);
    return NextResponse.json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    }, { status: 500 });
  }
}

