-- Run manually or via drizzle-kit migrate when ready.
ALTER TABLE `users` MODIFY `openId` varchar(128) NOT NULL;

CREATE TABLE IF NOT EXISTS `user_entitlements` (
  `userId` int NOT NULL,
  `proExpiresAt` timestamp NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`),
  CONSTRAINT `user_entitlements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `documents` (
  `userId` int NOT NULL,
  `id` varchar(128) NOT NULL,
  `name` varchar(512) NOT NULL,
  `content` text NOT NULL,
  `version` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`, `id`),
  CONSTRAINT `documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
