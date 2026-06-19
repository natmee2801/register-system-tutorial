import { Router } from 'express'
import * as ctrl from '../controllers/students.js'

const router = Router()

router.get('/students', ctrl.list)
router.get('/students/:id', ctrl.getOne)
router.post('/students', ctrl.create)
router.put('/students/:id', ctrl.update)
router.delete('/students/:id', ctrl.remove)
router.post('/students/:id/enroll', ctrl.enroll)

export default router
