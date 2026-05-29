# Báo cáo mô tả dự án Website Ban/Pick Genshin Impact

## 1. Tổng quan dự án

Website Ban/Pick Genshin Impact là một ứng dụng web hỗ trợ tổ chức các trận đấu theo thể thức cấm/chọn nhân vật Genshin Impact, chọn build, tính điểm cost và quy đổi chênh lệch cost thành thời gian handicap.

Dự án được xây dựng để phục vụ các trận đấu cộng đồng, giải đấu nhỏ hoặc các buổi giao hữu có trọng tài điều phối. Hệ thống cho phép trọng tài tạo phòng, mời hai player, điều khiển các phase của trận, theo dõi lượt ban/pick realtime, cho player chọn vũ khí/build và xuất kết quả tổng kết.

Các mục tiêu chính của hệ thống:

- Chuẩn hóa quy trình ban/pick giữa hai đội hoặc hai player.
- Hạn chế tranh cãi bằng cách hiển thị lượt, luật, cost và kết quả rõ ràng.
- Cho phép nhiều vai trò cùng xem một trận: trọng tài, player, caster/spectator.
- Hỗ trợ realtime để các bên nhìn thấy thay đổi gần như ngay lập tức.
- Lưu lại lịch sử, archive, thống kê và kết quả để tra cứu sau trận.

## 2. Website dùng để làm gì?

Website phục vụ các nhu cầu chính sau:

### 2.1. Tổ chức phòng đấu Ban/Pick

Trọng tài có thể tạo phòng đấu, mời player vào hai bên Blue/Red, cấu hình luật, chọn draft template và bắt đầu trận khi cả hai bên sẵn sàng.

### 2.2. Điều phối lượt cấm/chọn

Trong draft phase, hệ thống tự hiển thị lượt hiện tại, đội nào được chọn, hành động là BAN hay PICK, số step hiện tại và tổng số step. Player chỉ thao tác được khi đến lượt của mình.

### 2.3. Chọn build và vũ khí

Sau khi draft hoàn tất, trọng tài bấm chuyển sang build phase. Mỗi player chọn thông tin build cho các nhân vật đã pick, bao gồm:

- Rarity nhân vật.
- Cung mệnh.
- Vũ khí.
- Rarity vũ khí.
- Refinement vũ khí.

Khi player chọn vũ khí hoặc chỉnh thông tin build, hệ thống tính cost và preview realtime cho các bên khác.

### 2.4. Tính cost và handicap

Hệ thống dùng bảng cost global để tính tổng cost từng bên. Nếu một bên có tổng cost cao hơn, hệ thống quy đổi phần chênh lệch sang thời gian handicap theo công thức:

```text
Chênh lệch thời gian = Chênh lệch cost × số giây mỗi cost
```

Ví dụ: nếu Blue hơn Red 3 cost và phòng cấu hình 10 giây/cost thì Blue phải hoàn thành nhanh hơn Red 30 giây.

### 2.5. Tổng kết trận

Sau build phase, trọng tài bấm tổng kết để chuyển sang result phase. Trang kết quả hiển thị:

- Tổng cost Blue.
- Tổng cost Red.
- Chênh lệch cost.
- Thời gian handicap.
- Danh sách build từng bên.
- Tùy chọn export ảnh kết quả.

### 2.6. Công cụ phụ trợ

Ngoài flow phòng đấu, website còn có các công cụ như:

- Cost Calculator: tính thử cost và handicap không cần tạo phòng.
- Draft Simulator: giả lập draft.
- Team Builder: dựng đội hình.
- Character Randomizer: random nhân vật.
- Abyss Tracker: theo dõi tiến độ.
- Cost Catalog: quản lý bảng cost global cho toàn web.

## 3. Đối tượng sử dụng

### 3.1. Trọng tài / Host

Trọng tài là người điều phối chính của trận. Quyền của trọng tài gồm:

- Tạo phòng.
- Mời player.
- Bắt đầu draft.
- Chuyển từ draft sang build phase.
- Chuyển từ build sang tổng kết.
- Reset draft/build khi cần.
- Force skip lượt.
- Pause/unpause trận.
- Cấu hình cost per point.
- Cấu hình luật và draft template trước khi trận bắt đầu.

### 3.2. Player

Player là người tham gia trận ở team Blue hoặc Red. Player có thể:

- Tham gia phòng được mời.
- Sẵn sàng trước trận.
- Ban/pick khi tới lượt.
- Chọn build và vũ khí cho nhân vật của mình khi trọng tài đã chuyển sang build phase.
- Xem kết quả khi trọng tài đã tổng kết.

Player không được tự ý chuyển phase. Flow phase phải theo hiệu lệnh của trọng tài.

### 3.3. Caster / Spectator

Caster hoặc spectator có thể theo dõi trận thông qua giao diện overlay hoặc trang xem phòng, tùy cấu hình quyền truy cập. Vai trò này phù hợp cho stream hoặc quan sát giải đấu.

### 3.4. Admin

Admin có quyền quản lý hệ thống rộng hơn, bao gồm chỉnh bảng cost global và quản lý một số tính năng hệ thống.

## 4. Luồng sử dụng chính

### 4.1. Tạo và chuẩn bị phòng

1. Trọng tài vào lobby.
2. Tạo phòng đấu.
3. Mời player Blue và Red.
4. Hai player vào phòng và bấm sẵn sàng.
5. Trọng tài cấu hình luật nếu cần.
6. Trọng tài bấm bắt đầu draft.

### 4.2. Draft phase

1. Hệ thống hiển thị lượt hiện tại.
2. Player tới lượt chọn một nhân vật để ban hoặc pick.
3. Hệ thống cập nhật realtime cho tất cả bên.
4. Tiếp tục cho đến khi hoàn tất toàn bộ lượt draft.
5. Khi draft xong, player chờ trọng tài.
6. Trọng tài bấm Build phase để chuyển sang bước chọn build.

### 4.3. Build phase

