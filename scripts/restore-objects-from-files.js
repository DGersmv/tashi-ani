const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreObjectsFromScannedData() {
  console.log('🔄 Восстановление объектов из файлов...\n');

  // Загружаем результаты сканирования
  const scanFile = '/tmp/scanned_files.json';
  if (!fs.existsSync(scanFile)) {
    console.log('❌ Файл результатов сканирования не найден. Сначала запустите scan-files.js');
    process.exit(1);
  }

  const scannedData = JSON.parse(fs.readFileSync(scanFile, 'utf-8'));
  
  console.log(`Найдено объектов для восстановления: ${scannedData.length}\n`);

  let restoredObjects = 0;
  let restoredPhotos = 0;
  let restoredDocuments = 0;

  for (const objData of scannedData) {
    try {
      // Проверяем существует ли объект
      let object = await prisma.object.findUnique({
        where: { id: objData.objectId }
      });

      // Создаем объект если не существует
      if (!object) {
        object = await prisma.object.create({
          data: {
            id: objData.objectId,
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
        const photoPath = path.join('/var/www/tashi-ani/public', photoData.path);
        
        if (fs.existsSync(photoPath)) {
          // Проверяем не существует ли уже
          const existingPhoto = await prisma.photo.findFirst({
            where: {
              objectId: objData.objectId,
              filename: photoData.filename
            }
          });

          if (!existingPhoto) {
            // Определяем MIME тип
            const ext = path.extname(photoData.filename).toLowerCase();
            const mimeTypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp'
            };
            const mimeType = mimeTypes[ext] || 'image/jpeg';

            await prisma.photo.create({
              data: {
                objectId: objData.objectId,
                filename: photoData.filename,
                originalName: photoData.filename,
                filePath: photoData.path,
                fileSize: photoData.size,
                mimeType: mimeType,
                isVisibleToCustomer: true,
                uploadedAt: new Date()
              }
            });
            restoredPhotos++;
          }
        }
      }

      // Восстанавливаем документы
      for (const docData of objData.documents) {
        const docPath = path.join('/var/www/tashi-ani/public', docData.path);
        
        if (fs.existsSync(docPath)) {
          // Проверяем не существует ли уже
          const existingDoc = await prisma.document.findFirst({
            where: {
              objectId: objData.objectId,
              filename: docData.filename
            }
          });

          if (!existingDoc) {
            // Определяем MIME тип
            const ext = path.extname(docData.filename).toLowerCase();
            const mimeTypes = {
              '.pdf': 'application/pdf',
              '.doc': 'application/msword',
              '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              '.xls': 'application/vnd.ms-excel',
              '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
            const mimeType = mimeTypes[ext] || 'application/octet-stream';

            await prisma.document.create({
              data: {
                objectId: objData.objectId,
                filename: docData.filename,
                originalName: docData.filename,
                filePath: docData.path,
                fileSize: docData.size,
                mimeType: mimeType,
                documentType: 'OTHER',
                uploadedAt: new Date()
              }
            });
            restoredDocuments++;
          }
        }
      }

      console.log(`  📷 Фото: ${objData.photos.length}, 📄 Документы: ${objData.documents.length}\n`);

    } catch (error) {
      console.error(`❌ Ошибка при восстановлении объекта ${objData.objectId}:`, error.message);
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ Восстановление завершено:');
  console.log(`   Объектов: ${restoredObjects}`);
  console.log(`   Фото: ${restoredPhotos}`);
  console.log(`   Документов: ${restoredDocuments}`);
  console.log('═══════════════════════════════════════\n');
}

async function main() {
  try {
    await restoreObjectsFromScannedData();
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

