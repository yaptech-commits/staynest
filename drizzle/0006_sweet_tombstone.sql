CREATE TABLE `staynest_payout_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`ownerId` int NOT NULL,
	`payoutMethod` varchar(32) NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountNumber` varchar(128) NOT NULL,
	`bankName` varchar(128),
	`networkProvider` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staynest_payout_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(64),
	`smsRemindersEnabled` int NOT NULL DEFAULT 1,
	`emailRemindersEnabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staynest_user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `staynest_user_preferences_userId_unique` UNIQUE(`userId`)
);
