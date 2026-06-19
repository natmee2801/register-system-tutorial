import { Router } from 'express'
import * as ctrl from '../controllers/meta.js'

const router = Router()

router.get('/faculties', ctrl.listFaculties)
router.get('/courses', ctrl.listCourses)

export default router
