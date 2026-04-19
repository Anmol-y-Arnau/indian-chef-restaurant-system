ALTER TABLE `reservations` MODIFY COLUMN `origin` enum('manual','web','phone','whatsapp') NOT NULL DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `restaurant_tables` ADD `capacity` int DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurant_tables` ADD `guests` int DEFAULT 0 NOT NULL;