import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ล้างข้อมูลเดิม (เรียงตาม dependency)
  await prisma.enrollment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.course.deleteMany()
  await prisma.major.deleteMany()
  await prisma.faculty.deleteMany()

  // คณะ + สาขา
  const eng = await prisma.faculty.create({
    data: {
      name: 'วิศวกรรมศาสตร์',
      majors: { create: [{ name: 'คอมพิวเตอร์' }, { name: 'ไฟฟ้า' }] },
    },
    include: { majors: true },
  })

  const sci = await prisma.faculty.create({
    data: {
      name: 'วิทยาศาสตร์',
      majors: { create: [{ name: 'วิทยาการคอมพิวเตอร์' }, { name: 'คณิตศาสตร์' }] },
    },
    include: { majors: true },
  })

  // รายวิชา
  await prisma.course.createMany({
    data: [
      { courseCode: 'CS101', name: 'Introduction to Programming', credit: 3, maxSeat: 40 },
      { courseCode: 'CS102', name: 'Data Structures', credit: 3, maxSeat: 35 },
      { courseCode: 'MA101', name: 'Calculus I', credit: 3, maxSeat: 50 },
    ],
  })

  // นักศึกษาตัวอย่าง
  await prisma.student.create({
    data: {
      studentCode: '65010001',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      email: 'somchai@example.com',
      year: 2,
      majorId: eng.majors[0].id,
    },
  })

  console.log('✅ Seed completed:', {
    faculties: [eng.name, sci.name],
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
