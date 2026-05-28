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

## 19. Kết luận

Website Ban/Pick Genshin Impact là một hệ thống hỗ trợ tổ chức trận đấu có đầy đủ các phần: tạo phòng, mời player, điều phối draft, chọn build, tính cost, tính handicap, tổng kết và lưu lịch sử. Dự án được xây dựng theo kiến trúc tách lớp, sử dụng Next.js, React, Prisma, Supabase realtime và Docker.

Nhờ việc tách rõ domain logic, service layer và UI component, dự án có thể tiếp tục mở rộng cho giải đấu, stream overlay, thống kê nâng cao hoặc các luật ban/pick phức tạp hơn trong tương lai.
