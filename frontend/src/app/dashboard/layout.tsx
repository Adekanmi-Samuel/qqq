"use client";

import { useAuth, getRoleLabel, type Role } from "@/lib/auth/CookieAuthProvider";
import RoleGuard from "@/components/RoleGuard";
import PageTransition from "@/components/layout/PageTransition";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck,
  UserCog, FileText, Bell, BarChart3, Settings,
  LogOut, Menu, X, ChevronRight, School, UserPlus, Shield, Calendar, Monitor,
  Sparkles, DollarSign, Mail, Clock, Sun, Moon, Compass, Search,
  CreditCard, ScrollText, Flag,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import WheelIcon from "@/components/WheelIcon";
import SchoolLogo from "@/components/SchoolLogo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not logged in — never to homepage
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "SCHOOL_ADMIN" || user.role === "PRINCIPAL" || user.role === "SUPER_ADMIN";
  const isTeacher = user.role === "TEACHER";
  const isStaff = user.role === "BURSAR";
  const isStudent = user.role === "STUDENT";
  const isParent = user.role === "PARENT";

  const settingsHref =
    user?.role === "SUPER_ADMIN"
      ? "/dashboard/platform/settings"
      : isAdmin
      ? "/dashboard/admin/settings"
      : "/dashboard/settings";

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userInitials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <RoleGuard>
      <div className="min-h-screen flex bg-[var(--bg)]">
        {/* Mobile overlay + sidebar via framer-motion */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="sidebar-backdrop"
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSidebarOpen(false)}
              />

              {/* Mobile sidebar drawer */}
              <motion.aside
                key="mobile-sidebar"
                className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[var(--surface)] border-r border-[var(--border)] md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
              >
                <SidebarContent
                  user={user}
                  settingsHref={settingsHref}
                  onLogout={() => { logout(); router.push("/login"); }}
                  onClose={() => setSidebarOpen(false)}
                  showCloseButton
                  userInitials={userInitials}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop sidebar -- always visible on md+ */}
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 flex-col bg-[var(--surface)] border-r border-[var(--border)]">
          <SidebarContent
            user={user}
            settingsHref={settingsHref}
            onLogout={() => { logout(); router.push("/login"); }}
            userInitials={userInitials}
          />
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 md:ml-64 bg-[var(--bg)] transition-colors duration-300">

          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] transition-colors duration-300">
            <div className="flex items-center justify-between h-16 px-4 md:px-8">
              {/* Left side: hamburger + greeting */}
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-2)] min-w-[44px] min-h-[44px] flex items-center justify-center"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
                <p className="text-sm text-[var(--text-muted)] hidden sm:block font-sans">
                  {greeting()}, <span className="font-medium text-[var(--text)]">{user.fullName.split(" ")[0]}</span>
                </p>
              </div>

              {/* Right side: search + notifications + theme + avatar */}
              <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search..."
                    readOnly
                    tabIndex={-1}
                    className="w-52 lg:w-64 h-9 pl-9 pr-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text-muted)] placeholder:text-[var(--text-muted)] cursor-default focus:outline-none font-sans"
                  />
                </div>

                {/* Mobile search button */}
                <button
                  className="md:hidden w-9 h-9 rounded-lg btn-ghost flex items-center justify-center min-w-[44px] min-h-[44px]"
                  aria-label="Search"
                  tabIndex={-1}
                >
                  <Search className="w-5 h-5 text-[var(--text-muted)]" />
                </button>

                {/* Notification bell with badge */}
                <button
                  className="relative w-9 h-9 rounded-lg btn-ghost flex items-center justify-center min-w-[44px] min-h-[44px]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-danger)] ring-2 ring-[var(--surface)]" />
                </button>

                {/* Theme toggle */}
                {mounted && (
                  <button
                    onClick={toggle}
                    className="w-9 h-9 rounded-lg btn-ghost flex items-center justify-center min-w-[44px] min-h-[44px]"
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                )}

                {/* User avatar */}
                <div className="flex items-center gap-2 ml-1">
                  <div className="w-9 h-9 bg-[var(--sh-green-800)]/15 rounded-full flex items-center justify-center ring-2 ring-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--sh-green-500)] font-sans">
                      {userInitials}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main id="main-content" className="flex-1 p-4 md:p-8 lg:p-10 relative z-10" tabIndex={-1}>
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

/* ─── Sidebar Content (shared between mobile + desktop) ─── */

