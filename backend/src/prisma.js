import { PrismaClient } from '@prisma/client'

// แชร์ PrismaClient instance เดียวทั้งแอป
export const prisma = new PrismaClient()
