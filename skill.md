KỸ NĂNG 1: QUẢN LÝ "TÍNH NHẤT QUÁN" (CONSISTENCY & BRANDING)
Giảng viên chấm web rất ghét sự lộn xộn. Web phải có "bản sắc" riêng.

1.1. Skill xây dựng Bảng màu (Color Palette) chuẩn Gaming:

Áp dụng: Bạn cần chọn ra 5-7 màu chủ đạo và dùng nhất quán thông qua Tailwind config.

Công thức gợi ý:

Nền (Background): Dùng màu xám cực tối (#0b0c10) hoặc xanh đen tối (#101524), thay vì màu đen tuyệt đối.

Hành động chính (Primary Accents): Dùng màu sắc rực rỡ đặc trưng game (VD: Xanh ngọc #66FCF1 hoặc Vàng kim #F7C948).

Màu đội: Giữ nguyên Xanh (Blue) vs Đỏ (Red) nhưng chọn tông màu dễ nhìn, không quá chói.

1.2. Skill quản lý Kiểu chữ (Typography) phân cấp rõ ràng:

Áp dụng: Đừng dùng font mặc định. Hãy chọn một Font chuyên nghiệp cho Web (VD: Inter, Roboto, Montserrat).

Phân cấp (Hierarchy):

H1 (Tên phòng): Lớn, đậm.

H2 (Tên đội, Phase cấm chọn): Vừa, đậm.

Body (Tên tướng, chat): Nhỏ hơn, dễ đọc.

KỸ NĂNG 2: BỐ CỤC & ĐÁP ỨNG (LAYOUT & RESPONSIVENESS)
Đây là kỹ năng kỹ thuật-thiết kế quan trọng nhất để giảng viên đánh giá cao.

2.1. Skill thiết kế MOBA Layout (Layout đối đầu):

Áp dụng: Sửa bố cục nằm ngang hiện tại sang bố cục dọc như tôi đã đề xuất.

Cấu trúc: Flexbox/Grid chia 3 cột:

[Đội Xanh] --- [Pool Tướng Giữa] --- [Đội Đỏ]

Lý do: Giúp người xem dễ so sánh đội hình, màn hình trông "chạy" đều, không bị trống trải.

2.2. Skill thiết kế Đáp ứng (Responsive Design - bắt buộc):

Áp dụng: Dù đây là web chơi trên PC là chính, giảng viên SẼ dùng điện thoại để test. Web phải hiển thị được trên Mobile.

Skill cụ thể: Biết cách dùng Tailwind breakpoints (sm:, md:, lg:) để chuyển đổi bố cục:

PC: Layout 3 cột ngang.

Mobile: Layout 1 cột, xếp chồng lên nhau (Pool tướng trên, đội xanh giữa, đỏ dưới).

KỸ NĂNG 3: TRẢI NGHIỆM TƯƠNG TÁC (UX & MICRO-INTERACTIONS)
Đây là skill tạo nên hiệu ứng "Wow" và chứng minh web của bạn là real-time trơn tru.

3.1. Skill thiết kế Phản hồi trạng thái (State Feedback):

Áp dụng: Khi một tướng bị cấm, nó không chỉ biến mất. Nó phải:

Làm mờ (grayscale).

Có dấu gạch chéo.

Opacity giảm (VD: 30%).

Khóa không cho click.

3.2. Skill Highlight lượt thi đấu (Turn Highlighting):

Áp dụng: Bên nào đang đến lượt chọn, khu vực ô Pick của bên đó phải nhấp nháy mờ (pulse) hoặc có đường viền màu rực rỡ đè lên. Chữ thông báo Phase phải đổi màu theo đội.

3.3. Skill sử dụng Hiệu ứng chuyển cảnh (Transitions):

Áp dụng: Dùng Tailwind transitions cho các hành động hover chuột. Khi tướng được pick, nó không "xuất hiện bụp một phát", mà nên "trượt nhẹ" vào ô.

KỸ NĂNG 4: THIẾT KẾ DÀNH CHO GAME (GAME-SPECIFIC DESIGN)
Kỹ năng này giúp web của bạn trông "ra chất" Genshin Impact.

4.1. Skill quản lý Thông tin trực quan (Visual Info):

Áp dụng:

Tên nhân vật: Bố trí gọn gàng dưới avatar.

Nguyên tố: Có icon nhỏ góc avatar hoặc dùng viền màu theo nguyên tố (Pyro - Đỏ, Hydro - Xanh...).

Độ hiếm (Stars): Dùng màu nền vàng (5 star) hoặc tím (4 star) phía sau avatar.

4.2. Skill tối ưu hóa Card nhân vật (Character Cards):

Áp dụng: Sửa các card tướng to hiện tại thành lưới icon gọn gàng để hiển thị được nhiều tướng hơn.

4.3. Skill SFX & Âm thanh:

Áp dụng: Âm thanh là design cho tai. Cài đặt hiệu ứng âm thanh nhẹ khi Ban, Pick, hết giờ.

KỸ NĂNG 5: THIẾT KẾ TÀI LIỆU (DESIGN DOCUMENTATION)
Kỹ năng này giúp bạn nộp báo cáo "chuẩn chỉnh" và lấy điểm tối đa phần lý thuyết.

5.1. Skill xây dựng Design System/Style Guide:

Áp dụng: Trong báo cáo, hãy dành 1 trang để liệt kê:

Bảng màu đã dùng (kèm mã Hex).

Kiểu font chữ, kích thước cho từng loại tiêu đề.

Các icon dùng trong hệ thống.

Lý do: Giảng viên thấy bạn có kế hoạch thiết kế, không phải code "bạ đâu làm đấy".
