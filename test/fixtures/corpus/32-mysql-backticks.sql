ALTER TABLE `shop`.`orders` ADD COLUMN `note` VARCHAR(200) AFTER `status`;
CREATE INDEX `idx_note` ON `shop`.`orders` (`note`);
DROP TABLE `legacy_users`;
