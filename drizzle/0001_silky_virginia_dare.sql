CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` varchar(20) NOT NULL,
	`itemId` varchar(50) NOT NULL,
	`itemName` text NOT NULL,
	`itemPrice` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurant_tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` varchar(20) NOT NULL,
	`status` enum('free','occupied','reserved') NOT NULL DEFAULT 'free',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurant_tables_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurant_tables_tableId_unique` UNIQUE(`tableId`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` varchar(20) NOT NULL,
	`items` json NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
