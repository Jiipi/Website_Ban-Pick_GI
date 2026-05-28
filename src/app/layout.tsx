import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/CommandPalette";
import { I18nWrapper } from "@/components/I18nWrapper";
import { GlobalChrome } from "@/components/shell/GlobalChrome";
import { getLocaleFromCookie } from "@/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Genshin Ban/Pick — La Hoàn Cảnh Giới",
  description: "Công cụ Ban/Pick nhân vật Genshin Impact cho La Hoàn Cảnh Giới. Draft 16 nhân vật, tính cost và thời gian handicap.",
  keywords: ["Genshin Impact", "Ban Pick", "Spiral Abyss", "La Hoàn", "Draft"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.toString());

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <div className="bg-arena" aria-hidden="true" />
        <I18nWrapper locale={locale}>
          <GlobalChrome>{children}</GlobalChrome>
        </I18nWrapper>
        <CommandPalette />
      </body>
    </html>
  );
}
