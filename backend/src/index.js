import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import studentsRouter from './routes/students.js'
import metaRouter from './routes/meta.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())

// health check
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'register-system-api' })
})

app.use('/api', studentsRouter)
app.use('/api', metaRouter)

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// error handler — แปลง Prisma error เป็น HTTP status
app.use((err, req, res, next) => {
  // unique constraint ซ้ำ
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: `ข้อมูลซ้ำ: ${err.meta?.target ?? 'unique field'}`,
    })
  }
  // foreign key / record ไม่พบ
  if (err?.code === 'P2025' || err?.code === 'P2003') {
    return res.status(400).json({ success: false, error: 'อ้างอิงข้อมูลไม่ถูกต้อง' })
  }
  console.error(err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`)
})