1. Player chọn vũ khí, rarity, cung mệnh và refinement cho các nhân vật đã pick.
2. Cost được tính realtime.
3. Các bên khác thấy preview cost ngay khi player chọn.
4. Build vẫn được auto-save nền để lưu vào database.
5. Trọng tài theo dõi tổng cost hai bên.
6. Khi sẵn sàng, trọng tài bấm Tổng kết.

### 4.4. Result phase

1. Hệ thống chuyển sang trang kết quả.
2. Hiển thị tổng cost, chênh lệch và handicap.
3. Có thể export ảnh kết quả hoặc xem lại lịch sử/archive.

## 5. Kiến trúc tổng thể

Dự án sử dụng kiến trúc tách lớp, kết hợp Next.js App Router, domain logic, service layer và repository layer.

Tổng quan các lớp:

```text
UI / Components
    ↓
Next.js App Routes / API Routes
    ↓
Application Services
    ↓
Domain Logic
    ↓
Repository / Gateway Infrastructure
    ↓
Database / File / External API
```

## 6. Công nghệ sử dụng

### 6.1. Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS / CSS module-style global styles.
- Zustand cho state realtime phía client.
- Lucide React cho icon.

### 6.2. Backend

- Next.js API Routes.
- Application service layer.
- Prisma ORM.
- Supabase cho auth/realtime tùy phần cấu hình.
- File-based cost catalog cho bảng cost global.

### 6.3. Database

- Prisma schema định nghĩa model dữ liệu.
- Database URL được cấu hình qua biến môi trường `DATABASE_URL`.
- Các entity chính gồm room, draft log, character build, user, tournament, notification, friendship, archive/history-related data.

### 6.4. Realtime

Realtime được dùng để đồng bộ:

- Lượt ban/pick.
- Preview lựa chọn nhân vật.
- Build preview.
- Build saved.
- Ready status.
- Room status.

Client sử dụng store để merge dữ liệu realtime vào giao diện mà không cần reload toàn trang.

### 6.5. Docker

Dự án có `Dockerfile` và `docker-compose.yml` để build và chạy container. App được expose ở cổng `8000` bên ngoài và chạy port `3000` trong container.

## 7. Cấu trúc thư mục chính

```text
src/
  app/                         Next.js routes và API routes
  application/                 Application services và ports
  components/                  UI components
  domain/                      Logic nghiệp vụ thuần
  infrastructure/              Repository và gateway implementation
  lib/                         Helper, auth, constants, utility
  stores/                      Zustand stores
  styles/                      CSS riêng cho từng khu vực
  presentation/                HTTP response helpers
  composition/                 Dependency wiring
prisma/                        Prisma schema
scripts/                       Script hỗ trợ build/migration/report
public/                        Static assets
data/                          Dữ liệu runtime như cost catalog
```

## 8. Mô tả các module quan trọng

### 8.1. `src/app`

Chứa routing chính của website. Một số route quan trọng:

- `/`: trang chủ.
- `/lobby`: sảnh chờ.
- `/room/[code]`: phòng đấu chính.
- `/room/[code]/result`: trang kết quả.
- `/tools/cost-calculator`: công cụ tính cost.
- `/tools/cost-catalog`: quản lý bảng cost global.
- `/history`: lịch sử trận.
- `/archive`: kho trận.
- `/tournaments`: quản lý giải đấu.
- `/api/*`: các API route cho room, draft, build, cost catalog, tournament, profile, notification, v.v.

### 8.2. `src/components`

Chứa các component giao diện chính:

- `DraftBoard`: giao diện draft phase.
- `InlineBuildBoard`: giao diện build phase.
- `RealtimeRefresh`: đồng bộ realtime.
- `HostControls`: các nút điều khiển của trọng tài.
- `ResultActions`: thao tác ở trang kết quả.
- `NavBar`, `SiteHeader`, `GlobalChrome`: điều hướng và layout.
- `cost/CostCatalogManager`: giao diện quản lý bảng cost.
- `tools/CostCalculatorClient`: công cụ tính cost độc lập.

### 8.3. `src/application/services`

Chứa logic use-case của ứng dụng:

- `DraftService`: xử lý submit lượt ban/pick.
- `HostRoomService`: xử lý hành động của trọng tài.
- `BuildService`: lưu build và tính cost.
- `CostCatalogService`: đọc/ghi bảng cost global.
- `RoomService`: lấy dữ liệu phòng, build page, result page.
- `TournamentService`: xử lý giải đấu.
- `ArchiveService`, `HistoryService`: lịch sử và kho trận.

### 8.4. `src/domain`

Chứa logic nghiệp vụ độc lập với UI/framework:

- `cost/CostCatalog`: tính cost theo catalog.
- `cost/CostPolicy`: logic handicap/cost cơ bản.
- `draft/DraftPolicy`: xác định turn hiện tại, draft template, lượt ban/pick.
- `draft/PausePolicy`: luật pause/unpause.
- `series/SeriesPolicy`: logic BO series/fearless draft.
- `room/PermissionPolicy`: quyền host/player/caster.
- `tournament/Tournament`: logic tournament domain.

### 8.5. `src/infrastructure`

Chứa implementation cụ thể để truy cập dữ liệu và external service:

- Prisma repositories.
- Supabase auth provider.
- Genshin gateway lấy dữ liệu nhân vật/vũ khí.
- File repository cho cost catalog.

### 8.6. `src/stores`

Chứa Zustand store, đặc biệt là `draftStore`, dùng để lưu state client như:

- Lựa chọn hiện tại.
- Logs realtime.
- Build realtime.
- Room realtime.
- Ready status.
- Preview selections.
- UI state như chat/host panel.

## 9. Thiết kế phase trận đấu

Trận đấu được chia thành các trạng thái chính:

### 9.1. WAITING

Phòng vừa tạo, đang chờ player. Trọng tài có thể cấu hình luật, template, cost và mời player.

### 9.2. DRAFTING

Trận đang trong quá trình ban/pick. Player chỉ được thao tác khi tới lượt. Trọng tài có thể pause, force skip hoặc reset.

