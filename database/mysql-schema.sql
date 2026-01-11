-- ============================================
-- MySQL Schema для проекта Tashi Ani
-- Создано на основе Prisma schema
-- ============================================

-- Выбираем базу данных
USE `u3269198_default`;

-- Удаляем существующие таблицы (если нужно пересоздать)
-- ВНИМАНИЕ: Это удалит все данные!
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS `bim_model_comments`;
-- DROP TABLE IF EXISTS `bim_models`;
-- DROP TABLE IF EXISTS `panorama_comments`;
-- DROP TABLE IF EXISTS `panoramas`;
-- DROP TABLE IF EXISTS `photo_comments`;
-- DROP TABLE IF EXISTS `photo_folders`;
-- DROP TABLE IF EXISTS `photos`;
-- DROP TABLE IF EXISTS `project_stages`;
-- DROP TABLE IF EXISTS `documents`;
-- DROP TABLE IF EXISTS `messages`;
-- DROP TABLE IF EXISTS `projects`;
-- DROP TABLE IF EXISTS `objects`;
-- DROP TABLE IF EXISTS `verification_codes`;
-- DROP TABLE IF EXISTS `users`;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Таблица: users (Пользователи)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NULL,
  `role` ENUM('MASTER', 'USER') NOT NULL DEFAULT 'USER',
  `password` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `metadata` TEXT NULL COMMENT 'JSON строка с дополнительной информацией',
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: objects (Объекты)
-- ============================================
CREATE TABLE IF NOT EXISTS `objects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `address` VARCHAR(500) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_objects_user_id` (`user_id`),
  INDEX `idx_objects_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: projects (Проекты)
-- ============================================
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'PLANNING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  INDEX `idx_projects_object_id` (`object_id`),
  INDEX `idx_projects_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: project_stages (Этапы проекта)
-- ============================================
CREATE TABLE IF NOT EXISTS `project_stages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `order_index` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  INDEX `idx_project_stages_project_id` (`project_id`),
  INDEX `idx_project_stages_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: photo_folders (Папки для фотографий)
-- ============================================
CREATE TABLE IF NOT EXISTS `photo_folders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  INDEX `idx_photo_folders_object_id` (`object_id`),
  INDEX `idx_photo_folders_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: photos (Фотографии)
-- ============================================
CREATE TABLE IF NOT EXISTS `photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NULL,
  `project_id` INT NULL,
  `stage_id` INT NULL,
  `folder_id` INT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `is_visible_to_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `thumbnail_filename` VARCHAR(255) NULL,
  `thumbnail_file_path` VARCHAR(500) NULL,
  `thumbnail_file_size` INT NULL,
  `thumbnail_width` INT NULL,
  `thumbnail_height` INT NULL,
  `thumbnail_mime_type` VARCHAR(100) NULL,
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stage_id`) REFERENCES `project_stages`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`folder_id`) REFERENCES `photo_folders`(`id`) ON DELETE SET NULL,
  INDEX `idx_photos_object_id` (`object_id`),
  INDEX `idx_photos_project_id` (`project_id`),
  INDEX `idx_photos_folder_id` (`folder_id`),
  INDEX `idx_photos_visible` (`is_visible_to_customer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: panoramas (Панорамы)
