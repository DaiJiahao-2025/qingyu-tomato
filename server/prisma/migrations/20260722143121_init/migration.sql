-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workspace` (
    `userId` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `Workspace_userId_syncedAt_idx`(`userId`, `syncedAt`),
    PRIMARY KEY (`userId`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `userId` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `color` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `Project_userId_syncedAt_idx`(`userId`, `syncedAt`),
    PRIMARY KEY (`userId`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `userId` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `status` ENUM('todo', 'doing', 'done') NOT NULL DEFAULT 'todo',
    `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    `estimatedPomodoros` INTEGER NOT NULL DEFAULT 1,
    `completedPomodoros` INTEGER NOT NULL DEFAULT 0,
    `createdAt` VARCHAR(191) NOT NULL DEFAULT '',
    `completedAt` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `Task_userId_syncedAt_idx`(`userId`, `syncedAt`),
    INDEX `Task_userId_workspaceId_idx`(`userId`, `workspaceId`),
    PRIMARY KEY (`userId`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FocusSession` (
    `userId` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `characterId` VARCHAR(191) NOT NULL,
    `taskText` TEXT NOT NULL,
    `focusMinutes` INTEGER NOT NULL,
    `startedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `completedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FocusSession_userId_syncedAt_idx`(`userId`, `syncedAt`),
    PRIMARY KEY (`userId`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSettings` (
    `userId` VARCHAR(191) NOT NULL,
    `defaultFocusMinutes` INTEGER NOT NULL DEFAULT 25,
    `breakMinutes` INTEGER NOT NULL DEFAULT 5,
    `musicId` VARCHAR(191) NOT NULL DEFAULT 'rain_001',
    `voiceVolume` DOUBLE NOT NULL DEFAULT 0.7,
    `musicVolume` DOUBLE NOT NULL DEFAULT 0.25,
    `muted` BOOLEAN NOT NULL DEFAULT false,
    `currentCharacterId` VARCHAR(191) NOT NULL DEFAULT 'suisui_001',
    `currentWorkspaceId` VARCHAR(191) NOT NULL DEFAULT 'workspace_personal',
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterProgress` (
    `userId` VARCHAR(191) NOT NULL,
    `characterId` VARCHAR(191) NOT NULL,
    `completedPomodoros` INTEGER NOT NULL DEFAULT 0,
    `storyProgress` INTEGER NOT NULL DEFAULT 0,
    `unlockedEpisodeIds` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CharacterProgress_userId_syncedAt_idx`(`userId`, `syncedAt`),
    PRIMARY KEY (`userId`, `characterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryEntry` (
    `userId` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `characterId` VARCHAR(191) NOT NULL,
    `characterName` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `unlockText` TEXT NOT NULL,
    `unlockedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `taskText` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GalleryEntry_userId_syncedAt_idx`(`userId`, `syncedAt`),
    PRIMARY KEY (`userId`, `episodeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Workspace` ADD CONSTRAINT `Workspace_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FocusSession` ADD CONSTRAINT `FocusSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterProgress` ADD CONSTRAINT `CharacterProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GalleryEntry` ADD CONSTRAINT `GalleryEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