### 9.3. BUILDING

Draft đã xong và trọng tài đã bấm chuyển sang build phase. Player chọn build/vũ khí. Cost và handicap preview realtime.

### 9.4. FINISHED

Trọng tài đã bấm tổng kết. Hệ thống chuyển sang trang result và hiển thị kết quả cuối cùng.

Điểm quan trọng: Player không tự chuyển phase. Việc chuyển từ draft sang build và từ build sang result phải do trọng tài bấm.

## 10. Cost catalog

Cost catalog là bảng cấu hình global dùng cho toàn bộ website. Catalog này ảnh hưởng đến:

- Build phase trong phòng đấu.
- Trang result.
- History.
- Archive.
- Player stats.
- Cost Calculator.

Catalog hiện lưu các thông tin:

- Cost mặc định cho nhân vật 4 sao/5 sao.
- Cost mỗi cung mệnh.
- Cost mặc định cho vũ khí 4 sao/5 sao.
- Cost riêng cho từng nhân vật.
- Cost riêng cho từng vũ khí.

Refinement vũ khí được tính thêm vào weapon cost theo mức refinement. Ví dụ R1 là base, R2 cộng thêm, R5 cộng nhiều hơn.

Quyền sửa cost:

- Admin có thể sửa global.
- Host có phòng ở trạng thái WAITING có thể sửa trước trận.
- Khi draft đã bắt đầu, host không được sửa cost nữa.

## 11. Realtime build preview

Trong build phase, khi player chọn vũ khí hoặc chỉnh build:

1. UI local tính lại cost ngay.
2. Client gửi broadcast preview cho các bên khác.
3. Các bên khác merge preview vào store realtime.
4. Tổng cost và thời gian handicap cập nhật ngay.
5. Auto-save chạy nền để lưu build vào database.
6. Player vẫn có thể bấm Lưu nhiều lần nếu muốn xác nhận thủ công.

Thiết kế này giúp trải nghiệm giống như chọn character trong draft: thao tác của player được các role khác thấy ngay mà không cần chờ bấm lưu.

## 12. Bảo mật và phân quyền

Hệ thống có các kiểm tra quyền ở cả client và server:

- Player chỉ thao tác được team của mình.
- Host mới được thực hiện host action.
- Chỉ admin hoặc host hợp lệ mới sửa cost catalog.
- Room private chỉ cho host và player được mời truy cập.
- API route kiểm tra `clientId`, user/session và trạng thái phòng trước khi ghi dữ liệu.

Các quyền chính được gom trong domain permission policy và service layer để tránh chỉ dựa vào UI.

## 13. API chính

Một số API quan trọng:

- `POST /api/room`: tạo phòng.
- `GET /api/room/[code]`: lấy thông tin phòng.
- `POST /api/room/[code]/host`: host action như start draft, start build, finish match, reset, pause.
- `POST /api/draft`: submit lượt ban/pick.
- `POST /api/build`: lưu build.
- `GET /api/cost-catalog`: đọc cost catalog.
- `POST /api/cost-catalog`: nhập/lưu cost catalog.
- `GET /api/cost-catalog/template`: tải file mẫu cost catalog.
- `GET /api/history`: lấy lịch sử.
- `GET /api/archive`: lấy archive.

## 14. Cách chạy dự án local

### 14.1. Cài dependency

```bash
npm install
```

### 14.2. Cấu hình môi trường

Cần cấu hình các biến môi trường như:

```text
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COST_CATALOG_PATH=
```

Tùy môi trường, có thể cần thêm biến khác liên quan auth hoặc external API.

### 14.3. Generate Prisma client

```bash
npx prisma generate
```

Thông thường lệnh này cũng chạy sau `npm install` nhờ script `postinstall`.

### 14.4. Chạy dev server

```bash
npm run dev
```

Mặc định Next.js sẽ chạy ở `http://localhost:3000`.

### 14.5. Build production

```bash
npm run build
```

### 14.6. Start production

```bash
npm run start
```

## 15. Chạy bằng Docker

Dự án có `docker-compose.yml`.

### 15.1. Build image

```bash
docker compose build
```

### 15.2. Chạy container

```bash
docker compose up -d
```

Sau khi chạy, app được expose ở:

```text
http://localhost:8000
```

### 15.3. Rebuild sau khi sửa code

```bash
docker compose build
docker compose up -d
```

## 16. Kiểm thử và kiểm tra chất lượng

Các lệnh thường dùng:

```bash
npm run build
npm run lint
npm run check:architecture
```

`npm run build` giúp kiểm tra compile, type check và route generation.

`npm run check:architecture` dùng để kiểm tra một số quy tắc kiến trúc nếu script được duy trì đầy đủ.

## 17. Điểm nổi bật của dự án

- Có flow trọng tài rõ ràng, player không tự ý đổi phase.
- Realtime cho draft, build preview và trạng thái phòng.
- Cost catalog global dùng nhất quán trên nhiều trang.
- Hỗ trợ tournament, archive, history, leaderboard và profile.
- Có Docker để triển khai dễ hơn.
- Kiến trúc chia lớp rõ: UI, service, domain, infrastructure.
- Có thể mở rộng thêm draft template, luật giải đấu và thống kê.

## 18. Hướng mở rộng tương lai

Một số hướng có thể phát triển thêm:

- Giao diện admin dashboard đầy đủ hơn cho cost và người dùng.
- Import/export toàn bộ cấu hình giải đấu.
- Overlay riêng cho stream production.
- Hệ thống bracket nâng cao hơn.
- Audit log cho hành động của trọng tài.
- Tùy biến công thức handicap theo từng tournament.
- Permission rõ hơn cho caster/spectator.
- Test tự động cho domain policy và service layer.

## 19. Phân tích và thiết kế hệ thống

### 19.1. Phân tích yêu cầu chức năng

#### 19.1.1. Yêu cầu chức năng chính

