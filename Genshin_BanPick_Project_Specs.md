# TÀI LIỆU TỔNG HỢP: HỆ THỐNG BAN/PICK GENSHIN IMPACT LA HOÀN CẢNH GIỚI
Dự án Web Cấm/Chọn 16 Nhân vật & Tính Cost/Handicap.

---

## PHẦN 1: TÀI LIỆU LUẬT CHƠI (GAME RULES)

### 1. Trình tự Cấm / Chọn (Ban/Pick Flow)
Mỗi đội cần 8 nhân vật để đi 2 phòng La Hoàn. Tổng cộng có 6 lượt Cấm (Ban) và 16 lượt Chọn (Pick). Nhân vật đã bị cấm hoặc đã được đội kia chọn sẽ không thể được chọn lại.

| Lượt | Giai đoạn | Đội thực hiện | Hành động | Số lượng |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Phase 1 (Cấm) | Đội Xanh | Cấm | 1 |
| 2 | Phase 1 (Cấm) | Đội Đỏ | Cấm | 1 |
| 3 | Phase 1 (Cấm) | Đội Xanh | Cấm | 1 |
| 4 | Phase 1 (Cấm) | Đội Đỏ | Cấm | 1 |
| 5 | Phase 2 (Chọn) | Đội Xanh | Chọn | 1 |
| 6 | Phase 2 (Chọn) | Đội Đỏ | Chọn | 2 |
| 7 | Phase 2 (Chọn) | Đội Xanh | Chọn | 2 |
| 8 | Phase 2 (Chọn) | Đội Đỏ | Chọn | 1 |
| 9 | Phase 3 (Cấm) | Đội Đỏ | Cấm | 1 |
| 10 | Phase 3 (Cấm) | Đội Xanh | Cấm | 1 |
| 11 | Phase 4 (Chọn) | Đội Đỏ | Chọn | 1 |
| 12 | Phase 4 (Chọn) | Đội Xanh | Chọn | 2 |
| 13 | Phase 4 (Chọn) | Đội Đỏ | Chọn | 2 |
| 14 | Phase 4 (Chọn) | Đội Xanh | Chọn | 2 |
| 15 | Phase 4 (Chọn) | Đội Đỏ | Chọn | 2 |
| 16 | Phase 4 (Chọn) | Đội Xanh | Chọn | 1 |

### 2. Hệ thống tính Điểm Trang bị (Cost)
Mỗi nhân vật được chọn sẽ phải khai báo trang bị. Hệ thống tự động tính Cost dựa trên các quy tắc:
* **Nhân vật 4 Sao:** Mặc định 0 Cost.
* **Cung mệnh 4 Sao:** Từ C0 đến C6 đều tính 0 Cost.
* **Nhân vật 5 Sao:** Mặc định 1 Cost (Xác C0).
* **Cung mệnh 5 Sao:** Mỗi bậc Cung mệnh (C1-C6) cộng thêm 1 Cost.
* **Vũ khí 4 Sao:** 0 Cost.
* **Vũ khí 5 Sao:** 1 Cost (Áp dụng cho mọi nhân vật, bất kể 4 sao hay 5 sao).

### 3. Bù trừ thời gian (Time Handicap)
Sau khi tính tổng Cost của 8 nhân vật mỗi đội, hệ thống so sánh và đưa ra mức phạt thời gian cho đội có Cost cao hơn.
* **Công thức:** `(Tổng Cost Đội Cao - Tổng Cost Đội Thấp) * [Số giây quy đổi/1 Cost] = Số giây Đội Cao phải đi nhanh hơn.`
* *(Admin có thể cài đặt 1 Cost = 10s hoặc 15s khi tạo phòng).*

---

## PHẦN 2: TÀI LIỆU KỸ THUẬT (TECHNICAL SPECS)

### 1. Kiến trúc Công nghệ (Tech Stack)
* **Frontend:** Next.js (App Router), Tailwind CSS, Zustand (Quản lý State).
* **Backend:** Next.js API Routes (Serverless).
* **Database:** PostgreSQL.
* **ORM:** Prisma.
* **Real-time:** Supabase Realtime (WebSockets).
* **Dữ liệu nhân vật:** Genshin.dev API.

### 2. Cấu trúc Cơ sở dữ liệu (Prisma Schema)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Room {
  id              String   @id @default(uuid())
  code            String   @unique
  status          String   // 'WAITING', 'DRAFTING', 'BUILDING', 'FINISHED'
  costPerPoint    Int      @default(10) // Số giây/1 Cost
  bluePlayerName  String?
  redPlayerName   String?
  logs            DraftLog[]
  builds          CharacterBuild[]
  createdAt       DateTime @default(now())
}

model DraftLog {
  id          Int      @id @default(autoincrement())
  roomId      String
  player      String   // 'BLUE' or 'RED'
  action      String   // 'BAN' or 'PICK'
  characterId String   
  turnNumber  Int
  room        Room     @relation(fields: [roomId], references: [id])
}

model CharacterBuild {
  id          Int      @id @default(autoincrement())
  roomId      String
  player      String   // 'BLUE' or 'RED'
  characterId String   
  rarity      Int      // 4 or 5
  consLevel   Int      // 0 to 6
  weaponRarity Int     // 4 or 5
  totalCost   Int
  room        Room     @relation(fields: [roomId], references: [id])
}
```

### 3. Cấu trúc thư mục Next.js (Folder Structure)
```text
/src
  /app
    /page.tsx                   // Trang chủ, tạo phòng/nhập mã phòng
    /room/[code]/page.tsx       // Phase 1: Bảng Draft chính (Ban/Pick)
    /room/[code]/build/page.tsx // Phase 2: Trang khai báo Cost (Build)
    /room/[code]/result/page.tsx// Phase 3: Bảng tổng kết & Handicap
    /api
      /room/route.ts            // API tạo phòng
      /draft/route.ts           // API xử lý Ban/Pick & Validate lượt
      /build/route.ts           // API lưu Cost
  /components
    /DraftBoard.tsx             // Lưới tướng và logic chọn
    /CharacterCard.tsx
    /CostCalculator.tsx
  /lib
    /prisma.ts                  // Cấu hình Database
    /supabase.ts                // Cấu hình Realtime client
    /store.ts                   // Zustand state management
```

---

## PHẦN 3: TÀI LIỆU TRIỂN KHAI (DEPLOYMENT)

### Bước 1: Thiết lập Database & Real-time trên Supabase
1. Đăng ký tài khoản Supabase.
2. Tạo Project mới và lấy chuỗi kết nối Database URL.
3. Bật tính năng **Real-time** cho 2 bảng `DraftLog` và `Room`.

### Bước 2: Cấu hình Biến môi trường
Tạo file `.env` trong Next.js:
```env
DATABASE_URL="postgresql://postgres:mat_khau@db.xxxx.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="chuoi_key_anon_cua_ban"
```

### Bước 3: Khởi tạo Database
Đẩy cấu trúc bảng lên Supabase bằng Prisma:
```bash
npx prisma db push
npx prisma generate
```

### Bước 4: Triển khai lên Vercel
1. Đẩy mã nguồn lên GitHub.
2. Đăng nhập Vercel, chọn **Add New Project** -> Liên kết kho GitHub.
3. Copy nội dung file `.env` dán vào phần **Environment Variables** của Vercel.
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp cho bạn một domain public (VD: `genshin-draft.vercel.app`).
