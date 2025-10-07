ALTER TABLE `plans` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `plans_slug_unique` ON `plans` (`slug`);