**Quản lý phòng đấu:**
- Tạo phòng đấu với mã code duy nhất.
- Mời player vào team Blue/Red.
- Cấu hình luật, draft template và cost per point.
- Kiểm soát trạng thái phòng (WAITING, DRAFTING, BUILDING, FINISHED).

**Quản lý draft phase:**
- Hiển thị lượt hiện tại theo draft template.
- Cho phép player ban/pick nhân vật khi đến lượt.
- Cập nhật realtime cho tất cả người tham gia.
- Hỗ trợ pause/unpause và force skip.
- Reset draft khi cần thiết.

**Quản lý build phase:**
- Cho phép player chọn vũ khí, rarity, cung mệnh và refinement.
- Tính cost realtime dựa trên cost catalog.
- Preview build cho các bên khác.
- Auto-save build vào database.
- Hiển thị tổng cost và chênh lệch handicap.

**Tính toán cost và handicap:**
- Áp dụng cost catalog global.
- Tính cost từ character rarity, constellation, weapon, weapon rarity và refinement.
- Quy đổi chênh lệch cost thành thời gian handicap.
- Hỗ trợ override cost cho từng phòng (trước khi draft bắt đầu).

**Quản lý kết quả:**
- Hiển thị tổng cost từng team.
- Hiển thị chênh lệch cost và thời gian handicap.
- Export ảnh kết quả.
- Lưu vào history và archive.

**Công cụ phụ trợ:**
- Cost Calculator: tính cost độc lập.
- Draft Simulator: giả lập draft.
- Team Builder: dựng đội hình.
- Character Randomizer: random nhân vật.
- Abyss Tracker: theo dõi tiến độ.
- Cost Catalog Manager: quản lý bảng cost global.

**Quản lý giải đấu:**
- Tạo tournament với nhiều phòng.
- Quản lý bracket và series.
- Hỗ trợ BO3/BO5 và fearless draft.
- Theo dõi tiến độ giải đấu.

**Quản lý người dùng:**
- Đăng nhập/đăng ký qua Supabase Auth.
- Profile cá nhân với thống kê.
- Lịch sử trận đấu.
- Friendship và notification.

#### 19.1.2. Yêu cầu phi chức năng

**Hiệu năng:**
- Realtime latency dưới 500ms cho draft/build updates.
- Trang phòng đấu load trong 2 giây.
- Hỗ trợ ít nhất 50 phòng đồng thời.

**Bảo mật:**
- Xác thực người dùng qua Supabase Auth.
- Phân quyền rõ ràng: host, player, spectator, admin.
- Kiểm tra quyền ở cả client và server.
- Private room chỉ cho người được mời.

**Khả năng mở rộng:**
- Kiến trúc tách lớp dễ bảo trì.
- Domain logic độc lập với framework.
- Dễ thêm draft template mới.
- Dễ thêm cost rule mới.

**Khả dụng:**
- Giao diện responsive cho mobile/tablet/desktop.
- Hỗ trợ dark mode.
- Thông báo lỗi rõ ràng.
- Hướng dẫn sử dụng trong UI.

### 19.2. Thiết kế kiến trúc hệ thống

#### 19.2.1. Kiến trúc tổng thể

Hệ thống sử dụng kiến trúc **Layered Architecture** kết hợp với **Clean Architecture principles**:

```text
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Next.js Pages, Components, API Routes)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Application Layer                       │
│  (Services: DraftService, BuildService, RoomService)    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Domain Layer                          │
│  (Business Logic: DraftPolicy, CostPolicy, etc.)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Infrastructure Layer                      │
│  (Repositories, Gateways, External Services)            │
└─────────────────────────────────────────────────────────┘
```

**Ưu điểm của kiến trúc này:**
- Tách biệt rõ ràng giữa UI, business logic và data access.
- Domain logic không phụ thuộc vào framework hay database.
- Dễ test từng layer độc lập.
- Dễ thay đổi implementation (ví dụ: đổi database, đổi realtime provider).

#### 19.2.2. Thiết kế database

**Các entity chính:**

```prisma
Room {
  id, code, status, phase
  hostId, bluePlayerId, redPlayerId
  draftTemplate, costPerPoint
  createdAt, updatedAt
}

DraftLog {
  id, roomId, step, team, action
  characterId, timestamp
}

CharacterBuild {
  id, roomId, team, characterId
  rarity, constellation
  weaponId, weaponRarity, refinement
  cost, createdAt, updatedAt
}

User {
  id, email, username
  stats, createdAt
}

Tournament {
  id, name, format
  status, createdAt
}

TournamentMatch {
  id, tournamentId, roomId
  round, matchNumber
}

History {
  id, roomId, userId
  result, timestamp
}

Archive {
  id, roomId
  snapshot, createdAt
}
```

**Quan hệ giữa các entity:**
- Room 1-N DraftLog: một phòng có nhiều log draft.
- Room 1-N CharacterBuild: một phòng có nhiều build.
- User 1-N Room (as host/player): một user có thể tham gia nhiều phòng.
- Tournament 1-N TournamentMatch: một giải đấu có nhiều trận.
- Room 1-N History: một phòng có thể có nhiều bản ghi lịch sử.

#### 19.2.3. Thiết kế API

**REST API endpoints:**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/room | Tạo phòng mới |
| GET | /api/room/[code] | Lấy thông tin phòng |
| POST | /api/room/[code]/host | Host actions (start, pause, reset) |
| POST | /api/draft | Submit lượt ban/pick |
| POST | /api/build | Lưu build |
| GET | /api/cost-catalog | Đọc cost catalog |
| POST | /api/cost-catalog | Cập nhật cost catalog |
| GET | /api/history | Lấy lịch sử trận |
| GET | /api/archive | Lấy archive |
| POST | /api/tournament | Tạo tournament |
| GET | /api/tournament/[id] | Lấy thông tin tournament |

**Realtime channels:**
- `room:[code]`: broadcast room state changes.
- `draft:[code]`: broadcast draft logs.
- `build:[code]`: broadcast build previews.
- `ready:[code]`: broadcast ready status.

#### 19.2.4. Thiết kế domain logic

