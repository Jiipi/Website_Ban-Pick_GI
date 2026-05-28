import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  Compass,
  FileText,
  Gauge,
  Globe,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Newspaper,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Sword,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  description?: string;
  Icon?: LucideIcon;
};

export type NavGroup = {
  title: string;
  description?: string;
  links: NavLink[];
};

export const PRIMARY_NAV: NavLink[] = [
  { href: "/tournaments", label: "Giải đấu", Icon: Trophy },
  { href: "/characters", label: "Nhân vật", Icon: Users },
  { href: "/meta", label: "Meta", Icon: Gauge },
  { href: "/leaderboard", label: "Xếp hạng", Icon: Trophy },
];

export const TOOLS_LINKS: NavLink[] = [
  {
    href: "/tools/draft-simulator",
    label: "Draft Simulator",
    description: "Giả lập lượt cấm/chọn để luyện chiến thuật",
    Icon: Swords,
  },
  {
    href: "/tools/cost-calculator",
    label: "Cost Calculator",
    description: "Tính tổng cost và thời gian handicap",
    Icon: Calculator,
  },
  {
    href: "/tools/cost-catalog",
    label: "Cost Catalog",
    description: "Sửa file cost global cho toàn web",
    Icon: Settings,
  },
  {
    href: "/tools/team-builder",
    label: "Team Builder",
    description: "Dựng đội hình và kiểm tra cộng hưởng",
    Icon: Users,
  },
  {
    href: "/tools/character-randomizer",
    label: "Character Randomizer",
    description: "Random nhân vật cho luyện tập",
    Icon: Sparkles,
  },
  {
    href: "/tools/abyss-tracker",
    label: "Abyss Tracker",
    description: "Theo dõi tiến độ La Hoàn Cảnh Giới",
    Icon: Target,
  },
];

export const RESOURCES_LINKS: NavLink[] = [
  {
    href: "/guide",
    label: "Hướng dẫn",
    description: "Hướng dẫn sử dụng tổng quan",
    Icon: BookOpen,
  },
  {
    href: "/tutorial",
    label: "Học cách dùng",
    description: "Tutorial từng bước cho người mới",
    Icon: Compass,
  },
  {
    href: "/rules",
    label: "Luật thi đấu",
    description: "Format và luật ban/pick chuẩn",
    Icon: Shield,
  },
  {
    href: "/patch-notes",
    label: "Patch Notes",
    description: "Thay đổi và cập nhật mới",
    Icon: Newspaper,
  },
  {
    href: "/api-docs",
    label: "API Docs",
    description: "Tài liệu kỹ thuật",
    Icon: FileText,
  },
  {
    href: "/feedback",
    label: "Góp ý & Báo lỗi",
    description: "Gửi phản hồi cho chúng tôi",
    Icon: MessageSquare,
  },
  {
    href: "/status",
    label: "Trạng thái hệ thống",
    description: "Tình trạng dịch vụ realtime",
    Icon: ShieldCheck,
  },
];

export const ACCOUNT_LINKS: NavLink[] = [
  { href: "/feed", label: "Bảng tin", Icon: Newspaper },
  { href: "/friends", label: "Bạn bè", Icon: Users },
  { href: "/missions", label: "Nhiệm vụ", Icon: ListChecks },
  { href: "/achievements", label: "Thành tựu", Icon: Trophy },
  { href: "/history", label: "Lịch sử", Icon: History },
  { href: "/archive", label: "Kho trận", Icon: LayoutDashboard },
  { href: "/settings", label: "Cài đặt", Icon: Settings },
];

export const HEADER_GROUPS: NavGroup[] = [
  { title: "Công cụ", links: TOOLS_LINKS },
  { title: "Tài nguyên", links: RESOURCES_LINKS },
];

export const FOOTER_GROUPS: NavGroup[] = [
  {
    title: "Sản phẩm",
    links: [
      { href: "/lobby", label: "Vào sảnh chờ", Icon: Sword },
      { href: "/tournaments", label: "Giải đấu", Icon: Trophy },
      { href: "/characters", label: "Nhân vật", Icon: Users },
      { href: "/weapons", label: "Vũ khí", Icon: Sword },
      { href: "/meta", label: "Phân tích Meta", Icon: Gauge },
    ],
  },
  {
    title: "Công cụ",
    links: TOOLS_LINKS.slice(0, 5),
  },
  {
    title: "Tài nguyên",
    links: [
      { href: "/guide", label: "Hướng dẫn", Icon: BookOpen },
      { href: "/rules", label: "Luật thi đấu", Icon: Shield },
      { href: "/patch-notes", label: "Patch Notes", Icon: Newspaper },
      { href: "/feedback", label: "Góp ý & Báo lỗi", Icon: LifeBuoy },
      { href: "/status", label: "Trạng thái hệ thống", Icon: ShieldCheck },
    ],
  },
  {
    title: "Pháp lý",
    links: [
      { href: "/about", label: "Giới thiệu", Icon: Globe },
      { href: "/privacy", label: "Chính sách bảo mật", Icon: ShieldCheck },
      { href: "/terms", label: "Điều khoản sử dụng", Icon: FileText },
      { href: "/api-docs", label: "API Docs", Icon: FileText },
    ],
  },
];

export const ACCOUNT_GROUP: NavGroup = {
  title: "Tài khoản",
  links: ACCOUNT_LINKS,
};

export const APP_VERSION = "v3.5";

export const BRAND = {
  name: "Genshin Ban/Pick",
  tagline: "La Hoàn Cảnh Giới",
  Icon: Swords,
};
