import Link from "next/link";
import { ArrowRight, Bell, Gauge, Globe, Swords, Trophy, Users } from "lucide-react";
import { services } from "@/composition/services";
import { HomeClient } from "@/components/HomeClient";
import { HowItWorks } from "@/components/HowItWorks";

const heroStats = [
  { label: "Cấm/chọn", value: "Realtime Draft" },
  { label: "Luật giải đấu", value: "6 Ban + 16 Pick" },
  { label: "Tự động hoá", value: "Cost & Handicap" },
];

const features = [
  {
    title: "Realtime Draft",
    desc: "Cấm/chọn luân phiên 6 ban + 16 pick realtime mượt mà, hỗ trợ delay cho khán giả.",
    Icon: Swords,
  },
  {
    title: "Tự động tính Cost",
    desc: "Tự động tính tổng cost đội hình và thời gian handicap chuẩn xác từng giây.",
    Icon: Gauge,
  },
  {
    title: "Giải đấu BO1/BO3/BO5",
    desc: "Quản lý chuỗi trận chuyên nghiệp, ghi nhận tỷ số và trạng thái trận tự động.",
    Icon: Trophy,
  },
  {
    title: "90+ Nhân vật",
    desc: "Cập nhật toàn bộ nhân vật Genshin Impact kèm hình ảnh thẻ chất lượng cao.",
    Icon: Users,
  },
  {
    title: "Đa nền tảng",
    desc: "Giao diện responsive, tối ưu hiển thị mượt trên PC, máy tính bảng và điện thoại.",
    Icon: Globe,
  },
  {
    title: "Discord Webhook",
    desc: "Tự động thông báo thời điểm bắt đầu trận và kết quả chung cuộc về Discord của bạn.",
    Icon: Bell,
  },
];

const supportItems = [
  "90+ Nhân vật Genshin Impact",
  "Hỗ trợ 5 ngôn ngữ",
  "Tích hợp Discord Webhook",
  "Hoàn toàn miễn phí",
];

export default async function HomePage() {
  const user = await services.auth.getCurrentUserRecord();

  return (
    <main id="main" className="home-page">
      <div className="home-shell" aria-labelledby="home-title">
        <section className="home-hero">
          <div className="home-hero__icon">
            <Swords size={24} />
          </div>
          <p className="home-hero__eyebrow">Genshin Impact Draft Tool</p>
          <h1 id="home-title" className="home-hero__title">Ban/Pick La Hoàn Cảnh Giới</h1>
          <p className="home-hero__subtitle">
            Công cụ ban/pick realtime cho giải đấu và trận giao hữu Genshin Impact. Tự động tính cost và thời gian handicap.
          </p>

          <div className="home-hero__actions">
            <Link href="/lobby" className="btn-primary">
              Bắt đầu ngay
              <ArrowRight size={16} />
            </Link>
            <Link href="/guide" className="btn-outline">
              Hướng dẫn sử dụng
            </Link>
          </div>

          <div className="home-stats" aria-label="Tính năng nổi bật">
            {heroStats.map((item) => (
              <div key={item.label} className="home-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="home-actions" aria-labelledby="start-title">
          <p className="home-section-label">Khởi đầu nhanh</p>
          <h2 id="start-title" className="home-actions__title">Chọn vai trò để bắt đầu</h2>
          <p className="home-actions__subtitle">
            Trọng tài: tạo phòng, thiết lập luật và điều hành lượt cấm/chọn. Tuyển thủ: vào sảnh chờ và nhận lời mời từ trọng tài.
          </p>
          <HomeClient
            authenticated={Boolean(user)}
            userEmail={user?.email ?? null}
            userName={user?.name ?? null}
            userRole={user?.role ?? null}
          />
        </section>

        <HowItWorks />

        <section className="home-links" aria-labelledby="features-title">
          <div className="home-links__header">
            <p className="home-section-label">Đầy đủ tính năng</p>
            <h2 id="features-title">Tại sao chọn Genshin Ban/Pick?</h2>
          </div>
          <div className="home-links__grid">
            {features.map(({ title, desc, Icon }) => (
              <div key={title} className="home-link-card">
                <Icon size={20} />
                <span>{title}</span>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-stats-banner" aria-label="Tóm tắt hệ thống">
          {supportItems.map((item) => (
            <div key={item} className="home-stats-banner__item">
              <span className="home-stats-banner__bullet" />
              <span>{item}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
