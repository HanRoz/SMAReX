import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ExternalLink,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { userAuth } from "../../context/AuthContext";

const navItems = [
  {
    path: "/admin",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    path: "/admin/reports",
    icon: Flag,
    label: "Reported Materials",
  },
  {
    path: "/admin/rejected-uploads",
    icon: ShieldAlert,
    label: "Rejected Uploads",
  },
];

export function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPageLabel =
    navItems.find((item) => item.path === location.pathname)
      ?.label || "Administration";

  const { signOut, profile, session } = userAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fullName =
    profile?.full_name ||
    profile?.display_name ||
    session?.user?.email ||
    "Administrator";

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const result = await signOut();

      if (!result.success) {
        toast.error(result.error || "Failed to log out.");
        return;
      }

      toast.success("You have been logged out.");
      navigate("/signin", { replace: true });

    } catch (error) {
      console.error("Logout failed:", error);
      toast.error(error.message || "Failed to log out.");

    } finally {
      setLoggingOut(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#003580] text-white">
      {/* Logo */}
      <div className="flex h-[88px] items-center justify-between border-b border-white/15 px-6">
        <Link
          to="/admin"
          className="group flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <span className="grid size-10 place-items-center rounded-[10px] bg-white text-[#003580] shadow-sm">
            <BookOpen className="size-5" strokeWidth={2.2} />
          </span>

          <span>
            <span className="block text-[18px] font-bold leading-tight tracking-[-0.02em]">
              SMAReX
            </span>

            <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-blue-100">
              Administration
            </span>
          </span>
        </Link>

        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="grid size-9 place-items-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-4 py-7"
        aria-label="Admin navigation"
      >
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/80">
          Workspace
        </p>

        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-semibold transition-colors ${active
                  ? "bg-white text-[#003580] shadow-sm"
                  : "text-blue-50 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="my-6 border-t border-white/15" />

        {/* Back to regular SMAReX */}
        <div className="space-y-1.5">
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-semibold text-blue-50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-[18px]" />
            Back to SMAReX
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-11 w-full items-center gap-3 rounded-[10px] px-3.5 text-sm font-semibold text-blue-50 transition-colors hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="size-[18px]" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </nav>

      {/* Admin Profile */}
      <div className="border-t border-white/15 p-4">
        <div className="flex items-center gap-3 rounded-[10px] bg-white/10 p-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-[#003580]">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">
              {fullName}
            </p>

            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-blue-100">
              <ShieldCheck className="size-3" />
              Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-['Instrument_Sans',sans-serif] text-[#142033]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:block">
        {sidebar}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="lg:pl-[260px]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#DDE4EC] bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-[10px] border border-[#DDE4EC] text-[#003580]"
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-3">
            <p className="text-sm font-bold text-[#003580]">
              SMAReX Admin
            </p>

            {/* <p className="text-xs text-[#64748B]">
              {location.pathname === "/admin"
                ? "Overview"
                : "Reported Materials"}
            </p> */}
            <p className="text-xs text-[#64748B]">
              {currentPageLabel}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen px-4 py-6 sm:px-7 sm:py-8 xl:px-10 xl:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
