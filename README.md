# แบบฝึกหัด: ระบบลงทะเบียนนักศึกษา (Student Registration System)

โจทย์นี้ให้สร้างระบบ **CRUD ลงทะเบียนนักศึกษา** โดยแยก **Frontend** กับ **Backend** ออกจากกันอย่างชัดเจน
เอกสารนี้เป็น **spec** (ข้อกำหนด) — โครงสร้างและโค้ดให้ผู้เรียนเขียนเองตาม spec ที่กำหนด

> เป้าหมาย: ฝึกการต่อ Frontend ↔ REST API ↔ Database ให้ครบ flow ของ CRUD

---

## 1. Tech Stack ที่กำหนด

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | **Nuxt.js** (Vue 3) |
| Backend | **Node.js + Express** |
| ORM | **Prisma** |
| Database | **MySQL 8.0** (มีให้แล้วใน `docker-compose.yml`) |
| Admin DB | phpMyAdmin (`http://localhost:8080`) |

### Port ที่ใช้
| Service | Port |
|---------|------|
| Frontend (Nuxt) | `3000` |
| Backend (Express API) | `4000` |
| MySQL | `3306` |
| phpMyAdmin | `8080` |

---

## 2. โครงสร้างโปรเจกต์ (Structure)

ให้จัดโครงสร้างเป็น 2 โฟลเดอร์แยกกัน:

```
crud-tutorial/
├── docker-compose.yml      # (มีให้แล้ว) MySQL + phpMyAdmin
├── backend/                # Node + Express API
│   ├── prisma/
│   │   ├── schema.prisma   # นิยาม model/ตาราง (ดู §3)
│   │   ├── migrations/     # ไฟล์ migration ที่ Prisma สร้าง
│   │   └── seed.js         # ข้อมูลตัวอย่างเริ่มต้น
│   ├── src/
│   │   ├── index.js        # entry point, สร้าง server
│   │   ├── prisma.js       # สร้าง PrismaClient instance (export ใช้ร่วม)
│   │   ├── routes/
│   │   │   └── students.js # route ของ student
│   │   └── controllers/
│   │       └── students.js # logic ของแต่ละ endpoint
│   ├── .env
│   └── package.json
└── frontend/               # Nuxt.js
    ├── pages/
    │   ├── index.vue       # หน้ารายชื่อนักศึกษา
    │   ├── register.vue    # หน้าฟอร์มลงทะเบียน
    │   └── students/
    │       └── [id].vue    # หน้าแก้ไข/รายละเอียด
    ├── composables/
    │   └── useStudents.js  # เรียก API
    ├── nuxt.config.ts
    └── package.json
```

---

## 3. Database Spec (ER + Prisma)

ใช้ database `crud_db` ที่มีอยู่แล้ว และจัดการ schema ทั้งหมดผ่าน **Prisma**

### 3.1 ER Diagram

ความสัมพันธ์: **คณะ** มีหลาย **สาขา** → แต่ละสาขามีหลาย **นักศึกษา** →
นักศึกษา **ลงทะเบียนเรียน** ได้หลาย **วิชา** (ความสัมพันธ์ many-to-many ผ่านตาราง `Enrollment`)

```mermaid
erDiagram
    Faculty ||--o{ Major       : "มี"
    Major   ||--o{ Student     : "สังกัด"
    Student ||--o{ Enrollment  : "ลงทะเบียน"
    Course  ||--o{ Enrollment  : "ถูกลงทะเบียน"

    Faculty {
        int     id PK
        string  name "ชื่อคณะ (unique)"
    }
    Major {
        int     id PK
        string  name        "ชื่อสาขา"
        int     facultyId FK
    }
    Student {
        int      id PK
        string   studentCode "รหัสนักศึกษา (unique)"
        string   firstName
        string   lastName
        string   email       "(unique)"
        int      year        "ชั้นปี 1-8"
        int      majorId FK
        datetime createdAt
        datetime updatedAt
    }
    Course {
        int      id PK
        string   courseCode  "รหัสวิชา (unique)"
        string   name
        int      credit      "หน่วยกิต"
        int      maxSeat     "ที่นั่งสูงสุด"
    }
    Enrollment {
        int      id PK
        int      studentId FK
        int      courseId FK
        datetime enrolledAt
        string   grade       "เกรด (nullable)"
    }
```

### 3.2 รายละเอียดตาราง (Requirement)

