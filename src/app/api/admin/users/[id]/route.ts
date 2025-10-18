import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/userManagement';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Токен авторизации не предоставлен' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminData = verifyToken(token);
    
    if (!adminData || (adminData.role !== 'ADMIN' && adminData.role !== 'MASTER')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Недостаточно прав для редактирования пользователей' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, company, notes } = body;

    // Проверяем, что пользователь существует
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Пользователь не найден' 
      }, { status: 404 });
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        email: email,
        // Добавляем дополнительные поля в метаданные как JSON строку
        metadata: JSON.stringify({
          phone: phone || null,
          company: company || null,
          notes: notes || null
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно обновлен',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Ошибка обновления пользователя:', error);
    return NextResponse.json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Токен авторизации не предоставлен' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminData = verifyToken(token);
    
    if (!adminData || (adminData.role !== 'ADMIN' && adminData.role !== 'MASTER')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Недостаточно прав для просмотра пользователя' 
      }, { status: 403 });
    }

    // Получаем пользователя с метаданными
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        objects: {
          include: {
            _count: {
              select: {
                photos: true,
                documents: true,
                projects: true,
                messages: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Пользователь не найден' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('Ошибка получения пользователя:', error);
    return NextResponse.json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    }, { status: 500 });
  }
}
