import { Cloud, Loader2, Check, AlertCircle } from "lucide-react";
import { useStore } from "../store/useStore";

export default function GitHubSync() {
  const { syncFromCloud, syncStatus } = useStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      <span className="text-[10px] font-song text-gold-200/30">
        {syncStatus === "syncing" && "同步中..."}
        {syncStatus === "synced" && "已同步"}
        {syncStatus === "error" && "同步失败"}
      </span>

      <button
        onClick={syncFromCloud}
        disabled={syncStatus === "syncing"}
        className="w-9 h-9 rounded-full border border-gold-400/20 flex items-center justify-center text-gold-200/40 hover:text-gold-200 hover:border-gold-400/50 backdrop-blur-md transition-all disabled:opacity-30"
        title="从云端同步数据"
      >
        {syncStatus === "syncing" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : syncStatus === "synced" ? (
          <Check size={14} />
        ) : syncStatus === "error" ? (
          <AlertCircle size={14} />
        ) : (
          <Cloud size={14} />
        )}
      </button>
    </div>
  );
}
