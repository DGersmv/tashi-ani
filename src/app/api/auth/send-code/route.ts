import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { isMasterAdmin, userExists } from "@/lib/userManagement";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 POST /api/auth/send-code вызван");
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

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Сохраняем код в базе данных
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 минут
      }
    });
    
    // Проверяем, настроены ли переменные окружения
    console.log("🔧 Проверка переменных окружения:");
    console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ настроен" : "❌ не настроен");
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ настроен" : "❌ не настроен");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📝 Код для ${email}: ${code}`);
      console.log("⚠️ EMAIL_USER и EMAIL_PASS не настроены. Создайте .env.local для реальной отправки email.");
      
      return NextResponse.json({ 
        success: true, 
        message: "Код отправлен на email",
        debug: "Режим разработки - код в консоли"
      });
    }

    // Настройка транспорта для отправки email
    console.log("📧 Настройка SMTP транспорта...");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // Используем порт 587 для STARTTLS
      secure: false, // STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000, // 5 секунд
      greetingTimeout: 3000,   // 3 секунды
      socketTimeout: 5000,    // 5 секунд
      debug: false,             // Отключаем отладку
      logger: false             // Отключаем логи
    });

    // HTML шаблон письма
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Код подтверждения</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d3a373, #b8946f); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .code { font-size: 32px; font-weight: bold; color: #d3a373; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 2px dashed #d3a373; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Код подтверждения</h1>
              <p>Вход в систему tashi-ani.ru</p>
            </div>
            <div class="content">
              <p>Здравствуйте!</p>
              <p>Вы запросили код для входа в систему. Используйте следующий код для подтверждения:</p>
              <div class="code">${code}</div>
              <p><strong>Код действителен в течение 10 минут.</strong></p>
              <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            </div>
            <div class="footer">
              <p>С уважением,<br>Команда tashi-ani.ru</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Отправляем email с таймаутом
    const sendEmailPromise = transporter.sendMail({
      from: `"Tashi-Ani" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Код подтверждения для входа в систему",
      html: htmlTemplate,
    });

    // Добавляем таймаут 15 секунд
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout')), 15000);
    });

    await Promise.race([sendEmailPromise, timeoutPromise]);

    console.log(`Код отправлен на ${email}: ${code}`);

    return NextResponse.json({ 
      success: true, 
      message: "Код отправлен на email"
    });

  } catch (error) {
    console.error("Ошибка отправки кода:", error);
    
    // Если email не работает, показываем код в консоли для отладки
    const { email } = await request.json().catch(() => ({ email: "unknown" }));
    console.log(`⚠️ EMAIL НЕ РАБОТАЕТ! Код для ${email}: ${code}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Код отправлен (проверьте консоль сервера)",
      debug: "Email не работает, код в логах сервера"
    });
  }
}