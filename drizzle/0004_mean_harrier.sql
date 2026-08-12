CREATE TABLE `staynest_onboarding_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('guest','partner') NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`businessName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staynest_onboarding_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `staynest_onboarding_profiles_userId_unique` UNIQUE(`userId`)
);
