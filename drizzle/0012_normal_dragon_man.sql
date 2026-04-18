CREATE TABLE `peak_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `peak_days_id` PRIMARY KEY(`id`),
	CONSTRAINT `peak_days_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `walk_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`time` varchar(5) NOT NULL,
	`partySize` int NOT NULL DEFAULT 2,
	`assignedTableIds` text NOT NULL,
	`assignmentInstruction` text,
	`estimatedEnd` varchar(5),
	`isPeakDay` tinyint NOT NULL DEFAULT 0,
	`walkin_status` enum('seated','finished','cancelled') NOT NULL DEFAULT 'seated',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walk_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reservations` ADD `assignedTableIds` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `assignmentInstruction` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `estimatedEnd` varchar(5);--> statement-breakpoint
ALTER TABLE `reservations` ADD `isPeakDay` tinyint DEFAULT 0 NOT NULL;