| ตาราง | คำอธิบาย | Constraint สำคัญ |
|-------|----------|------------------|
| `Faculty`    | คณะ | `name` unique |
| `Major`      | สาขาวิชา | FK → `Faculty`, ลบคณะที่มีสาขาอยู่ไม่ได้ |
| `Student`    | นักศึกษา | `studentCode` & `email` unique, FK → `Major`, `year` 1–8 |
| `Course`     | รายวิชา | `courseCode` unique, `credit` ≥ 1 |
| `Enrollment` | การลงทะเบียนเรียน (ตารางเชื่อม) | **unique(`studentId`,`courseId`)** กันลงซ้ำ, ลบนักศึกษา/วิชา → ลบ enrollment ตาม (cascade) |

### 3.3 Prisma Schema

ไฟล์ `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Faculty {
  id     Int     @id @default(autoincrement())
  name   String  @unique
  majors Major[]
}

model Major {
  id        Int       @id @default(autoincrement())
  name      String
  faculty   Faculty   @relation(fields: [facultyId], references: [id])
  facultyId Int
  students  Student[]

  @@unique([facultyId, name])
}

model Student {
  id          Int          @id @default(autoincrement())
  studentCode String       @unique
  firstName   String
  lastName    String
  email       String       @unique
  year        Int
  major       Major        @relation(fields: [majorId], references: [id])
  majorId     Int
  enrollments Enrollment[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Course {
  id          Int          @id @default(autoincrement())
  courseCode  String       @unique
  name        String
  credit      Int
  maxSeat     Int          @default(40)
  enrollments Enrollment[]
}

model Enrollment {
  id         Int      @id @default(autoincrement())
  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId  Int
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId   Int
  grade      String?
  enrolledAt DateTime @default(now())

  @@unique([studentId, courseId])
}
```

### 3.4 Environment & คำสั่ง Prisma

ไฟล์ `backend/.env` (ค่าตรงกับ `docker-compose.yml`):
```
DATABASE_URL="mysql://app:app@localhost:3306/crud_db"
```

คำสั่งที่ใช้:
```bash
npx prisma migrate dev --name init   # สร้างตารางจาก schema
npx prisma generate                  # gen PrismaClient
npx prisma db seed                   # ใส่ข้อมูลตัวอย่าง (ถ้าทำ seed.js)
npx prisma studio                    # เปิด GUI ดูข้อมูล (optional)
```

---

## 4. Backend Spec (Node + Express)

Base URL: `http://localhost:4000/api`

### Endpoints ที่ต้องทำ

| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET`    | `/students`       | ดึงรายชื่อนักศึกษาทั้งหมด |
| `GET`    | `/students/:id`   | ดึงข้อมูลนักศึกษา 1 คน |
| `POST`   | `/students`       | ลงทะเบียนนักศึกษาใหม่ |
| `PUT`    | `/students/:id`   | แก้ไขข้อมูลนักศึกษา |
| `DELETE` | `/students/:id`   | ลบนักศึกษา |
| `GET`    | `/faculties`      | ดึงคณะ (พร้อมสาขา) — ใช้เติม dropdown ฟอร์ม |
| `GET`    | `/courses`        | ดึงรายวิชาทั้งหมด |
| `POST`   | `/students/:id/enroll` | นักศึกษาลงทะเบียนเรียน 1 วิชา (body: `{ "courseId": 1 }`) |

### ตัวอย่าง Request Body (POST / PUT `/students`)
```json
{
  "studentCode": "65010001",
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "majorId": 1,
  "year": 2
}
```

### ตัวอย่าง Response (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_code": "65010001",
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "email": "somchai@example.com",
    "majorId": 1,
    "major": { "id": 1, "name": "คอมพิวเตอร์", "faculty": { "name": "วิศวกรรมศาสตร์" } },
    "year": 2,
    "createdAt": "2026-06-19T08:00:00.000Z"
  }
}
```

### ข้อกำหนด (Requirements)
- [ ] ใช้ **Prisma Client** ในการ query (ห้ามเขียน raw SQL ต่อ DB ตรงๆ)
- [ ] `GET /students` ให้ `include` ข้อมูล `major` + `faculty` มาด้วย (ไม่ต้องให้ frontend ยิงซ้ำ)
- [ ] เปิดใช้งาน **CORS** ให้ frontend (`http://localhost:3000`) เรียกได้
- [ ] อ่านค่า config จาก `.env` (อย่า hardcode รหัสผ่าน)
- [ ] **Validate** input: ทุก field ห้ามว่าง, `email` ต้องเป็นรูปแบบอีเมล, `year` ต้องเป็น 1–8, `majorId` ต้องมีอยู่จริง
- [ ] กัน `studentCode` และ `email` ซ้ำ (ดัก Prisma error `P2002` → ตอบ `409 Conflict`)
- [ ] กันลงทะเบียนเรียนวิชาซ้ำ (unique `studentId`+`courseId` → `409`)
- [ ] ใช้ HTTP status ให้ถูก: `200` สำเร็จ, `201` สร้างใหม่, `400` input ผิด, `404` ไม่พบ, `409` ซ้ำ, `500` error

