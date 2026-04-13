CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(30) NOT NULL,
	`customerId` int NOT NULL,
	`customerSnapshot` json NOT NULL,
	`items` json NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`taxRate` decimal(5,2) NOT NULL DEFAULT '10.00',
	`taxAmount` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`tableId` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
ALTER TABLE `frequent_customers` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `frequent_customers` ADD `phone` varchar(30);