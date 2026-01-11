export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMasterAdmin, userExists } from "@/lib/userManagement";

// Для статического экспорта (не используется, т.к. API работает через PHP)
export async function generateStaticParams() {
  return [];
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 POST /api/auth/send-code-simple вызван");
    
    // Генерируем код сразу
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🎲 Сгенерирован код:", code);
    
    const { email } = await request.json();
    console.log("📧 Email для отправки:", email);

    if (!email) {
      return NextResponse.json({ success: false, message: "Email обязателен" }, { status: 400 });
    }

    // Проверяем, является ли это мастер-админом
    const isMaster = await isMasterAdmin(email);
    if (isMaster) {
      return NextResponse.json({ 
        success: false, 
        message: "Для входа мастер-админа используйте пароль" 
      }, { status: 400 });
    }

    // Проверяем, существует ли пользователь в базе
    const userExistsInDb = await userExists(email);
    if (!userExistsInDb) {
      return NextResponse.json({ 
        success: false, 
        message: "Свяжитесь с администратором для получения доступа" 
      }, { status: 403 });
    }

    // Сохраняем код в базе данных
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
      }
    });
    
    console.log("✅ Код сохранен в базе данных");
    
    // ВСЕГДА возвращаем код для показа на экране
    return NextResponse.json({ 
      success: true, 
      message: "Код сгенерирован",
      code: code,
      debug: "Простая версия API - код показан на экране"
    });

  } catch (error) {
    console.error("Ошибка в простом API:", error);
    
    // Даже при ошибке возвращаем код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🎲 Резервный код:", code);
    
    return NextResponse.json({ 
      success: true, 
      message: "Код сгенерирован (резервный)",
      code: code,
      debug: "Простая версия API - резервный код"
    });
  }
}
