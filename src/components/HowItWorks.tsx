import { Home, UserPlus, Swords, Trophy, type LucideIcon } from "lucide-react";

type Step = {
  number: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  color: "amber" | "cyan" | "purple" | "emerald";
};

const steps: Step[] = [
  {
    number: "01",
    Icon: Home,
    title: "Tạo phòng",
    description: "Trọng tài đăng nhập, chọn luật thi đấu và tạo phòng mới.",
    color: "amber",
  },
  {
    number: "02",
    Icon: UserPlus,
    title: "Mời Player",
    description: "Player đăng ký UID ở sảnh chờ, trọng tài mời vào 2 đội.",
    color: "cyan",
  },
  {
    number: "03",
    Icon: Swords,
    title: "Draft Ban/Pick",
    description: "6 lượt cấm + 16 lượt chọn nhân vật luân phiên realtime.",
    color: "purple",
  },
  {
    number: "04",
    Icon: Trophy,
    title: "Kết quả",
    description: "Khai báo build, tự động tính Cost và thời gian handicap.",
    color: "emerald",
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-it-works__header">
        <div className="divider" />
        <p className="how-it-works__label">Quy trình thi đấu</p>
        <div className="divider" />
      </div>

      <div className="how-it-works__grid">
        {steps.map(({ number, Icon, title, description, color }) => (
          <div key={number} className="how-it-works__step">
            <div className="how-it-works__step-top">
              <div className={`how-it-works__icon how-it-works__icon--${color}`}>
                <Icon size={16} />
              </div>
              <span className="how-it-works__number">{number}</span>
            </div>
            <h3 className="how-it-works__title">{title}</h3>
            <p className="how-it-works__desc">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
