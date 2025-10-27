ALTER TABLE `styles` ADD `type` text;--> statement-breakpoint
ALTER TABLE `styles` ADD `status` text DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `styles` ADD `notes` text;