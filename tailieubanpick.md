# TÀI LIỆU PHÂN TÍCH HỆ THỐNG: WEBSITE BAN/PICK GENSHIN IMPACT LA HOÀN CẢNH GIỚI

## 1. Tổng quan dự án

### 1.1. Bối cảnh và lý do chọn đề tài
Genshin Impact là một trò chơi phổ biến toàn cầu với hệ thống nhân vật và cơ chế chiến đấu phong phú. Trong cộng đồng người chơi, việc tổ chức các giải đấu eSports tự phát (như leo La Hoàn Cảnh Giới) đang ngày càng phát triển. Tuy nhiên, việc cấm/chọn (Ban/Pick) nhân vật và tính toán điểm số trang bị (Cost) hay thời gian bù trừ (Handicap) hiện tại chủ yếu được thực hiện thủ công qua các bảng tính Excel hoặc các phần mềm không chuyên. Điều này gây mất thời gian, thiếu tính chuyên nghiệp và dễ xảy ra sai sót. 
Xuất phát từ nhu cầu thực tế đó, đề tài "Xây dựng website Ban/Pick Genshin Impact La Hoàn Cảnh Giới" được thực hiện nhằm cung cấp một công cụ chuyên dụng, tự động hóa toàn bộ quy trình cấm/chọn và tính toán điểm số cho các giải đấu cộng đồng.

### 1.2. Mô tả dự án
Dự án là một ứng dụng web thời gian thực (real-time) hỗ trợ ban tổ chức và người chơi thực hiện quy trình Ban/Pick nhân vật trực tuyến. Hệ thống cho phép: tạo phòng thi đấu với mã riêng, thực hiện các lượt cấm/chọn luân phiên giữa Đội Xanh và Đội Đỏ, khai báo trang bị (cung mệnh, độ hiếm vũ khí) cho từng nhân vật, và tự động tính toán tổng điểm (Cost) cũng như thời gian bù trừ (Time Handicap) công bằng dựa trên luật chơi đã được thống nhất.

### 1.3. Đối tượng người dùng
- **Ban tổ chức / Trọng tài**: Người tạo phòng, thiết lập luật chơi (quy đổi thời gian bù trừ cho mỗi cost), theo dõi và quản lý quá trình thi đấu.
- **Tuyển thủ (Đội Xanh / Đội Đỏ)**: Những người tham gia trực tiếp vào quá trình cấm chọn nhân vật và khai báo trang bị thi đấu.
- **Khán giả**: Những người theo dõi trực tiếp diễn biến của các lượt Ban/Pick và kết quả tính điểm của hai đội.

### 1.4. Công nghệ sử dụng
| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend Framework** | Next.js (App Router) |
| **Ngôn ngữ lập trình** | TypeScript |
| **UI Framework** | Tailwind CSS |
| **Quản lý State** | Zustand |
| **Backend & API** | Next.js API Routes (Serverless) |
| **Cơ sở dữ liệu** | PostgreSQL |
| **ORM** | Prisma |
| **Real-time** | Supabase Realtime (WebSockets) |
| **Dữ liệu nhân vật** | Genshin.dev API |
| **Triển khai** | Vercel |

### 1.5. Phạm vi dự án
Dự án tập trung xây dựng phiên bản web (hỗ trợ responsive trên nhiều thiết bị) chuyên biệt cho quy trình Cấm/Chọn 16 nhân vật trong tựa game Genshin Impact. Hệ thống cung cấp tính toán tự động các thông số Cost và Handicap dựa trên luật chơi cố định. Giai đoạn hiện tại không bao gồm việc tích hợp API trực tiếp từ tài khoản game của người chơi (dữ liệu vũ khí/cung mệnh do người chơi tự khai báo trung thực).

---

## 2. Mục tiêu

### 2.1. Mục tiêu tổng quát
Xây dựng thành công một nền tảng web trực quan, chuyên nghiệp và hoạt động ổn định theo thời gian thực để hỗ trợ tổ chức các giải đấu Genshin Impact, giúp chuẩn hóa và tự động hóa toàn bộ quy trình Ban/Pick phức tạp thay cho phương pháp thủ công truyền thống.

### 2.2. Mục tiêu về sản phẩm
- Cung cấp tính năng tạo phòng và quản lý phiên cấm/chọn một cách dễ dàng, bảo mật quyền truy cập qua mã phòng.
- Đảm bảo quy trình cấm (6 lượt) và chọn (16 lượt) diễn ra đúng trình tự, đồng bộ hóa lập tức (real-time) giữa tất cả những người tham gia.
- Cung cấp biểu mẫu khai báo sức mạnh nhân vật (Cung mệnh, cấp bậc Vũ khí) trực quan và hệ thống tự động tính điểm Cost chuẩn xác.
- Tự động tính toán mức điểm bù trừ thời gian (Time Handicap) để ban tổ chức dễ dàng áp dụng hình phạt thời gian vào trận đấu thực tế.
- Giao diện người dùng hiện đại, mang đậm phong cách eSports với các hiệu ứng âm thanh và hình ảnh sinh động.

