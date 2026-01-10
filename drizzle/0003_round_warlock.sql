ALTER TABLE `sales` ADD `splitBetween` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sales` ADD `cashPayers` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales` ADD `cardPayers` int DEFAULT 0;