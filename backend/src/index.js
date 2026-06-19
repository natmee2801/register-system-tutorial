import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())

// health check
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'register-system-api' })
})

// TODO: เพิ่ม routes ที่นี่ (students CRUD + enroll, faculties, courses)
// app.use('/api', studentsRouter)
// app.use('/api', metaRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`)
})
