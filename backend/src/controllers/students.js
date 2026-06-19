import { prisma } from '../prisma.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const studentInclude = {
  major: { include: { faculty: true } },
}

// ตรวจสอบ input ของ student (ใช้ทั้ง create และ update)
function validate(body) {
  const errors = []
  const { studentCode, firstName, lastName, email, majorId, year } = body

  if (!studentCode || !String(studentCode).trim()) errors.push('studentCode is required')
  if (!firstName || !String(firstName).trim()) errors.push('firstName is required')
  if (!lastName || !String(lastName).trim()) errors.push('lastName is required')
  if (!email || !String(email).trim()) errors.push('email is required')
  else if (!EMAIL_RE.test(email)) errors.push('email is invalid')
  if (!Number.isInteger(year) || year < 1 || year > 8) errors.push('year must be an integer 1-8')
  if (!Number.isInteger(majorId)) errors.push('majorId is required (integer)')

  return errors
}

// GET /api/students
export async function list(req, res, next) {
  try {
    const students = await prisma.student.findMany({
      include: studentInclude,
      orderBy: { id: 'asc' },
    })
    res.json({ success: true, data: students })
  } catch (e) {
    next(e)
  }
}

// GET /api/students/:id
export async function getOne(req, res, next) {
  try {
    const id = Number(req.params.id)
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        ...studentInclude,
        enrollments: { include: { course: true } },
      },
    })
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' })
    res.json({ success: true, data: student })
  } catch (e) {
    next(e)
  }
}

// POST /api/students
export async function create(req, res, next) {
  try {
    const errors = validate(req.body)
    if (errors.length) return res.status(400).json({ success: false, errors })

    const major = await prisma.major.findUnique({ where: { id: req.body.majorId } })
    if (!major) return res.status(400).json({ success: false, errors: ['majorId does not exist'] })

    const student = await prisma.student.create({
      data: {
        studentCode: req.body.studentCode.trim(),
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
        email: req.body.email.trim(),
        year: req.body.year,
        majorId: req.body.majorId,
      },
      include: studentInclude,
    })
    res.status(201).json({ success: true, data: student })
  } catch (e) {
    next(e)
  }
}

// PUT /api/students/:id
export async function update(req, res, next) {
  try {
    const id = Number(req.params.id)
    const errors = validate(req.body)
    if (errors.length) return res.status(400).json({ success: false, errors })

    const exists = await prisma.student.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ success: false, error: 'Student not found' })

    const major = await prisma.major.findUnique({ where: { id: req.body.majorId } })
    if (!major) return res.status(400).json({ success: false, errors: ['majorId does not exist'] })

    const student = await prisma.student.update({
      where: { id },
      data: {
        studentCode: req.body.studentCode.trim(),
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
        email: req.body.email.trim(),
        year: req.body.year,
        majorId: req.body.majorId,
      },
      include: studentInclude,
    })
    res.json({ success: true, data: student })
  } catch (e) {
    next(e)
  }
}

// DELETE /api/students/:id
export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id)
    const exists = await prisma.student.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ success: false, error: 'Student not found' })

    await prisma.student.delete({ where: { id } })
    res.json({ success: true, data: { id } })
  } catch (e) {
    next(e)
  }
}

// POST /api/students/:id/enroll  body: { courseId }
export async function enroll(req, res, next) {
  try {
    const studentId = Number(req.params.id)
    const courseId = Number(req.body.courseId)
    if (!Number.isInteger(courseId)) {
      return res.status(400).json({ success: false, errors: ['courseId is required (integer)'] })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' })

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' })

    // unique(studentId, courseId) จะกันลงซ้ำเอง -> error handler ตอบ 409
    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId },
      include: { course: true },
    })
    res.status(201).json({ success: true, data: enrollment })
  } catch (e) {
    next(e)
  }
}
