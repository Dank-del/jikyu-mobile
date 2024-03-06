ALTER TABLE `client` RENAME TO `clients`;--> statement-breakpoint
ALTER TABLE `project` RENAME TO `projects`;--> statement-breakpoint
ALTER TABLE `rate` RENAME TO `rates`;--> statement-breakpoint
ALTER TABLE `task` RENAME TO `tasks`;--> statement-breakpoint
ALTER TABLE `time_tracking` RENAME TO `time_trackings`;--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `time_trackings` DROP COLUMN `hours_spent`;