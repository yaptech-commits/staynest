CREATE TABLE `staynest_availability_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`roomId` int NOT NULL,
	`source` varchar(32) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`checkInDate` varchar(32) NOT NULL,
	`checkOutDate` varchar(32) NOT NULL,
	`externalReference` varchar(128),
	`payload` json,
	`conflictFlagged` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_availability_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_cancellation_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`freeCancellationHours` int NOT NULL DEFAULT 48,
	`refundPercentageAfterWindow` int NOT NULL DEFAULT 0,
	`isNonRefundable` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_cancellation_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_commission_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`hotelId` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`grossAmount` decimal(10,2) NOT NULL,
	`commissionRate` decimal(5,4) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`hotelPayoutAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','payable','paid','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_commission_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookingId` int,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`dedupeKey` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `staynest_notifications_dedupeKey_unique` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `staynest_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','processing','paid','failed') NOT NULL DEFAULT 'pending',
	`processorReference` varchar(128),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_rate_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`roomId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`currency` varchar(8) NOT NULL,
	`nightlyAmount` decimal(10,2) NOT NULL,
	`cancellationPolicyId` int,
	`billflowRatePlanId` varchar(128),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_rate_plans_id` PRIMARY KEY(`id`)
);
