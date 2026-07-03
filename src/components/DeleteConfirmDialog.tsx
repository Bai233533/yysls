import { AlertTriangle } from "lucide-react";
import { useStore } from "../store/useStore";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function DeleteConfirmDialog() {
  const { deleteConfirmId, setDeleteConfirmId, deleteMember, members } = useStore();
  useBodyScrollLock(deleteConfirmId !== null);
  if (deleteConfirmId === null) return null;
  const member = members.find((m) => m.id === deleteConfirmId);
  const memberName = member?.name ?? "该成员";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
      <div className="relative z-[125] bg-rice-100 rounded w-[360px] max-w-[90vw] p-6 border border-gold-400/20"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-cinnabar-300/10 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-cinnabar-300" />
          </div>
          <h3 className="text-lg font-calligraphy text-ink-800 mb-2">确认删除</h3>
          <p className="text-sm font-song text-ink-600/70 mb-6">
            确定要删除成员「{memberName}」吗？此操作不可撤销。
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={() => setDeleteConfirmId(null)}
              className="flex-1 px-4 py-2.5 rounded border border-gold-400/20 text-sm font-song text-ink-600 hover:bg-rice-200 transition-colors"
            >取消</button>
            <button onClick={() => deleteMember(deleteConfirmId)}
              className="flex-1 px-4 py-2.5 rounded bg-cinnabar-300 text-rice-50 text-sm font-song font-medium hover:bg-cinnabar-400 transition-colors active:scale-95"
            >确认删除</button>
          </div>
        </div>
      </div>
    </div>
  );
}
