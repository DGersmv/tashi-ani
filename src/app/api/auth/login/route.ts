import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/userManagement";

// Добавляем OPTIONS для CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Логируем начало запроса для диагностики
    console.log("[AUTH LOGIN] POST request received");
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log("[AUTH LOGIN] Email:", email ? "provided" : "missing");

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email и пароль обязательны" 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const result = await authenticateUser(email, password);

    if (result.success && result.user && result.token) {
      return NextResponse.json({
        success: true,
        message: "Успешная аутентификация",
        user: result.user,
        token: result.token
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Неверный email или пароль"
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

  } catch (error) {
    console.error("Ошибка аутентификации:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Ошибка аутентификации" 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

