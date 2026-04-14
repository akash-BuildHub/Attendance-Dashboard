import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Clock,
  MessageSquare,
  Bell,
  Settings,
  ChevronDown,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import hypeLogo from "@/images/HYPE_logo.png";

const navItems = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Employee Management", to: "/employees", icon: Users },
  { label: "Attendance History", to: "/presence", icon: Clock },
  { label: "Requests & Notifications", to: "/requests", icon: MessageSquare },
  { label: "Alerts & Automation", to: "/alerts", icon: Bell },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="relative h-screen overflow-hidden bg-white">
      <div className="mx-auto flex h-full max-w-[1680px] gap-3 px-3 py-3 md:gap-4 md:px-4 md:py-4">
        <div className="relative z-10 flex h-full w-[78px] shrink-0 flex-col items-center pt-3">
          <img
            src={hypeLogo}
            alt="HYPE logo"
            className="h-12 w-12 scale-110 object-contain"
          />

          <aside className="relative mt-8 flex w-full min-h-0 flex-1 flex-col items-center rounded-r-[28px] bg-gradient-to-b from-[#69baa7] via-[#4aa590] to-[#2f8f7b] py-5 shadow-[0_20px_50px_rgba(18,96,79,0.32)]">
            <nav className="relative z-10 mt-2 flex flex-1 flex-col items-center gap-3">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const showNotificationDot = item.to === "/requests";

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative grid h-9 w-9 place-items-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-white text-[#3f9382] shadow-[0_10px_20px_rgba(12,70,56,0.22)]"
                        : "text-white/90 hover:bg-white/18 hover:text-white"
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    {showNotificationDot && !active ? (
                      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#ffe37d]" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>

        <div className="z-10 flex min-w-0 flex-1 flex-col gap-0 overflow-hidden">
          <header className="relative flex h-[62px] shrink-0 items-center bg-white px-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)] md:px-4">
            <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-wide text-slate-800">
              Movement Intelligence Platform
            </p>

            <div className="ml-auto flex items-center gap-1.5 text-slate-700">
              <button
                type="button"
                className="ml-1 inline-flex items-center gap-2 bg-white px-2 py-1.5 transition-colors hover:bg-slate-50"
                aria-label="Admin menu"
              >
                <Avatar className="h-8 w-8 bg-slate-50">
                  <AvatarFallback className="bg-slate-50 text-slate-500">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-semibold leading-none text-slate-800 md:inline">Admin</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-white p-4 shadow-[0_20px_48px_rgba(15,23,42,0.07)] md:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