-- ============================================
CREATE TABLE IF NOT EXISTS `panoramas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `is_visible_to_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `thumbnail_filename` VARCHAR(255) NULL,
  `thumbnail_file_path` VARCHAR(500) NULL,
  `thumbnail_file_size` INT NULL,
  `thumbnail_width` INT NULL,
  `thumbnail_height` INT NULL,
  `thumbnail_mime_type` VARCHAR(100) NULL,
  `original_width` INT NULL,
  `original_height` INT NULL,
  `projection_type` ENUM('EQUIRECTANGULAR', 'CYLINDRICAL', 'UNKNOWN') NOT NULL DEFAULT 'EQUIRECTANGULAR',
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  INDEX `idx_panoramas_object_id` (`object_id`),
  INDEX `idx_panoramas_visible` (`is_visible_to_customer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: panorama_comments (Комментарии к панорамам)
-- ============================================
CREATE TABLE IF NOT EXISTS `panorama_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `panorama_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `yaw` FLOAT NULL,
  `pitch` FLOAT NULL,
  `is_admin_comment` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`panorama_id`) REFERENCES `panoramas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_panorama_comments_panorama_id` (`panorama_id`),
  INDEX `idx_panorama_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: photo_comments (Комментарии к фото)
-- ============================================
CREATE TABLE IF NOT EXISTS `photo_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `photo_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `is_admin_comment` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_photo_comments_photo_id` (`photo_id`),
  INDEX `idx_photo_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: documents (Документы)
-- ============================================
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NULL,
  `project_id` INT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `document_type` ENUM('CONTRACT', 'PLAN', 'PERMIT', 'INVOICE', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `is_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  INDEX `idx_documents_object_id` (`object_id`),
  INDEX `idx_documents_project_id` (`project_id`),
  INDEX `idx_documents_type` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: messages (Сообщения)
-- ============================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NULL,
  `project_id` INT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `is_admin_message` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_messages_object_id` (`object_id`),
  INDEX `idx_messages_project_id` (`project_id`),
  INDEX `idx_messages_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: verification_codes (Коды верификации)
-- ============================================
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_verification_codes_email` (`email`),
  INDEX `idx_verification_codes_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: bim_models (3D модели BIM)
-- ============================================
CREATE TABLE IF NOT EXISTS `bim_models` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `object_id` INT NULL,
  `project_id` INT NULL,
  `stage_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `version` VARCHAR(50) NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `original_file_path` VARCHAR(500) NOT NULL,
  `original_file_size` INT NOT NULL,
  `original_mime_type` VARCHAR(100) NOT NULL,
  `original_format` ENUM('SKETCHUP', 'REVIT', 'ARCHICAD', 'IFC', 'GLTF', 'OBJ', 'THREE_DS', 'OTHER') NOT NULL,
  `viewable_filename` VARCHAR(255) NULL,
  `viewable_file_path` VARCHAR(500) NULL,
  `viewable_file_size` INT NULL,
  `viewable_mime_type` VARCHAR(100) NULL,
  `viewable_format` ENUM('SKETCHUP', 'REVIT', 'ARCHICAD', 'IFC', 'GLTF', 'OBJ', 'THREE_DS', 'OTHER') NULL,
  `thumbnail_filename` VARCHAR(255) NULL,
  `thumbnail_file_path` VARCHAR(500) NULL,
  `thumbnail_file_size` INT NULL,
  `thumbnail_width` INT NULL,
  `thumbnail_height` INT NULL,
  `thumbnail_mime_type` VARCHAR(100) NULL,
  `is_visible_to_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_by_user_id` INT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stage_id`) REFERENCES `project_stages`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_bim_models_object_id` (`object_id`),
  INDEX `idx_bim_models_project_id` (`project_id`),
  INDEX `idx_bim_models_visible` (`is_visible_to_customer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Таблица: bim_model_comments (Комментарии к 3D моделям)
-- ============================================
CREATE TABLE IF NOT EXISTS `bim_model_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bim_model_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `x` FLOAT NULL,
  `y` FLOAT NULL,
  `z` FLOAT NULL,
  `is_visible_to_customer` TINYINT(1) NOT NULL DEFAULT 1,
  `is_admin_comment` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `is_read_by_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`bim_model_id`) REFERENCES `bim_models`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_bim_model_comments_model_id` (`bim_model_id`),
  INDEX `idx_bim_model_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Готово!
-- ============================================
-- Все таблицы созданы.
-- Теперь можно выполнить миграцию данных из старой БД (если есть).
-- ============================================
