import { useAppStore } from "@/store/useAppStore";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export default function Toast() {
  const { toast, clearToast } = useAppStore();
  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-port-500" />,
  };
  const bgMap = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    info: "bg-port-50 border-port-200",
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgMap[toast.type]} animate-[slideIn_.2s_ease-out]`}
        onClick={clearToast}
      >
        {iconMap[toast.type]}
        <span className="text-sm font-medium text-slate-800">{toast.message}</span>
      </div>
    </div>
  );
}
