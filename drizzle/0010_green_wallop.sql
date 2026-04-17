CREATE TABLE `custom_item_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`addedToMenu` tinyint NOT NULL DEFAULT 0,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_item_log_id` PRIMARY KEY(`id`)
);
