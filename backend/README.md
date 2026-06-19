# Backend — Student Registration API

Express + Prisma + MySQL

## ติดตั้งและรัน

```bash
# 1) เปิด database (จาก root ของ repo)
docker compose up -d

# 2) ติดตั้ง dependencies
cd backend
npm install

# 3) ตั้งค่า env
cp .env.example .env

# 4) สร้างตารางใน MySQL
npx prisma migrate dev --name init

# 5) ใส่ข้อมูลตัวอย่าง (คณะ/สาขา/วิชา/นักศึกษา)
npm run seed

# 6) รัน API
npm run dev          # http://localhost:4000
```

## Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET    | `/api/students`        | รายชื่อนักศึกษาทั้งหมด (พร้อม major + faculty) |
| GET    | `/api/students/:id`    | นักศึกษา 1 คน (พร้อมรายวิชาที่ลงทะเบียน) |
| POST   | `/api/students`        | ลงทะเบียนนักศึกษาใหม่ |
| PUT    | `/api/students/:id`    | แก้ไขข้อมูล |
| DELETE | `/api/students/:id`    | ลบนักศึกษา |
| POST   | `/api/students/:id/enroll` | ลงทะเบียนเรียน 1 วิชา (`{ "courseId": 1 }`) |
| GET    | `/api/faculties`       | คณะ + สาขา (เติม dropdown) |
| GET    | `/api/courses`         | รายวิชาทั้งหมด |

## โครงสร้าง

```
backend/
├── prisma/
│   ├── schema.prisma   # 5 models: Faculty, Major, Student, Course, Enrollment
│   ├── migrations/     # ไฟล์ migration (Prisma สร้างให้)
│   └── seed.js         # ข้อมูลตัวอย่าง
└── src/
    ├── index.js        # express app + error handler (map Prisma error -> HTTP)
    ├── prisma.js       # PrismaClient instance
    ├── routes/         # students.js, meta.js
    └── controllers/    # students.js, meta.js
```
