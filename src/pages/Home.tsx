import { Link } from "react-router-dom";
import { ClipboardList, Truck, BarChart3, Ship, Anchor } from "lucide-react";

const roles = [
  {
    to: "/dispatcher",
    title: "调度员",
    description: "管理派活任务、指派司机与叉车、校验危险品授权",
    icon: ClipboardList,
    color: "from-port-700 to-port-900",
    accent: "text-warn-500",
  },
  {
    to: "/driver",
    title: "叉车司机",
    description: "查看任务、接单作业、回写作业时间节点与异常",
    icon: Truck,
    color: "from-emerald-600 to-emerald-800",
    accent: "text-yellow-300",
  },
  {
    to: "/admin",
    title: "运营管理",
    description: "查看叉车利用率、堆场拥堵时段与作业统计报表",
    icon: BarChart3,
    color: "from-indigo-600 to-indigo-800",
    accent: "text-indigo-200",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-port-900 via-port-800 to-port-700 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <Ship className="w-14 h-14 text-warn-500" />
              <Anchor className="w-6 h-6 text-emerald-400 absolute -bottom-1 -right-2" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            港口叉车司机派活系统
          </h1>
          <p className="text-port-200 text-lg max-w-2xl mx-auto">
            智能调度 · 全程追踪 · 数据驱动
            <br />
            连接船期、堆场、司机与管理者，让每一次装卸作业高效可追溯
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.to}
                to={r.to}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${r.color} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/10`}
              >
                <div className="absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon className="w-40 h-40" />
                </div>
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center mb-5 ${r.accent}`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{r.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {r.description}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-white/90 group-hover:translate-x-1 transition-transform">
                    进入工作台 →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-20 text-port-300 text-sm">
          危险品授权校验 · 作业时间全记录 · 利用率与拥堵分析
        </div>
      </div>
    </div>
  );
}
