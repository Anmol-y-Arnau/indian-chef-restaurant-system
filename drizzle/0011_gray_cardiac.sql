CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`guestPhone` varchar(30) NOT NULL,
	`guestEmail` varchar(320),
	`date` varchar(10) NOT NULL,
	`time` varchar(5) NOT NULL,
	`partySize` int NOT NULL DEFAULT 2,
	`tableId` varchar(20),
	`status` enum('pending','confirmed','seated','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`notes` text,
	`origin` enum('manual','web','phone') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
