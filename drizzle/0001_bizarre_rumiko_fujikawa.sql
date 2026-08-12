CREATE TABLE `staynest_blocked_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`roomId` int,
	`startDate` varchar(32) NOT NULL,
	`endDate` varchar(32) NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_blocked_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingReference` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`hotelId` int NOT NULL,
	`roomId` int NOT NULL,
	`roomNumber` varchar(64),
	`checkInDate` varchar(32) NOT NULL,
	`checkOutDate` varchar(32) NOT NULL,
	`numberOfNights` int NOT NULL,
	`guestsCount` int NOT NULL DEFAULT 1,
	`guestName` varchar(255) NOT NULL,
	`guestEmail` varchar(320) NOT NULL,
	`guestPhone` varchar(64),
	`currency` varchar(8) NOT NULL DEFAULT 'GHS',
	`totalAmount` decimal(10,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`hotelPayoutAmount` decimal(10,2) NOT NULL,
	`paymentGateway` varchar(32) NOT NULL DEFAULT 'paystack',
	`paymentReference` varchar(128),
	`paymentStatus` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
	`bookingStatus` enum('booked','checked_in','checked_out','cancelled','conflict_flagged') NOT NULL DEFAULT 'booked',
	`specialRequests` text,
	`conflictDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staynest_bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `staynest_bookings_bookingReference_unique` UNIQUE(`bookingReference`)
);
--> statement-breakpoint
CREATE TABLE `staynest_hotels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(255) NOT NULL,
	`address` text,
	`lat` decimal(10,6),
	`lng` decimal(10,6),
	`images` json NOT NULL,
	`amenities` json NOT NULL,
	`rating` decimal(3,2) DEFAULT '4.80',
	`reviewCount` int DEFAULT 0,
	`isBillflowConnected` int DEFAULT 0,
	`billflowBusinessId` varchar(128),
	`billflowPropertyId` varchar(128),
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staynest_hotels_id` PRIMARY KEY(`id`),
	CONSTRAINT `staynest_hotels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `staynest_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`userId` int NOT NULL,
	`bookingId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`guestName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staynest_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`roomType` varchar(128) NOT NULL,
	`description` text,
	`capacity` int NOT NULL DEFAULT 2,
	`priceGhs` decimal(10,2) NOT NULL,
	`priceUsd` decimal(10,2) NOT NULL,
	`totalRooms` int NOT NULL DEFAULT 5,
	`amenities` json,
	`images` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','hotel_owner','admin') NOT NULL DEFAULT 'user';