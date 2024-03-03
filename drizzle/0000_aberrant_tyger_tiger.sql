CREATE TABLE `client` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`client_id` integer NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `rate` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rate_per_hour` real NOT NULL,
	`client_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`project_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `time_spent_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`hours_spent` real NOT NULL,
	`project_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `time_tracking` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`hours_spent` real NOT NULL,
	`task_id` integer NOT NULL
);
