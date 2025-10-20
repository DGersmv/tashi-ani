import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: "Email обязателен" }, { status: 400 });
    }

    // Найти объект с полной информацией
    const object = await prisma.object.findFirst({
      where: { 
        id: objectId,
        user: { email }
      },
      include: {
        projects: {
          include: {
            documents: true, // Включаем документы проектов
            stages: {
              include: {
                photos: {
                  where: {
                    isVisibleToCustomer: true
                  }
                }
              }
            },
            photos: {
              where: {
                isVisibleToCustomer: true
              }
            },
            _count: {
              select: {
                photos: true,
                documents: true,
                messages: true
              }
            }
          }
        },
        photos: {
          where: {
            isVisibleToCustomer: true
          },
          include: {
            folder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        documents: true,
        messages: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!object) {
      return NextResponse.json({ success: false, message: "Объект не найден" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      object 
    });

  } catch (error) {
    console.error('Ошибка загрузки объекта:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Внутренняя ошибка сервера" 
    }, { status: 500 });
  }
}
