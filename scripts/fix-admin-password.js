const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔐 Исправление пароля администратора...\n');
    
    // Проверяем текущую БД
    const dbPath = process.env.DATABASE_URL?.replace('file:', '');
    console.log(`База данных: ${dbPath || 'из .env'}\n`);

    const email = process.env.MASTER_ADMIN_EMAIL || 'admin@tashi-ani.ru';
    const password = process.env.MASTER_ADMIN_PASSWORD || 'admin123';
    
    console.log(`Email: ${email}`);
    console.log(`Новый пароль: ${password}\n`);

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Проверяем, существует ли пользователь
    let admin = await prisma.user.findFirst({
      where: { 
        OR: [
          { email },
          { role: 'MASTER' }
        ]
      }
    });
    
    if (admin) {
      // Обновляем пароль существующего пользователя
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          email: email, // Обновляем email на случай если он другой
          role: 'MASTER',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Пароль администратора обновлен!');
    } else {
      // Создаем нового админа
      admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'MASTER',
          status: 'ACTIVE',
          name: 'Администратор системы'
        }
      });
      console.log('✅ Администратор создан!');
    }
    
    console.log('');
    console.log('📋 Данные для входа:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Пароль: ${password}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Роль: ${admin.role}`);
    console.log('');
    console.log('✅ Готово! Теперь вы можете войти в систему.');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();

