ALTER TABLE `user` ADD `has_active_subscription` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `has_completed_setup` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `subscription_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_step` text DEFAULT 'verification' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_completed_at` integer;