import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const me = await services.auth.getCurrentUserRecord();
  if (!me) redirect("/login?redirect=/admin");
  if (me.role !== "ADMIN") {
    return (
      <>
        <NavBar />
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <h1 className="text-xl font-black text-slate-100">⚠ Không có quyền</h1>
            <p className="mt-2 text-sm text-slate-400">Bạn không phải Admin.</p>
            <Link href="/" className="mt-4 inline-block btn-outline">Về trang chủ</Link>
          </div>
        </main>
      </>
    );
  }

  const [users, tournamentsResult, healthResult] = await Promise.all([
    services.adminUser.listUsers(),
    services.tournament.listTournaments({ limit: 50 }),
    services.systemHealth.getHealth(),
  ]);
  const tournaments = tournamentsResult.ok ? tournamentsResult.data.tournaments : [];
  const health = healthResult.ok ? healthResult.data : null;

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                  <Crown size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-300">Admin Panel</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Quản trị hệ thống</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300">{me.email}</span>
                <LogoutButton />
                <Link href="/" className="btn-outline">
                  <ArrowLeft size={14} />
                  Trang chủ
                </Link>
              </div>
            </div>
          </div>

          <AdminDashboard
            currentUserId={me.id}
            users={users.map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name ?? null,
              role: u.role,
              createdAt: u.createdAt.toISOString(),
            }))}
            tournaments={tournaments.map((t) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              status: t.status,
              format: t.format,
              maxTeams: t.maxTeams,
              participantCount: t.participantCount,
              organizerName: t.organizerName,
              createdAt: t.createdAt.toISOString(),
            }))}
            health={health}
          />
        </div>
      </main>
    </>
  );
}