function SidebarContent({
  user,
  settingsHref,
  onLogout,
  onClose,
  showCloseButton,
  userInitials,
}: {
  user: { school?: { logoUrl?: string | null; name?: string } | null; fullName: string; role: Role };
  settingsHref: string;
  onLogout: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  userInitials: string;
}) {
  const pathname = usePathname();

  const isAdmin = user.role === "SCHOOL_ADMIN" || user.role === "PRINCIPAL" || user.role === "SUPER_ADMIN";
  const isTeacher = user.role === "TEACHER";
  const isStaff = user.role === "BURSAR";
  const isStudent = user.role === "STUDENT";
  const isParent = user.role === "PARENT";

  return (
    <div className="relative z-10 flex flex-col h-full w-full">
      {/* Logo / Branding */}
      <div className="flex items-center justify-between gap-3 px-6 h-20 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <SchoolLogo
            logoUrl={user.school?.logoUrl}
            schoolName={user.school?.name || "SchoolPilot"}
            size={36}
          />
          <div className="flex-1 min-w-0">
            <span className="block font-semibold font-display truncate text-sm leading-tight text-[var(--text)]">
              {user.school?.name || "SchoolPilot"}
            </span>
          </div>
        </Link>
        {showCloseButton && onClose && (
          <button
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* School name strip */}
      <div className="px-6 py-3 border-b border-[var(--border)]">
        <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest">
          {user.school ? "School Profile" : "Platform"}
        </p>
        <p className="text-[var(--text)] text-sm font-medium truncate mt-0.5">
          {user.school?.name || (user.school ? "No name set" : "Administration")}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && <AdminNav pathname={pathname} />}
        {isTeacher && <TeacherNav pathname={pathname} />}
        {isStaff && <StaffNav pathname={pathname} />}
        {isStudent && <StudentNav pathname={pathname} />}
        {isParent && <ParentNav pathname={pathname} />}
      </nav>

      {/* User info, settings, & logout */}
      <div className="border-t border-[var(--border)] p-4 bg-[var(--surface-2)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--sh-green-800)]/20 text-[var(--sh-green-500)]">
            <span className="text-sm font-semibold">
              {userInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate font-sans">{user.fullName}</p>
            <p className="text-xs text-[var(--text-muted)] font-sans">{getRoleLabel(user.role)}</p>
          </div>
        </div>

        {/* Settings link */}
        <Link
          href={settingsHref}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded-lg transition-colors font-sans mb-1"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 rounded-lg transition-colors font-sans"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function NavLink({ href, icon, label, current, badge }: { href: string; icon: React.ReactNode; label: string; current: boolean; badge?: string | number }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans
        transition-all duration-200 group relative
        ${current
          ? "bg-gradient-to-r from-[var(--sh-green-800)]/15 to-transparent border-l-2 border-[var(--sh-green-500)] text-[var(--text)] font-medium"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border-l-2 border-transparent"
        }
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--sh-green-800)]/20 text-[var(--sh-green-500)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-5 pb-2">
      <p className="px-3 text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-1 font-sans">
        {title}
      </p>
      {children}
    </div>
  );
}

/* Admin Nav */
function AdminNav({ pathname }: { pathname: string }) {
  const { user } = useAuth();

  // Platform admin nav -- only for SUPER_ADMIN
  if (user?.role === "SUPER_ADMIN") {
    return (
      <>
        <NavSection title="Platform Admin">
          <NavLink
            href="/dashboard/platform"
            icon={<Shield className="w-5 h-5" />}
            label="Platform Dashboard"
            current={pathname === "/dashboard/platform"}
          />
          <NavLink
            href="/dashboard/platform/schools"
            icon={<School className="w-5 h-5" />}
            label="Schools"
            current={pathname.startsWith("/dashboard/platform/schools")}
          />
          <NavLink
            href="/dashboard/platform/plans"
            icon={<DollarSign className="w-5 h-5" />}
            label="Plans"
            current={pathname.startsWith("/dashboard/platform/plans")}
          />
          <NavLink
            href="/dashboard/platform/audit"
            icon={<ScrollText className="w-5 h-5" />}
            label="Audit Log"
            current={pathname.startsWith("/dashboard/platform/audit")}
          />
          <NavLink
            href="/dashboard/platform/audit"
            icon={<FileText className="w-5 h-5" />}
            label="System Logs"
            current={pathname.startsWith("/dashboard/platform/logs")}
          />
          <NavLink
            href="/dashboard/platform/settings"
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            current={pathname.startsWith("/dashboard/platform/settings")}
          />
        </NavSection>
        <div className="border-t border-[var(--border)] my-2" />
      </>
    );
  }

  const items: NavItem[] = [
    { href: "/dashboard/admin", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/dashboard/admin/students", label: "Students", icon: <Users className="w-5 h-5" /> },
    { href: "/dashboard/admin/staff", label: "Staff", icon: <UserCog className="w-5 h-5" /> },
    { href: "/dashboard/admin/classes", label: "Academics", icon: <GraduationCap className="w-5 h-5" /> },
    { href: "/dashboard/admin/curriculum", label: "Timetable and Schemes", icon: <Calendar className="w-5 h-5" /> },
    { href: "/dashboard/admin/timetable", label: "Timetable Board", icon: <Calendar className="w-5 h-5" /> },
    { href: "/dashboard/admin/results", label: "Results", icon: <FileText className="w-5 h-5" /> },
    { href: "/dashboard/admin/exams", label: "CBT Exams", icon: <Monitor className="w-5 h-5" /> },
    { href: "/dashboard/admin/attendance", label: "Attendance", icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: "/dashboard/admin/timesheets", label: "Timesheets", icon: <Clock className="w-5 h-5" /> },
    { href: "/dashboard/admin/notices", label: "Notices", icon: <Bell className="w-5 h-5" /> },
    { href: "/dashboard/admin/communication", label: "Communication", icon: <Mail className="w-5 h-5" /> },
    { href: "/dashboard/admin/reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
    { href: "/dashboard/admin/compliance", label: "Compliance", icon: <FileText className="w-5 h-5" /> },
    { href: "/dashboard/admin/invites", label: "Staff Invites", icon: <UserPlus className="w-5 h-5" /> },
    { href: "/dashboard/admin/users", label: "User Management", icon: <UserCog className="w-5 h-5" /> },
    { href: "/dashboard/admin/transactions", label: "Transactions", icon: <CreditCard className="w-5 h-5" /> },
    { href: "/dashboard/admin/moderation", label: "Moderation", icon: <Flag className="w-5 h-5" /> },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          current={pathname === item.href || pathname.startsWith(item.href + "/")}
          badge={item.badge}
        />
      ))}
    </>
  );
}

