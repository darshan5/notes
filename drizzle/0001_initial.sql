CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `pin_hash` text,
  `pin_attempts` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `device_name` text,
  `is_pin_device` integer NOT NULL DEFAULT 0,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);

CREATE TABLE `api_keys` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `key_hash` text NOT NULL,
  `name` text NOT NULL,
  `last_used_at` integer,
  `created_at` integer NOT NULL
);

CREATE TABLE `notes` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `title` text NOT NULL DEFAULT '',
  `body` text NOT NULL DEFAULT '',
  `pinned` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `note_tags` (
  `note_id` text NOT NULL REFERENCES `notes`(`id`) ON DELETE CASCADE,
  `tag` text NOT NULL,
  PRIMARY KEY (`note_id`, `tag`)
);

CREATE INDEX `notes_user_id_idx` ON `notes` (`user_id`);
CREATE INDEX `notes_updated_at_idx` ON `notes` (`updated_at`);
CREATE INDEX `note_tags_tag_idx` ON `note_tags` (`tag`);
