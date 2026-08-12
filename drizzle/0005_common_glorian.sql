ALTER TABLE `staynest_onboarding_profiles` ADD `emailVerificationStatus` enum('pending','verified') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `staynest_onboarding_profiles` ADD `emailVerificationToken` varchar(128);--> statement-breakpoint
ALTER TABLE `staynest_onboarding_profiles` ADD `emailVerificationExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `staynest_onboarding_profiles` ADD `emailVerifiedAt` timestamp;