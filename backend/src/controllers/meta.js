import { prisma } from '../prisma.js'

// GET /api/faculties — คณะพร้อมสาขา (ใช้เติม dropdown ฟอร์ม)
export async function listFaculties(req, res, next) {
  try {
    const data = await prisma.faculty.findMany({
      include: { majors: { orderBy: { id: 'asc' } } },
      orderBy: { id: 'asc' },
    })
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}

// GET /api/courses — รายวิชาทั้งหมด
export async function listCourses(req, res, next) {
  try {
    const data = await prisma.course.findMany({ orderBy: { id: 'asc' } })
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}