**DraftPolicy:**
- Xác định lượt hiện tại dựa trên draft template và logs.
- Validate hành động ban/pick hợp lệ.
- Kiểm tra draft đã hoàn tất chưa.

**CostPolicy:**
- Tính cost từ character và weapon.
- Áp dụng cost catalog.
- Tính handicap từ chênh lệch cost.

**PermissionPolicy:**
- Kiểm tra quyền host/player/spectator.
- Validate hành động theo role.

**PausePolicy:**
- Quản lý trạng thái pause/unpause.
- Validate pause rules.

**SeriesPolicy:**
- Quản lý BO series.
- Fearless draft logic.

### 19.3. Thiết kế giao diện người dùng

#### 19.3.1. Wireframe chính

**Trang lobby:**
- Danh sách phòng đang chờ.
- Nút tạo phòng mới.
- Tìm kiếm phòng theo code.

**Trang phòng đấu (draft phase):**
- Draft board hiển thị nhân vật đã ban/pick.
- Danh sách nhân vật có thể chọn.
- Thông tin lượt hiện tại.
- Host controls (pause, skip, reset).
- Ready status của player.

**Trang phòng đấu (build phase):**
- Danh sách nhân vật đã pick.
- Form chọn weapon, rarity, constellation, refinement.
- Preview cost realtime.
- Tổng cost và handicap.
- Nút lưu build.

**Trang kết quả:**
- Tổng cost Blue vs Red.
- Chênh lệch cost và handicap.
- Danh sách build chi tiết.
- Nút export ảnh.
- Link đến history/archive.

#### 19.3.2. Luồng tương tác người dùng

**Luồng tạo và tham gia phòng:**
```text
Host: Lobby → Tạo phòng → Cấu hình → Mời player → Chờ ready
Player: Nhận link → Vào phòng → Bấm ready → Chờ host start
```

**Luồng draft:**
```text
Host: Bấm Start Draft
System: Hiển thị lượt đầu tiên
Player (lượt): Chọn character → Submit
System: Broadcast → Chuyển lượt tiếp theo
... (lặp lại cho đến hết draft)
Host: Bấm Start Build Phase
```

**Luồng build:**
```text
Player: Chọn weapon → Chọn rarity → Chọn constellation → Chọn refinement
System: Tính cost realtime → Broadcast preview
Player: Bấm Lưu (hoặc auto-save)
Host: Kiểm tra cost → Bấm Finish Match
System: Chuyển sang Result page
```

### 19.4. Thiết kế realtime

#### 19.4.1. Cơ chế realtime

Hệ thống sử dụng **Supabase Realtime** để đồng bộ dữ liệu:

**Client-side store (Zustand):**
```typescript
draftStore {
  logs: DraftLog[]
  builds: CharacterBuild[]
  roomState: RoomState
  readyStatus: ReadyStatus
  previewSelections: PreviewSelection[]
  
  // Actions
  addLog(log)
  updateBuild(build)
  updateRoomState(state)
  updateReadyStatus(status)
  addPreviewSelection(preview)
}
```

**Realtime flow:**
1. Player thực hiện hành động (ban/pick/build).
2. Client gửi request đến API.
3. API validate và lưu vào database.
4. API broadcast event qua realtime channel.
5. Các client khác nhận event và update store.
6. UI tự động re-render.

#### 19.4.2. Xử lý conflict

**Optimistic update:**
- Client update UI ngay lập tức.
- Nếu API trả về lỗi, rollback UI.

**Last-write-wins:**
- Build phase cho phép player sửa nhiều lần.
- Lần lưu cuối cùng được giữ lại.

**Lock mechanism:**
- Draft phase chỉ cho phép player đúng lượt thao tác.
- Server validate lượt trước khi chấp nhận.

### 19.5. Thiết kế bảo mật

#### 19.5.1. Authentication

- Sử dụng **Supabase Auth** cho đăng nhập/đăng ký.
- Hỗ trợ email/password và OAuth providers.
- Session token được lưu trong cookie httpOnly.

#### 19.5.2. Authorization

**Role-based access control:**
- **Host**: tạo phòng, start/pause/reset, chuyển phase.
- **Player**: ban/pick khi đến lượt, chọn build cho team của mình.
- **Spectator**: chỉ xem, không thao tác.
- **Admin**: quản lý cost catalog, user, tournament.

**Permission checks:**
- Client-side: ẩn/hiện UI dựa trên role.
- Server-side: validate role trước khi thực hiện action.

#### 19.5.3. Data validation

- Validate input ở cả client và server.
- Sanitize user input để tránh XSS.
- Rate limiting cho API endpoints.
- CSRF protection cho form submissions.

### 19.6. Thiết kế cost catalog

#### 19.6.1. Cấu trúc cost catalog

```typescript
CostCatalog {
  defaultCharacterCost: {
    4: number  // Cost mặc định cho 4 sao
    5: number  // Cost mặc định cho 5 sao
  }
  constellationCost: number  // Cost mỗi cung mệnh
  defaultWeaponCost: {
    4: number
    5: number
  }
  characterOverrides: {
    [characterId]: number  // Cost riêng cho nhân vật
  }
  weaponOverrides: {
    [weaponId]: number  // Cost riêng cho vũ khí
  }
  refinementCost: number  // Cost mỗi refinement level
}
```

#### 19.6.2. Công thức tính cost

```typescript
characterCost = (characterOverride || defaultCharacterCost[rarity]) 
                + (constellation * constellationCost)

weaponCost = (weaponOverride || defaultWeaponCost[rarity])
             + ((refinement - 1) * refinementCost)

totalCost = characterCost + weaponCost
```

#### 19.6.3. Công thức tính handicap

```typescript
costDifference = abs(blueTotalCost - redTotalCost)
handicapSeconds = costDifference * costPerPoint

// Ví dụ: Blue 50 cost, Red 47 cost, costPerPoint = 10
// → Blue phải hoàn thành nhanh hơn Red 30 giây
```

### 19.7. Thiết kế mở rộng

