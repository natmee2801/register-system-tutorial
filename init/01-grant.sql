-- ให้สิทธิ์ user `app` สร้าง database ได้ (Prisma Migrate ต้องใช้สร้าง shadow database)
-- รันอัตโนมัติตอน MySQL container ถูกสร้างครั้งแรก
GRANT ALL PRIVILEGES ON *.* TO 'app'@'%';
FLUSH PRIVILEGES;
