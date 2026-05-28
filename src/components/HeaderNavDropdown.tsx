"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Swords, Gauge, Trophy, Users, Globe, Bell, BookOpen, ShieldCheck, ChevronRight } from "lucide-react";

type LinkItem = {
  href: string;
  label: string;
  Icon?: any;
};

type DropdownColumn = {
  title: string;
  links: LinkItem[];
};

const navColumns: DropdownColumn[] = [
  {
    title: "Công cụ",
    links: [
      { href: "/tools/draft-simulator", label: "Draft Simulator", Icon: Swords },
      { href: "/tools/cost-calculator", label: "Cost Calculator", Icon: Gauge },
      { href: "/tools/team-builder", label: "Team Builder", Icon: Users },
      { href: "/meta", label: "Phân tích Meta", Icon: Globe },
      { href: "/leaderboard", label: "Bảng xếp hạng", Icon: Trophy }
    ]
  },
  {
    title: "Giải đấu",
    links: [
      { href: "/tournaments", label: "Quản lý giải đấu", Icon: Trophy },
      { href: "/characters", label: "Danh sách nhân vật", Icon: Users },
      { href: "/rules", label: "Luật thi đấu", Icon: BookOpen },
      { href: "/history", label: "Lịch sử đấu", Icon: ShieldCheck }
    ]
  },
  {
    title: "Hỗ trợ & Hệ thống",
    links: [
      { href: "/guide", label: "Hướng dẫn sử dụng", Icon: BookOpen },
      { href: "/status", label: "Trạng thái hệ thống", Icon: ShieldCheck },
      { href: "/patch-notes", label: "Patch Notes", Icon: Bell },
      { href: "/feedback", label: "Góp ý & Báo lỗi", Icon: Bell }
    ]
  }
];

export function HeaderNavDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="home-topbar__menu-container" ref={containerRef}>
      <button
        onClick={toggleDropdown}
        className={`home-topbar__menu-btn ${isOpen ? "active" : ""}`}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
        <span>Menu</span>
      </button>

      {isOpen && (
        <div className="home-topbar__dropdown">
          <div className="home-topbar__dropdown-grid">
            {navColumns.map((col) => (
              <div key={col.title} className="home-topbar__dropdown-col">
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((link) => {
                    const LinkIcon = link.Icon;
                    return (
                      <li key={link.href}>
                        <Link href={link.href} className="home-topbar__dropdown-link" onClick={() => setIsOpen(false)}>
                          {LinkIcon && <LinkIcon size={16} className="link-icon" />}
                          <span>{link.label}</span>
                          <ChevronRight size={14} className="arrow-icon" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