#### 19.7.1. Plugin architecture

Hệ thống được thiết kế để dễ dàng thêm:
- Draft template mới (custom ban/pick order).
- Cost rule mới (custom cost calculation).
- Tournament format mới (Swiss, Round Robin).
- Notification provider mới (Discord, Telegram).

#### 19.7.2. Microservices potential

Trong tương lai có thể tách thành các service:
- **Room Service**: quản lý phòng và draft.
- **Build Service**: quản lý build và cost.
- **Tournament Service**: quản lý giải đấu.
- **Notification Service**: gửi thông báo.
- **Analytics Service**: thống kê và leaderboard.

#### 19.7.3. Caching strategy

- **Client-side**: cache character/weapon data trong localStorage.
- **Server-side**: cache cost catalog trong memory.
- **CDN**: cache static assets (images, fonts).
- **Database**: index các trường thường query (roomCode, userId).

### 19.8. Thiết kế testing

#### 19.8.1. Unit testing

- Test domain logic (DraftPolicy, CostPolicy).
- Test service layer (DraftService, BuildService).
- Test utility functions.

#### 19.8.2. Integration testing

- Test API endpoints.
- Test database operations.
- Test realtime synchronization.

#### 19.8.3. E2E testing

- Test luồng tạo phòng → draft → build → result.
- Test luồng tournament.
- Test các công cụ phụ trợ.

## 20. Xây dựng hệ thống

### 20.1. Quy trình phát triển

#### 20.1.1. Phương pháp phát triển

Dự án được phát triển theo phương pháp **Agile/Iterative**, chia thành các sprint ngắn:

**Sprint 1: Core Infrastructure (2 tuần)**
- Setup Next.js project với TypeScript.
- Cấu hình Prisma và database schema.
- Setup Supabase Auth và Realtime.
- Tạo kiến trúc thư mục cơ bản.

**Sprint 2: Room & Draft (3 tuần)**
- Implement room creation và management.
- Xây dựng draft phase với DraftPolicy.
- Tích hợp realtime cho draft logs.
- UI cho draft board và character selection.

**Sprint 3: Build & Cost (2 tuần)**
- Implement build phase với cost calculation.
- Xây dựng CostCatalog và CostPolicy.
- UI cho build selection và cost preview.
- Realtime build synchronization.

**Sprint 4: Result & Tools (2 tuần)**
- Trang result với export ảnh.
- Cost Calculator tool.
- Draft Simulator.
- Team Builder.

**Sprint 5: Tournament & Advanced (3 tuần)**
- Tournament system với bracket.
- History và Archive.
- Profile và stats.
- Notification system.

**Sprint 6: Polish & Deploy (1 tuần)**
- Bug fixes và optimization.
- Docker setup.
- Documentation.
- Deployment.

#### 20.1.2. Công cụ quản lý dự án

- **Version Control**: Git + GitHub
- **Task Management**: GitHub Issues/Projects
- **Communication**: Discord/Slack
- **Documentation**: Markdown files trong repo
- **CI/CD**: GitHub Actions (nếu có)

### 20.2. Triển khai các module chính

#### 20.2.1. Module quản lý phòng đấu

**Prisma Schema:**
```prisma
model Room {
  id              String   @id @default(cuid())
  code            String   @unique
  status          String   // WAITING, DRAFTING, BUILDING, FINISHED
  phase           String   // draft, build, result
  hostId          String?
  bluePlayerId    String?
  redPlayerId     String?
  draftTemplate   String   @default("standard")
  costPerPoint    Int      @default(10)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  draftLogs       DraftLog[]
  builds          CharacterBuild[]
}
```

**RoomService:**
```typescript
export class RoomService {
  async createRoom(hostId: string): Promise<Room> {
    const code = generateRoomCode()
    return await roomRepository.create({
      code,
      hostId,
      status: 'WAITING',
      phase: 'draft'
    })
  }
  
  async getRoomByCode(code: string): Promise<Room | null> {
    return await roomRepository.findByCode(code)
  }
  
  async updateRoomStatus(code: string, status: string): Promise<void> {
    await roomRepository.update(code, { status })
  }
}
```

#### 20.2.2. Module draft phase

**DraftPolicy:**
```typescript
export class DraftPolicy {
  getCurrentTurn(logs: DraftLog[], template: DraftTemplate): Turn {
    const step = logs.length
    const turnConfig = template.turns[step]
    
    return {
      step,
      team: turnConfig.team,
      action: turnConfig.action, // BAN or PICK
      total: template.turns.length
    }
  }
  
  validateDraftAction(
    room: Room,
    team: string,
    characterId: string,
    logs: DraftLog[]
  ): ValidationResult {
    const currentTurn = this.getCurrentTurn(logs, room.draftTemplate)
    
    if (currentTurn.team !== team) {
      return { valid: false, error: 'Not your turn' }
    }
    
    if (this.isCharacterAlreadyUsed(characterId, logs)) {
      return { valid: false, error: 'Character already banned/picked' }
    }
    
    return { valid: true }
  }
}
```

**DraftService:**
```typescript
export class DraftService {
  async submitDraft(
    roomCode: string,
    team: string,
    characterId: string,
    clientId: string
  ): Promise<DraftLog> {
    const room = await roomRepository.findByCode(roomCode)
    const logs = await draftLogRepository.findByRoom(roomCode)
    
    // Validate
    const validation = draftPolicy.validateDraftAction(
      room, team, characterId, logs
    )
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // Save log
    const log = await draftLogRepository.create({
      roomId: room.id,
      step: logs.length,
      team,
      action: getCurrentTurn(logs).action,
      characterId
    })
    
    // Broadcast realtime
    await realtimeService.broadcast(`draft:${roomCode}`, {
      type: 'DRAFT_LOG_ADDED',
      log
    })
    
    return log
  }
}
```

#### 20.2.3. Module build phase

