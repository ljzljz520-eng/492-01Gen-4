import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  BarChart3,
  Ship,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navConfig: Record<string, NavItem[]> = {
  dispatcher: [
    { to: "/dispatcher", label: "任务看板", icon: ClipboardList },
    { to: "/dispatcher/task/new", label: "新建派活", icon: LayoutDashboard },
  ],
  driver: [{ to: "/driver", label: "我的任务", icon: Truck }],
  admin: [
    { to: "/admin", label: "利用率统计", icon: BarChart3 },
    { to: "/admin/congestion", label: "拥堵分析", icon: BarChart3 },
  ],
};

function getRoleFromPath(path: string): string | null {
  if (path.startsWith("/dispatcher")) return "dispatcher";
  if (path.startsWith("/driver")) return "driver";
  if (path.startsWith("/admin")) return "admin";
  return null;
}

const roleTitle: Record<string, string> = {
  dispatcher: "调度员工作台",
  driver: "叉车司机作业端",
  admin: "运营管理端",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const role = getRoleFromPath(location.pathname);

  if (!role) return <div className="min-h-screen">{children}</div>;

  const items = navConfig[role];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-port-800 text-white shadow-md">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Ship className="w-7 h-7 text-warn-500" />
            <div>
              <div className="font-bold text-lg leading-tight">港口叉车派活系统</div>
              <div className="text-xs text-port-200">{roleTitle[role]}</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                item.to === location.pathname ||
                (item.to !== `/${role}` && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
                    active
                      ? "bg-port-600 text-white"
                      : "text-port-100 hover:bg-port-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-6">{children}</main>
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} 港口叉车派活系统
      </footer>
    </div>
  );
}
