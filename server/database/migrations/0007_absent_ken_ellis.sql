DROP INDEX `plans_slug_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `plans_slug_interval_unique` ON `plans` (`slug`,`interval`);--> statement-breakpoint
ALTER TABLE `businesses` DROP COLUMN `business_type`;--> statement-breakpoint
ALTER TABLE `businesses` DROP COLUMN `location`;--> statement-breakpoint
ALTER TABLE `businesses` DROP COLUMN `bio`;--> statement-breakpoint
ALTER TABLE `businesses` DROP COLUMN `services`;--> statement-breakpoint
ALTER TABLE `businesses` DROP COLUMN `has_completed_setup`;