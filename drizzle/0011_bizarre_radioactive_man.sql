CREATE TABLE `staynest_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`adminEmail` varchar(320) NOT NULL,
	`action` varchar(128) NOT NULL,
	`targetType` varchar(64) NOT NULL,
	`targetId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staynest_audit_logs_id` PRIMARY KEY(`id`)
);
