const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureAdminUser() {
  // Проверяем есть ли админ
  let admin = await prisma.user.findFirst({
    where: { role: 'MASTER' }
  });

  if (!admin) {
    // Создаем админа если нет
    const email = 'admin@tashi-ani.ru';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'MASTER',
        status: 'ACTIVE',
        firstName: 'Администратор',
        lastName: 'Системы'
      }
    });

    console.log(`✅ Создан администратор: ${email} / ${password}`);
  } else {
    console.log(`ℹ️  Используется существующий администратор: ${admin.email}`);
  }

  return admin;
}

async function restoreObjects() {
  console.log('🔄 Восстановление объектов из файлов...\n');
  
  // Создаем/получаем администратора
  const admin = await ensureAdminUser();
  console.log('');

  const scanFile = '/tmp/scanned_files.json';
  if (!fs.existsSync(scanFile)) {
    console.log('❌ Сначала запустите scan-files.js');
    process.exit(1);
  }

  const scannedData = JSON.parse(fs.readFileSync(scanFile, 'utf-8'));
  console.log(`Найдено объектов: ${scannedData.length}\n`);

  let restoredObjects = 0, restoredPhotos = 0, restoredDocuments = 0;

  for (const objData of scannedData) {
    try {
      let object = await prisma.object.findUnique({ where: { id: objData.objectId } });
      
      if (!object) {
        object = await prisma.object.create({
          data: {
            id: objData.objectId,
            userId: admin.id,
            title: `Объект ${objData.objectId}`,
            description: 'Восстановлен из файлов',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Создан объект ${objData.objectId}`);
        restoredObjects++;
      } else {
        console.log(`ℹ️  Объект ${objData.objectId} уже существует`);
      }

      // Восстанавливаем фото
      for (const photoData of objData.photos) {
        const existing = await prisma.photo.findFirst({
          where: { objectId: objData.objectId, filename: photoData.filename }
        });
        
        if (!existing) {
          const ext = path.extname(photoData.filename).toLowerCase();
          const mimeTypes = { 
            '.jpg': 'image/jpeg', 
            '.jpeg': 'image/jpeg', 
            '.png': 'image/png', 
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          
          await prisma.photo.create({
            data: {
              objectId: objData.objectId,
              filename: photoData.filename,
              originalName: photoData.filename,
              filePath: photoData.path,
              fileSize: photoData.size,
              mimeType: mimeTypes[ext] || 'image/jpeg',
              isVisibleToCustomer: true,
              uploadedAt: new Date()
            }
          });
          restoredPhotos++;
        }
      }

      // Восстанавливаем документы
      for (const docData of objData.documents) {
        const existing = await prisma.document.findFirst({
          where: { objectId: objData.objectId, filename: docData.filename }
        });
        
        if (!existing) {
          const ext = path.extname(docData.filename).toLowerCase();
          const mimeTypes = { 
            '.pdf': 'application/pdf', 
            '.doc': 'application/msword', 
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          };
          
          await prisma.document.create({
            data: {
              objectId: objData.objectId,
              filename: docData.filename,
              originalName: docData.filename,
              filePath: docData.path,
              fileSize: docData.size,
              mimeType: mimeTypes[ext] || 'application/octet-stream',
              documentType: 'OTHER',
              uploadedAt: new Date()
            }
          });
          restoredDocuments++;
        }
      }

      console.log(`  📷 Фото: ${objData.photos.length}, 📄 Документы: ${objData.documents.length}\n`);

    } catch (error) {
      console.error(`❌ Ошибка объект ${objData.objectId}:`, error.message);
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ Восстановление завершено:');
  console.log(`   Объектов: ${restoredObjects}`);
  console.log(`   Фото: ${restoredPhotos}`);
  console.log(`   Документов: ${restoredDocuments}`);
  console.log('═══════════════════════════════════════\n');
  console.log(`👤 Администратор: ${admin.email}`);
  console.log(`   ID пользователя: ${admin.id}`);
}

restoreObjects()
  .then(() => prisma.$disconnect())
  .catch(error => {
    console.error('❌ Критическая ошибка:', error);
    prisma.$disconnect();
    process.exit(1);
  });

