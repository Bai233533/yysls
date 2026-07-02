import { useState } from "react";
import { Cloud, CloudOff, Check, Loader2, Settings } from "lucide-react";
import { useStore } from "../store/useStore";

export default function GitHubSync() {
  const { githubToken, setGithubToken, syncFromGitHub, syncStatus } = useStore();
  const [showInput, setShowInput] = useState(false);
  const [tokenInput, setTokenInput] = useState(githubToken);

  const handleSave = () => {
    setGithubToken(tokenInput.trim());
    setShowInput(false);
    if (tokenInput.trim()) {
      syncFromGitHub();
    }
  };

  const handleSync = async () => {
    await syncFromGitHub();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Token Input Panel */}
      {showInput && (
        <div className="bg-ink-800 border border-gold-400/20 rounded-lg p-4 w-80 shadow-xl"
          style={{ animation: "modalIn 0.2s ease-out forwards" }}
        >
          <h4 className="font-song text-sm text-gold-200 mb-2">GitHub Token 设置</h4>
          <p className="font-song text-xs text-gold-200/40 mb-3">
            输入 Token 后，所有编辑操作会同步到 GitHub 仓库，其他人刷新页面即可看到最新数据。
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full px-3 py-2 rounded bg-ink-900 border border-gold-400/20 text-gold-200 text-sm font-song focus:outline-none focus:border-gold-400/50 mb-3"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowInput(false)}
              className="flex-1 px-3 py-1.5 rounded border border-gold-400/20 text-gold-200/60 text-xs font-song hover:bg-ink-700 transition-colors"
            >取消</button>
            <button onClick={handleSave}
              className="flex-1 px-3 py-1.5 rounded btn-ink text-xs font-song"
            >保存</button>
          </div>
        </div>
      )}

      {/* Status & Buttons */}
      <div className="flex items-center gap-2">
        {/* Sync status */}
        <span className="text-[10px] font-song text-gold-200/30">
          {syncStatus === "syncing" && "同步中..."}
          {syncStatus === "synced" && "已同步"}
          {syncStatus === "error" && "同步失败"}
        </span>

        {/* Sync button */}
        {githubToken && (
          <button
            onClick={handleSync}
            disabled={syncStatus === "syncing"}
            className="w-9 h-9 rounded-full border border-gold-400/20 flex items-center justify-center text-gold-200/40 hover:text-gold-200 hover:border-gold-400/50 backdrop-blur-md transition-all disabled:opacity-30"
          >
            {syncStatus === "syncing" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Cloud size={14} />
            )}
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => setShowInput(!showInput)}
          className="w-9 h-9 rounded-full border border-gold-400/20 flex items-center justify-center text-gold-200/40 hover:text-gold-200 hover:border-gold-400/50 backdrop-blur-md transition-all"
        >
          {githubToken ? <Check size={14} /> : <Settings size={14} />}
        </button>
      </div>
    </div>
  );
}
