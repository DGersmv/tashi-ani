/**
 * Скрипт для миграции данных из SQLite в PostgreSQL
 * 
 * Использование:
 * 1. Убедитесь что у вас есть старая SQLite база: prisma/prod.db
 * 2. Настройте DATABASE_URL для PostgreSQL в .env.local
 * 3. Установите sqlite3: npm install sqlite3
 * 4. Запустите: node scripts/migrate-sqlite-to-postgres.js
 * 
 * ВАЖНО: Перед запуском убедитесь что:
 * - Prisma schema настроен на PostgreSQL (provider = "postgresql")
 * - Миграции применены к PostgreSQL (npx prisma migrate deploy)
 * - DATABASE_URL указывает на PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// PostgreSQL клиент (использует DATABASE_URL из .env.local)
const postgresClient = new PrismaClient();

// SQLite база данных
const sqliteDbPath = process.env.SQLITE_DATABASE_URL 
  ? process.env.SQLITE_DATABASE_URL.replace('file:', '')
  : path.join(__dirname, '../prisma/prod.db');

// Функция для чтения данных из SQLite
function querySQLite(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    db.all(query, params, (err, rows) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function migrateUsers() {
  console.log('📦 Миграция пользователей...');
  const users = await querySQLite('SELECT * FROM users');
  console.log(`   Найдено пользователей: ${users.length}`);

  for (const user of users) {
    try {
      await postgresClient.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          password: user.password,
          status: user.status,
          metadata: user.metadata,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          password: user.password,
          status: user.status,
          metadata: user.metadata,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции пользователя ${user.email}:`, error.message);
    }
  }
  console.log('   ✅ Пользователи мигрированы');
}

async function migrateObjects() {
  console.log('📦 Миграция объектов...');
  const objects = await querySQLite('SELECT * FROM objects');
  console.log(`   Найдено объектов: ${objects.length}`);

  for (const obj of objects) {
    try {
      await postgresClient.object.upsert({
        where: { id: obj.id },
        update: {
          userId: obj.userId,
          title: obj.title,
          description: obj.description,
          address: obj.address,
          status: obj.status,
        },
        create: {
          id: obj.id,
          userId: obj.userId,
          title: obj.title,
          description: obj.description,
          address: obj.address,
          status: obj.status,
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции объекта ${obj.id}:`, error.message);
    }
  }
  console.log('   ✅ Объекты мигрированы');
}

async function migrateProjects() {
  console.log('📦 Миграция проектов...');
  const projects = await querySQLite('SELECT * FROM projects');
  console.log(`   Найдено проектов: ${projects.length}`);

  for (const project of projects) {
    try {
      await postgresClient.project.upsert({
        where: { id: project.id },
        update: {
          objectId: project.objectId,
          title: project.title,
          description: project.description,
          status: project.status,
        },
        create: {
          id: project.id,
          objectId: project.objectId,
          title: project.title,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции проекта ${project.id}:`, error.message);
    }
  }
  console.log('   ✅ Проекты мигрированы');
}

async function migrateProjectStages() {
  console.log('📦 Миграция этапов проектов...');
  const stages = await querySQLite('SELECT * FROM project_stages');
  console.log(`   Найдено этапов: ${stages.length}`);

  for (const stage of stages) {
    try {
      await postgresClient.projectStage.upsert({
        where: { id: stage.id },
        update: {
          projectId: stage.projectId,
          title: stage.title,
          description: stage.description,
          status: stage.status,
          orderIndex: stage.orderIndex,
        },
        create: {
          id: stage.id,
          projectId: stage.projectId,
          title: stage.title,
          description: stage.description,
          status: stage.status,
          orderIndex: stage.orderIndex,
          createdAt: stage.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции этапа ${stage.id}:`, error.message);
    }
  }
  console.log('   ✅ Этапы проектов мигрированы');
}

async function migratePhotoFolders() {
  console.log('📦 Миграция папок фотографий...');
  const folders = await querySQLite('SELECT * FROM photo_folders');
  console.log(`   Найдено папок: ${folders.length}`);

  for (const folder of folders) {
    try {
      await postgresClient.photoFolder.upsert({
        where: { id: folder.id },
        update: {
          objectId: folder.objectId,
          name: folder.name,
          orderIndex: folder.orderIndex,
        },
        create: {
          id: folder.id,
          objectId: folder.objectId,
          name: folder.name,
          orderIndex: folder.orderIndex,
          createdAt: folder.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции папки ${folder.id}:`, error.message);
    }
  }
  console.log('   ✅ Папки фотографий мигрированы');
}

async function migratePhotos() {
  console.log('📦 Миграция фотографий...');
  const photos = await querySQLite('SELECT * FROM photos');
  console.log(`   Найдено фотографий: ${photos.length}`);

  for (const photo of photos) {
    try {
      await postgresClient.photo.upsert({
        where: { id: photo.id },
        update: {
          objectId: photo.objectId,
          projectId: photo.projectId,
          stageId: photo.stageId,
          folderId: photo.folderId,
          filename: photo.filename,
          originalName: photo.originalName,
          filePath: photo.filePath,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          isVisibleToCustomer: photo.isVisibleToCustomer,
          thumbnailFilename: photo.thumbnailFilename,
          thumbnailFilePath: photo.thumbnailFilePath,
          thumbnailFileSize: photo.thumbnailFileSize,
          thumbnailWidth: photo.thumbnailWidth,
          thumbnailHeight: photo.thumbnailHeight,
          thumbnailMimeType: photo.thumbnailMimeType,
        },
        create: {
          id: photo.id,
          objectId: photo.objectId,
          projectId: photo.projectId,
          stageId: photo.stageId,
          folderId: photo.folderId,
          filename: photo.filename,
          originalName: photo.originalName,
          filePath: photo.filePath,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          isVisibleToCustomer: photo.isVisibleToCustomer,
          uploadedAt: photo.uploadedAt,
          thumbnailFilename: photo.thumbnailFilename,
          thumbnailFilePath: photo.thumbnailFilePath,
          thumbnailFileSize: photo.thumbnailFileSize,
          thumbnailWidth: photo.thumbnailWidth,
          thumbnailHeight: photo.thumbnailHeight,
          thumbnailMimeType: photo.thumbnailMimeType,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции фото ${photo.id}:`, error.message);
    }
  }
  console.log('   ✅ Фотографии мигрированы');
}

async function migratePanoramas() {
  console.log('📦 Миграция панорам...');
  const panoramas = await querySQLite('SELECT * FROM panoramas');
  console.log(`   Найдено панорам: ${panoramas.length}`);

  for (const panorama of panoramas) {
    try {
      await postgresClient.panorama.upsert({
        where: { id: panorama.id },
        update: {
          objectId: panorama.objectId,
          filename: panorama.filename,
          originalName: panorama.originalName,
          filePath: panorama.filePath,
          fileSize: panorama.fileSize,
          mimeType: panorama.mimeType,
          isVisibleToCustomer: panorama.isVisibleToCustomer,
          thumbnailFilename: panorama.thumbnailFilename,
          thumbnailFilePath: panorama.thumbnailFilePath,
          thumbnailFileSize: panorama.thumbnailFileSize,
          thumbnailWidth: panorama.thumbnailWidth,
          thumbnailHeight: panorama.thumbnailHeight,
          thumbnailMimeType: panorama.thumbnailMimeType,
          originalWidth: panorama.originalWidth,
          originalHeight: panorama.originalHeight,
          projectionType: panorama.projectionType,
        },
        create: {
          id: panorama.id,
          objectId: panorama.objectId,
          filename: panorama.filename,
          originalName: panorama.originalName,
          filePath: panorama.filePath,
          fileSize: panorama.fileSize,
          mimeType: panorama.mimeType,
          isVisibleToCustomer: panorama.isVisibleToCustomer,
          uploadedAt: panorama.uploadedAt,
          thumbnailFilename: panorama.thumbnailFilename,
          thumbnailFilePath: panorama.thumbnailFilePath,
          thumbnailFileSize: panorama.thumbnailFileSize,
          thumbnailWidth: panorama.thumbnailWidth,
          thumbnailHeight: panorama.thumbnailHeight,
          thumbnailMimeType: panorama.thumbnailMimeType,
          originalWidth: panorama.originalWidth,
          originalHeight: panorama.originalHeight,
          projectionType: panorama.projectionType,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции панорамы ${panorama.id}:`, error.message);
    }
  }
  console.log('   ✅ Панорамы мигрированы');
}

async function migrateDocuments() {
  console.log('📦 Миграция документов...');
  const documents = await querySQLite('SELECT * FROM documents');
  console.log(`   Найдено документов: ${documents.length}`);

  for (const doc of documents) {
    try {
      await postgresClient.document.upsert({
        where: { id: doc.id },
        update: {
          objectId: doc.objectId,
          projectId: doc.projectId,
          filename: doc.filename,
          originalName: doc.originalName,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          documentType: doc.documentType,
          isPaid: doc.isPaid,
        },
        create: {
          id: doc.id,
          objectId: doc.objectId,
          projectId: doc.projectId,
          filename: doc.filename,
          originalName: doc.originalName,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          documentType: doc.documentType,
          isPaid: doc.isPaid,
          uploadedAt: doc.uploadedAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции документа ${doc.id}:`, error.message);
    }
  }
  console.log('   ✅ Документы мигрированы');
}

async function migrateMessages() {
  console.log('📦 Миграция сообщений...');
  const messages = await querySQLite('SELECT * FROM messages');
  console.log(`   Найдено сообщений: ${messages.length}`);

  for (const message of messages) {
    try {
      await postgresClient.message.upsert({
        where: { id: message.id },
        update: {
          objectId: message.objectId,
          projectId: message.projectId,
          userId: message.userId,
          content: message.content,
          isAdminMessage: message.isAdminMessage,
          isReadByAdmin: message.isReadByAdmin,
          isReadByCustomer: message.isReadByCustomer,
        },
        create: {
          id: message.id,
          objectId: message.objectId,
          projectId: message.projectId,
          userId: message.userId,
          content: message.content,
          isAdminMessage: message.isAdminMessage,
          isReadByAdmin: message.isReadByAdmin,
          isReadByCustomer: message.isReadByCustomer,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции сообщения ${message.id}:`, error.message);
    }
  }
  console.log('   ✅ Сообщения мигрированы');
}

async function migratePhotoComments() {
  console.log('📦 Миграция комментариев к фото...');
  const comments = await querySQLite('SELECT * FROM photo_comments');
  console.log(`   Найдено комментариев: ${comments.length}`);

  for (const comment of comments) {
    try {
      await postgresClient.photoComment.upsert({
        where: { id: comment.id },
        update: {
          photoId: comment.photoId,
          userId: comment.userId,
          content: comment.content,
          isAdminComment: comment.isAdminComment,
          isReadByAdmin: comment.isReadByAdmin,
          isReadByCustomer: comment.isReadByCustomer,
        },
        create: {
          id: comment.id,
          photoId: comment.photoId,
          userId: comment.userId,
          content: comment.content,
          isAdminComment: comment.isAdminComment,
          isReadByAdmin: comment.isReadByAdmin,
          isReadByCustomer: comment.isReadByCustomer,
          createdAt: comment.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции комментария ${comment.id}:`, error.message);
    }
  }
  console.log('   ✅ Комментарии к фото мигрированы');
}

async function migratePanoramaComments() {
  console.log('📦 Миграция комментариев к панорамам...');
  const comments = await querySQLite('SELECT * FROM panorama_comments');
  console.log(`   Найдено комментариев: ${comments.length}`);

  for (const comment of comments) {
    try {
      await postgresClient.panoramaComment.upsert({
        where: { id: comment.id },
        update: {
          panoramaId: comment.panoramaId,
          userId: comment.userId,
          content: comment.content,
          yaw: comment.yaw,
          pitch: comment.pitch,
          isAdminComment: comment.isAdminComment,
          isReadByAdmin: comment.isReadByAdmin,
          isReadByCustomer: comment.isReadByCustomer,
        },
        create: {
          id: comment.id,
          panoramaId: comment.panoramaId,
          userId: comment.userId,
          content: comment.content,
          yaw: comment.yaw,
          pitch: comment.pitch,
          isAdminComment: comment.isAdminComment,
          isReadByAdmin: comment.isReadByAdmin,
          isReadByCustomer: comment.isReadByCustomer,
          createdAt: comment.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции комментария ${comment.id}:`, error.message);
    }
  }
  console.log('   ✅ Комментарии к панорамам мигрированы');
}

async function migrateBimModels() {
  console.log('📦 Миграция BIM моделей...');
  const models = await querySQLite('SELECT * FROM bim_models');
  console.log(`   Найдено моделей: ${models.length}`);

  for (const model of models) {
    try {
      await postgresClient.bimModel.upsert({
        where: { id: model.id },
        update: {
          objectId: model.objectId,
          projectId: model.projectId,
          stageId: model.stageId,
          name: model.name,
          description: model.description,
          version: model.version,
          originalFilename: model.originalFilename,
          originalFilePath: model.originalFilePath,
          originalFileSize: model.originalFileSize,
          originalMimeType: model.originalMimeType,
          originalFormat: model.originalFormat,
          viewableFilename: model.viewableFilename,
          viewableFilePath: model.viewableFilePath,
          viewableFileSize: model.viewableFileSize,
          viewableMimeType: model.viewableMimeType,
          viewableFormat: model.viewableFormat,
          thumbnailFilename: model.thumbnailFilename,
          thumbnailFilePath: model.thumbnailFilePath,
          thumbnailFileSize: model.thumbnailFileSize,
          thumbnailWidth: model.thumbnailWidth,
          thumbnailHeight: model.thumbnailHeight,
          thumbnailMimeType: model.thumbnailMimeType,
          isVisibleToCustomer: model.isVisibleToCustomer,
          uploadedByUserId: model.uploadedByUserId,
        },
        create: {
          id: model.id,
          objectId: model.objectId,
          projectId: model.projectId,
          stageId: model.stageId,
          name: model.name,
          description: model.description,
          version: model.version,
          originalFilename: model.originalFilename,
          originalFilePath: model.originalFilePath,
          originalFileSize: model.originalFileSize,
          originalMimeType: model.originalMimeType,
          originalFormat: model.originalFormat,
          viewableFilename: model.viewableFilename,
          viewableFilePath: model.viewableFilePath,
          viewableFileSize: model.viewableFileSize,
          viewableMimeType: model.viewableMimeType,
          viewableFormat: model.viewableFormat,
          thumbnailFilename: model.thumbnailFilename,
          thumbnailFilePath: model.thumbnailFilePath,
          thumbnailFileSize: model.thumbnailFileSize,
          thumbnailWidth: model.thumbnailWidth,
          thumbnailHeight: model.thumbnailHeight,
          thumbnailMimeType: model.thumbnailMimeType,
          isVisibleToCustomer: model.isVisibleToCustomer,
          uploadedByUserId: model.uploadedByUserId,
          uploadedAt: model.uploadedAt,
          updatedAt: model.updatedAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции модели ${model.id}:`, error.message);
    }
  }
  console.log('   ✅ BIM модели мигрированы');
}

async function migrateBimModelComments() {
  console.log('📦 Миграция комментариев к BIM моделям...');
  const comments = await querySQLite('SELECT * FROM bim_model_comments');
  console.log(`   Найдено комментариев: ${comments.length}`);

  for (const comment of comments) {
    try {
      await postgresClient.bimModelComment.upsert({
        where: { id: comment.id },
        update: {
          bimModelId: comment.bimModelId,
          userId: comment.userId,
          content: comment.content,
          x: comment.x,
          y: comment.y,
          z: comment.z,
          isVisibleToCustomer: comment.isVisibleToCustomer,
          isAdminComment: comment.isAdminComment,
          isReadByAdmin: comment.isReadByAdmin,
          isReadByCustomer: comment.isReadByCustomer,
        },
        create: {
          id: comment.id,
          bimModelId: comment.bimModelId,
          userId: comment.userId,
          content: comment.content,
          x: comment.x,
          y: comment.y,
          z: comment.z,
          isVisibleToCustomer: comment.isVisibleToCustomer,
          isAdminComment: comment.isAdminComment,
          isReadByAdmin: comment.isReadByAdmin,
          isReadByCustomer: comment.isReadByCustomer,
          createdAt: comment.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции комментария ${comment.id}:`, error.message);
    }
  }
  console.log('   ✅ Комментарии к BIM моделям мигрированы');
}

async function migrateVerificationCodes() {
  console.log('📦 Миграция кодов верификации...');
  const codes = await querySQLite('SELECT * FROM verification_codes');
  console.log(`   Найдено кодов: ${codes.length}`);

  for (const code of codes) {
    try {
      await postgresClient.verificationCode.upsert({
        where: { id: code.id },
        update: {
          email: code.email,
          code: code.code,
          expiresAt: code.expiresAt,
        },
        create: {
          id: code.id,
          email: code.email,
          code: code.code,
          expiresAt: code.expiresAt,
          createdAt: code.createdAt,
        },
      });
    } catch (error) {
      console.error(`   ❌ Ошибка при миграции кода ${code.id}:`, error.message);
    }
  }
  console.log('   ✅ Коды верификации мигрированы');
}

async function main() {
  console.log('🚀 Начало миграции данных из SQLite в PostgreSQL\n');

  // Проверка подключений
  try {
    console.log('🔌 Проверка подключения к SQLite...');
    if (!fs.existsSync(sqliteDbPath)) {
      throw new Error(`SQLite база не найдена: ${sqliteDbPath}`);
    }
    // Проверяем что можем прочитать базу
    await querySQLite('SELECT 1');
    console.log(`   ✅ SQLite база найдена: ${sqliteDbPath}\n`);
  } catch (error) {
    console.error('   ❌ Не удалось подключиться к SQLite:', error.message);
    process.exit(1);
  }

  try {
    console.log('🔌 Проверка подключения к PostgreSQL...');
    await postgresClient.$connect();
    console.log('   ✅ PostgreSQL подключен\n');
  } catch (error) {
    console.error('   ❌ Не удалось подключиться к PostgreSQL:', error.message);
    console.error('   Убедитесь что DATABASE_URL настроен правильно в .env.local');
    process.exit(1);
  }

  // Миграция в правильном порядке (с учётом foreign keys)
  try {
    await migrateUsers();
    await migrateObjects();
    await migrateProjects();
    await migrateProjectStages();
    await migratePhotoFolders();
    await migratePhotos();
    await migratePanoramas();
    await migrateDocuments();
    await migrateMessages();
    await migratePhotoComments();
    await migratePanoramaComments();
    await migrateBimModels();
    await migrateBimModelComments();
    await migrateVerificationCodes();

    console.log('\n✅ Миграция завершена успешно!');
  } catch (error) {
    console.error('\n❌ Ошибка во время миграции:', error);
    process.exit(1);
  } finally {
    await postgresClient.$disconnect();
  }
}

main();