/* Teacher Nav */
function TeacherNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { href: "/dashboard/teacher", label: "Today", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/dashboard/teacher/setup", label: "My Teaching Setup", icon: <UserCog className="w-5 h-5" /> },
    { href: "/dashboard/teacher/classes", label: "My Classes", icon: <GraduationCap className="w-5 h-5" /> },
    { href: "/dashboard/teacher/attendance", label: "Attendance", icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: "/dashboard/teacher/timesheet", label: "Timesheet", icon: <Clock className="w-5 h-5" /> },
    { href: "/dashboard/teacher/results", label: "Results", icon: <FileText className="w-5 h-5" /> },
    { href: "/dashboard/teacher/notices", label: "Notices", icon: <Bell className="w-5 h-5" /> },
    { href: "/dashboard/teacher/lesson-notes", label: "Lesson Notes", icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          current={pathname === item.href || pathname.startsWith(item.href + "/")}
        />
      ))}
    </>
  );
}

/* Staff (Bursar) Nav */
function StaffNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { href: "/dashboard/staff", label: "Records Desk", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/dashboard/staff/fees", label: "Fee Records", icon: <DollarSign className="w-5 h-5" /> },
    { href: "/dashboard/staff/students", label: "Student Records", icon: <Users className="w-5 h-5" /> },
    { href: "/dashboard/staff/staff", label: "Staff Records", icon: <UserCog className="w-5 h-5" /> },
    { href: "/dashboard/staff/correspondence", label: "Correspondence", icon: <FileText className="w-5 h-5" /> },
    { href: "/dashboard/staff/reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          current={pathname === item.href || pathname.startsWith(item.href + "/")}
        />
      ))}
    </>
  );
}

/* Student Nav */
function StudentNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { href: "/dashboard/student", label: "Home", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/dashboard/student/results", label: "Results", icon: <FileText className="w-5 h-5" /> },
    { href: "/dashboard/student/study", label: "Study", icon: <GraduationCap className="w-5 h-5" /> },
    { href: "/dashboard/student/tasks", label: "Tasks", icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: "/dashboard/student/cbt", label: "CBT Exams", icon: <Monitor className="w-5 h-5" /> },
    { href: "/dashboard/student/notices", label: "Notices", icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          current={pathname === item.href || pathname.startsWith(item.href + "/")}
        />
      ))}
    </>
  );
}

/* Parent Nav */
function ParentNav({ pathname }: { pathname: string }) {
  const items: NavItem[] = [
    { href: "/dashboard/parent", label: "My Children", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/dashboard/parent/fees", label: "Fee Status", icon: <DollarSign className="w-5 h-5" /> },
    { href: "/dashboard/parent/notices", label: "Notices", icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          current={pathname === item.href || pathname.startsWith(item.href + "/")}
        />
      ))}
    </>
  );
}

/* Loading screen */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        {/* Animated logo */}
        <div className="mx-auto mb-6 animate-pulse">
          <WheelIcon size={56} variant="dark" />
        </div>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 13,
          color: "var(--text-muted)",
        }}>Loading...</p>
      </div>
    </div>
  );
}