### 2.3. Mục tiêu về công nghệ
- Làm chủ kiến trúc Next.js App Router và mô hình Serverless API.
- Tích hợp, thiết kế và vận hành cơ sở dữ liệu PostgreSQL thông qua Prisma ORM.
- Áp dụng thành thạo Supabase Realtime để đồng bộ dữ liệu đa luồng, đảm bảo trải nghiệm tương tác không độ trễ.
- Nắm vững việc quản lý state linh hoạt trên client với Zustand và xây dựng UI phức tạp, đẹp mắt bằng Tailwind CSS.

---

## 3. Chức năng

| STT | Chức năng | Mô tả |
| :---: | :--- | :--- |
| **1** | **Quản trị & Xác thực** *(Mở rộng)* | - **Phân quyền người dùng:** Cung cấp tài khoản quản trị (Admin/Trọng tài) để quản lý các phòng thi đấu. Người chơi và khán giả tham gia qua mã phòng.<br>- **Quản lý danh sách tướng:** Cho phép Admin cập nhật nhân vật mới khi game Genshin Impact có phiên bản mới. |
| **2** | **Quản lý Phòng thi đấu (Room)** | - **Tạo phòng tùy biến:** Cài đặt luật thi đấu riêng như tỷ lệ quy đổi thời gian (10s, 15s cho 1 Cost), tổng thời gian mỗi lượt.<br>- **Cơ chế truy cập:** Phân luồng vai trò khi nhập mã (Đội Xanh, Đội Đỏ, Khán giả) để đảm bảo tính minh bạch. |
| **3** | **Bộ đếm thời gian (Draft Timer)** | - **Thời gian đếm ngược:** Mỗi lượt Ban/Pick được giới hạn thời gian (VD: 90 giây).<br>- **Cảnh báo hình ảnh/âm thanh:** Vòng đếm ngược (timer ring) chuyển màu cảnh báo (xanh -> vàng -> đỏ) khi sắp hết giờ để thúc giục tuyển thủ. |
| **4** | **Cấm và Chọn (Ban/Pick)** | - **Quy trình chuẩn eSports:** Hệ thống tự động chuyển quyền giữa 2 đội tuân thủ cấu trúc 4 Phase (6 lượt cấm, 16 lượt chọn luân phiên).<br>- **Đồng bộ Real-time:** Mọi thao tác lập tức hiển thị trên tất cả thiết bị tham gia thông qua Supabase WebSockets.<br>- **Validation chặt chẽ:** Ngăn chặn việc chọn nhân vật đã bị cấm hoặc nhân vật đã được đối phương khóa. |
| **5** | **Lọc và Tra cứu nhân vật (Filter/Search)** | - **Thanh tìm kiếm:** Cho phép nhập từ khóa tìm nhanh nhân vật trong bể tướng (Character Pool).<br>- **Bộ lọc trạng thái:** Nhanh chóng lọc danh sách tướng theo các trạng thái: Khả dụng (Available), Đã Cấm (Banned), Đã Chọn (Picked) để tối ưu chiến thuật. |
| **6** | **Khai báo trang bị (Builds)** | - **Form trực quan:** Giao diện nhập thông số sức mạnh cho 8 nhân vật: độ hiếm nhân vật (4/5 sao), mức Cung mệnh (C0-C6), độ hiếm vũ khí (4/5 sao).<br>- **Lưu trữ bảo mật:** Lưu an toàn cấu hình đội hình, đảm bảo tính công bằng trước khi công bố tính toán cuối cùng. |
| **7** | **Tính toán Cost & Handicap** | - **Thuật toán tự động:** Điểm Cost được tính theo luật: +1 Cost cho mỗi xác 5 sao, cung mệnh 5 sao, hoặc vũ khí 5 sao.<br>- **Bù trừ thời gian (Handicap):** Tự động so sánh Cost 2 đội và xuất ra số giây phạt (Đội mạnh hơn phải hoàn thành La Hoàn sớm hơn). |
| **8** | **Hiệu ứng thính thị (Audio & Visuals)** | - **Giao diện Glassmorphism:** Thiết kế cao cấp, mờ viền, phân biệt rõ hai khu vực Đội Xanh (Blue side) và Đội Đỏ (Red side).<br>- **Phản hồi âm thanh:** Có các tệp âm thanh riêng biệt cho từng hành động (Ban Sound, Pick Sound, Error, Click) nhằm tăng tính kịch tính. |
| **9** | **Tổng kết & Xuất kết quả (Match Result)** | - **Bảng tổng sắp:** Trang kết quả trình bày cái nhìn toàn cảnh về lựa chọn của hai đội và mức Handicap chung cuộc.<br>- **Lịch sử trận đấu:** Dữ liệu lưu trong database cho phép trọng tài và khán giả tra cứu lại (review) sau khi trận đấu kết thúc. |