**CostCatalog:**
```typescript
export class CostCatalog {
  private catalog: CostCatalogData
  
  calculateCharacterCost(
    characterId: string,
    rarity: number,
    constellation: number
  ): number {
    const baseCost = this.catalog.characterOverrides[characterId] 
      || this.catalog.defaultCharacterCost[rarity]
    
    const constellationCost = constellation * this.catalog.constellationCost
    
    return baseCost + constellationCost
  }
  
  calculateWeaponCost(
    weaponId: string,
    rarity: number,
    refinement: number
  ): number {
    const baseCost = this.catalog.weaponOverrides[weaponId]
      || this.catalog.defaultWeaponCost[rarity]
    
    const refinementCost = (refinement - 1) * this.catalog.refinementCost
    
    return baseCost + refinementCost
  }
  
  calculateTotalCost(build: CharacterBuild): number {
    const charCost = this.calculateCharacterCost(
      build.characterId,
      build.rarity,
      build.constellation
    )
    
    const weaponCost = this.calculateWeaponCost(
      build.weaponId,
      build.weaponRarity,
      build.refinement
    )
    
    return charCost + weaponCost
  }
}
```

**BuildService:**
```typescript
export class BuildService {
  async saveBuild(
    roomCode: string,
    team: string,
    characterId: string,
    buildData: BuildData
  ): Promise<CharacterBuild> {
    const room = await roomRepository.findByCode(roomCode)
    
    // Calculate cost
    const cost = costCatalog.calculateTotalCost({
      characterId,
      ...buildData
    })
    
    // Save build
    const build = await buildRepository.upsert({
      roomId: room.id,
      team,
      characterId,
      ...buildData,
      cost
    })
    
    // Broadcast preview
    await realtimeService.broadcast(`build:${roomCode}`, {
      type: 'BUILD_UPDATED',
      build
    })
    
    return build
  }
  
  async calculateHandicap(roomCode: string): Promise<HandicapResult> {
    const room = await roomRepository.findByCode(roomCode)
    const builds = await buildRepository.findByRoom(roomCode)
    
    const blueCost = builds
      .filter(b => b.team === 'blue')
      .reduce((sum, b) => sum + b.cost, 0)
    
    const redCost = builds
      .filter(b => b.team === 'red')
      .reduce((sum, b) => sum + b.cost, 0)
    
    const costDiff = Math.abs(blueCost - redCost)
    const handicapSeconds = costDiff * room.costPerPoint
    
    return {
      blueCost,
      redCost,
      costDiff,
      handicapSeconds,
      higherTeam: blueCost > redCost ? 'blue' : 'red'
    }
  }
}
```

#### 20.2.4. Module realtime

**RealtimeService:**
```typescript
export class RealtimeService {
  private supabase: SupabaseClient
  
  async broadcast(channel: string, payload: any): Promise<void> {
    await this.supabase
      .channel(channel)
      .send({
        type: 'broadcast',
        event: payload.type,
        payload
      })
  }
  
  subscribe(
    channel: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    return this.supabase
      .channel(channel)
      .on('broadcast', { event: '*' }, callback)
      .subscribe()
  }
}
```

**Client-side Store (Zustand):**
```typescript
export const useDraftStore = create<DraftStore>((set) => ({
  logs: [],
  builds: [],
  roomState: null,
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, log]
  })),
  
  updateBuild: (build) => set((state) => ({
    builds: state.builds.map(b => 
      b.id === build.id ? build : b
    )
  })),
  
  updateRoomState: (roomState) => set({ roomState })
}))
```

### 20.3. Triển khai giao diện người dùng

#### 20.3.1. Component chính

**DraftBoard Component:**
```typescript
export function DraftBoard({ roomCode }: Props) {
  const { logs, addLog } = useDraftStore()
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  
  useEffect(() => {
    // Subscribe to realtime
    const channel = realtimeService.subscribe(
      `draft:${roomCode}`,
      (payload) => {
        if (payload.type === 'DRAFT_LOG_ADDED') {
          addLog(payload.log)
        }
      }
    )
    
    return () => channel.unsubscribe()
  }, [roomCode])
  
  const handleSubmit = async () => {
    if (!selectedChar) return
    
    await draftService.submitDraft(
      roomCode,
      currentTeam,
      selectedChar,
      clientId
    )
    
    setSelectedChar(null)
  }
  
  return (
    <div className="draft-board">
      <DraftLogs logs={logs} />
      <CharacterGrid 
        onSelect={setSelectedChar}
        selected={selectedChar}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

**BuildBoard Component:**
```typescript
export function BuildBoard({ roomCode, team }: Props) {
  const { builds, updateBuild } = useDraftStore()
  const [localBuilds, setLocalBuilds] = useState<BuildData[]>([])
  
  const handleBuildChange = async (
    characterId: string,
    buildData: BuildData
  ) => {
    // Optimistic update
    setLocalBuilds(prev => 
      prev.map(b => b.characterId === characterId ? buildData : b)
    )
    
    // Save to server
    try {
      const build = await buildService.saveBuild(
        roomCode,
        team,
        characterId,
        buildData
      )
      updateBuild(build)
    } catch (error) {
      // Rollback on error
      console.error(error)
    }
  }
  
  return (
    <div className="build-board">
      {pickedCharacters.map(char => (
        <BuildForm
          key={char.id}
          character={char}
          onChange={(data) => handleBuildChange(char.id, data)}
        />
      ))}
      <CostSummary builds={builds} />
    </div>
  )
}
```

#### 20.3.2. Styling

Dự án sử dụng **Tailwind CSS** kết hợp với **CSS Modules** cho styling:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-blue: #3b82f6;
  --color-red: #ef4444;
  --color-bg: #0f172a;
  --color-card: #1e293b;
}

.draft-board {
  @apply grid grid-cols-3 gap-4 p-4;
}

.character-card {
  @apply bg-card rounded-lg p-4 hover:scale-105 transition;
}
```

### 20.4. Triển khai Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    volumes:
      - ./data:/app/data