### Status Code ที่คาดหวัง
| สถานการณ์ | Status |
|-----------|--------|
| ดึง/แก้ไข/ลบ สำเร็จ | `200` |
| สร้างใหม่สำเร็จ | `201` |
| input ไม่ครบ/ผิดรูปแบบ | `400` |
| ไม่พบ id | `404` |
| code/email ซ้ำ | `409` |

---

## 5. Frontend Spec (Nuxt.js)

### หน้าที่ต้องทำ

| Route | ไฟล์ | หน้าที่ |
|-------|------|---------|
| `/` | `pages/index.vue` | แสดงตารางรายชื่อนักศึกษา + ปุ่มแก้ไข/ลบ + ปุ่มไปหน้าลงทะเบียน |
| `/register` | `pages/register.vue` | ฟอร์มลงทะเบียนนักศึกษาใหม่ (POST) |
| `/students/:id` | `pages/students/[id].vue` | ฟอร์มแก้ไขข้อมูล (โหลดข้อมูลเดิม + PUT) |

### ข้อกำหนด (Requirements)
- [ ] ตั้งค่า base URL ของ API ผ่าน `runtimeConfig` ใน `nuxt.config.ts`
- [ ] ใช้ `$fetch` / `useFetch` ในการเรียก API
- [ ] ช่อง **สาขา (major)** ในฟอร์มเป็น **dropdown** โหลดจาก `GET /faculties` (ไม่ให้พิมพ์เอง)
- [ ] ฟอร์มมี **validation ฝั่ง client** ก่อนส่ง (แจ้งเตือนเมื่อกรอกไม่ครบ)
- [ ] แสดง **loading state** ระหว่างโหลดข้อมูล
- [ ] แสดง **error message** เมื่อ API ตอบ error (เช่น code/email ซ้ำ)
- [ ] หลังลงทะเบียน/แก้ไขสำเร็จ ให้ redirect กลับหน้า `/`
- [ ] ปุ่มลบต้องมี **confirm** ก่อนยืนยัน

---

## 6. ขั้นตอนการรัน (Getting Started)

### 1) เปิด Database
```bash
docker compose up -d
# phpMyAdmin: http://localhost:8080  (user: root / pass: root)
```

### 2) Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init   # สร้างตารางใน MySQL
npx prisma db seed                   # (ถ้าทำ seed.js) ใส่คณะ/สาขา/วิชา ตัวอย่าง
npm run dev                          # รันที่ http://localhost:4000
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev          # รันที่ http://localhost:3000
```

---

## 7. เกณฑ์การส่งงาน (Acceptance Criteria)

งานถือว่าเสร็จเมื่อ:

- [ ] CRUD ครบทั้ง 5 endpoints และทดสอบผ่าน (เช่นด้วย Postman / Thunder Client)
- [ ] หน้าเว็บทั้ง 3 หน้าใช้งานได้จริง เชื่อมกับ API
- [ ] ลงทะเบียนนักศึกษาใหม่ → เห็นในตารางหน้าแรกทันที
- [ ] แก้ไขข้อมูล → ค่าถูกอัปเดตใน database
- [ ] ลบนักศึกษา → หายจากตารางและ database (รวมถึง enrollment ที่เกี่ยวข้อง)
- [ ] กรอก `studentCode`/`email` ซ้ำ แล้วระบบแจ้งเตือน ไม่บันทึกซ้ำ
- [ ] รัน `prisma migrate` แล้วได้ครบ 5 ตารางตาม ER (Faculty, Major, Student, Course, Enrollment)
- [ ] นักศึกษาลงทะเบียนเรียนวิชาเดิมซ้ำไม่ได้
- [ ] validate input ทั้งฝั่ง client และ server

---

## 8. โจทย์เสริม (Bonus — ถ้าทำพื้นฐานเสร็จ)

- [ ] เพิ่ม **ค้นหา** (search by ชื่อ/รหัส) และ **filter ตามคณะ**
- [ ] เพิ่ม **pagination** ในหน้ารายชื่อ
- [ ] เพิ่ม **sort** ตามชั้นปี / ชื่อ
- [ ] ทำ **toast notification** ตอนสำเร็จ/ล้มเหลว
- [ ] เพิ่มฟิลด์รูปโปรไฟล์ (อัปโหลดไฟล์)
- [ ] เขียน **unit test** ของ backend (เช่น Jest + Supertest)

---

> 💡 **คำแนะนำ:** เริ่มจาก Backend ให้เรียกผ่าน Postman ได้ก่อน แล้วค่อยทำ Frontend มาต่อ
> จะ debug ง่ายกว่าทำพร้อมกันทั้งสองฝั่ง
