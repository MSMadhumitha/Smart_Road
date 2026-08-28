-- AlterTable
ALTER TABLE `reports` MODIFY `status` ENUM('Pending', 'Inspected', 'In Review', 'In Progress', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending';