```

### 20.5. Testing và Quality Assurance

#### 20.5.1. Unit Tests

```typescript
// DraftPolicy.test.ts
describe('DraftPolicy', () => {
  it('should return correct current turn', () => {
    const policy = new DraftPolicy()
    const logs = []
    const template = standardTemplate
    
    const turn = policy.getCurrentTurn(logs, template)
    
    expect(turn.step).toBe(0)
    expect(turn.team).toBe('blue')
    expect(turn.action).toBe('BAN')
  })
  
  it('should validate draft action correctly', () => {
    const policy = new DraftPolicy()
    const room = mockRoom()
    const logs = []
    
    const result = policy.validateDraftAction(
      room,
      'blue',
      'character-1',
      logs
    )
    
    expect(result.valid).toBe(true)
  })
})
```

#### 20.5.2. Integration Tests

```typescript
// draft.api.test.ts
describe('POST /api/draft', () => {
  it('should submit draft successfully', async () => {
    const room = await createTestRoom()
    
    const response = await fetch('/api/draft', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: room.code,
        team: 'blue',
        characterId: 'character-1'
      })
    })
    
    expect(response.status).toBe(200)
    const log = await response.json()
    expect(log.characterId).toBe('character-1')
  })
})
```

### 20.6. Deployment

#### 20.6.1. Môi trường production

**Yêu cầu:**
- Node.js 18+
- PostgreSQL database
- Supabase project (cho Auth và Realtime)

**Các bước deploy:**

1. **Setup database:**
```bash
npx prisma migrate deploy
```

2. **Build application:**
```bash
npm run build
```

3. **Start production server:**
```bash
npm start
```

4. **Hoặc dùng Docker:**
```bash
docker compose up -d
```

#### 20.6.2. Environment variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
COST_CATALOG_PATH=./data/cost-catalog.json
```

## 21. Kết luận và hướng phát triển

### 21.1. Tổng kết dự án

Website Ban/Pick Genshin Impact đã được xây dựng thành công với đầy đủ các tính năng chính:

**Các tính năng đã hoàn thành:**
- ✅ Quản lý phòng đấu với role host/player/spectator
- ✅ Draft phase với realtime synchronization
- ✅ Build phase với cost calculation và handicap
- ✅ Cost catalog global với khả năng override
- ✅ Result page với export ảnh
- ✅ Tournament system với bracket
- ✅ History và Archive
- ✅ Profile và stats
- ✅ Các công cụ phụ trợ (Calculator, Simulator, Builder)
- ✅ Docker deployment

**Kiến trúc và công nghệ:**
- Kiến trúc tách lớp rõ ràng (Presentation, Application, Domain, Infrastructure)
- Next.js App Router với TypeScript
- Prisma ORM với PostgreSQL
- Supabase Auth và Realtime
- Tailwind CSS cho styling
- Zustand cho state management

**Điểm mạnh của hệ thống:**
- Domain logic độc lập, dễ test và maintain
- Realtime experience mượt mà
- Phân quyền rõ ràng, bảo mật tốt
- Dễ mở rộng thêm tính năng mới
- Docker giúp deploy dễ dàng

### 21.2. Những thách thức đã gặp

**Thách thức kỹ thuật:**
- Đồng bộ realtime giữa nhiều client
- Xử lý conflict khi nhiều người thao tác cùng lúc
- Tính cost chính xác với nhiều rule phức tạp
- Quản lý state phức tạp trong draft/build phase

**Giải pháp:**
- Sử dụng Supabase Realtime với broadcast channels
- Implement optimistic updates và rollback
- Tách CostCatalog thành domain logic riêng
- Sử dụng Zustand store với actions rõ ràng

### 21.3. Hướng phát triển tương lai

#### 21.3.1. Tính năng mới

**Ngắn hạn (1-3 tháng):**
- Admin dashboard đầy đủ hơn
- Overlay cho stream production
- Mobile app (React Native)
- Discord bot integration
- Webhook notifications

**Trung hạn (3-6 tháng):**
- AI-powered draft suggestions
- Advanced analytics và insights
- Replay system
- Custom tournament formats
- Team management system

**Dài hạn (6-12 tháng):**
- Multi-game support (Honkai, ZZZ)
- Esports tournament platform
- Monetization features
- API cho third-party integrations
- Machine learning cho meta analysis

#### 21.3.2. Cải tiến kỹ thuật

**Performance:**
- Implement caching layer (Redis)
- Optimize database queries
- CDN cho static assets
- Server-side rendering optimization

**Scalability:**
- Microservices architecture
- Load balancing
- Database sharding
- Message queue (RabbitMQ/Kafka)

**Developer Experience:**
- Automated testing (unit, integration, E2E)
- CI/CD pipeline
- Monitoring và logging (Sentry, DataDog)
- API documentation (Swagger)

#### 21.3.3. Business Development

**Community Building:**
- Official Discord server
- Tutorial videos và guides
- Community tournaments
- Feedback system

**Partnerships:**
- Collaboration với streamers
- Partnership với tournament organizers
- Integration với gaming platforms

### 21.4. Kết luận cuối cùng

Dự án Website Ban/Pick Genshin Impact đã đạt được mục tiêu ban đầu là xây dựng một hệ thống hỗ trợ tổ chức trận đấu chuyên nghiệp với đầy đủ các tính năng cần thiết. Kiến trúc tách lớp và domain-driven design giúp hệ thống dễ bảo trì và mở rộng.

Với nền tảng vững chắc đã được xây dựng, dự án có tiềm năng phát triển thành một platform lớn hơn phục vụ cộng đồng game Genshin Impact và có thể mở rộng sang các game khác trong tương lai.

**Bài học kinh nghiệm:**
- Tách biệt domain logic giúp code dễ test và maintain
- Realtime synchronization cần được thiết kế cẩn thận
- Documentation tốt giúp onboarding nhanh hơn
- User feedback là chìa khóa để cải thiện sản phẩm

**Lời cảm ơn:**
Cảm ơn cộng đồng Genshin Impact đã đóng góp ý kiến và feedback trong quá trình phát triển. Dự án này không thể thành công nếu không có sự hỗ trợ từ cộng đồng.
