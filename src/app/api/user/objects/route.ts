import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: "Email обязателен" }, { status: 400 });
    }

    // Найти пользователя с его объектами
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        objects: {
          include: {
            projects: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true
              }
            },
            photos: {
              where: {
                isVisibleToCustomer: true
              }
            },
            _count: {
              select: {
                documents: true,
                messages: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Пользователь не найден" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      objects: user.objects 
    });

  } catch (error) {
    console.error('Ошибка загрузки объектов пользователя:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Внутренняя ошибка сервера" 
    }, { status: 500 });
  }
}
