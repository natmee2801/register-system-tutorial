import 'dotenv/config' // ต้องโหลดเอง: เมื่อมี config file Prisma จะไม่ auto-load .env ให้
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'node prisma/seed.js',
  },
})
