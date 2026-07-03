import { useState } from "react";
import { X, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function PasswordRecoveryModal({ open, onClose, onSwitchToLogin }: Props) {
  const { recoverPassword } = useAuth();
  const [memberName, setMemberName] = useState("");
  const [gameId, setGameId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useBodyScrollLock(open);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("新密码至少6位"); return; }
    setLoading(true);
    const result = await recoverPassword(memberName, gameId, newPassword);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-[205] bg-rice-100 rounded-lg w-[380px] max-w-[90vw] border border-gold-400/20 p-6 text-center"
          style={{ animation: "modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="font-calligraphy text-xl text-ink-800 mb-2">密码已重置</h3>
          <p className="text-sm font-song text-ink-600 mb-4">请使用新密码登录</p>
          <button onClick={() => { setSuccess(false); onSwitchToLogin(); }}
            className="w-full py-2.5 rounded btn-ink text-sm font-song font-medium">
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-[205] bg-rice-100 rounded-lg w-[380px] max-w-[90vw] border border-gold-400/20"
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold-400/20">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-gold-400" />
            <h2 className="font-calligraphy text-lg text-ink-800 tracking-widest">找回密码</h2>
          </div>
          <button onClick={onClose} className="text-ink-600/40 hover:text-ink-800 transition-colors"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          <p className="text-xs font-song text-ink-600/60">通过成员名称和游戏ID验证身份后重置密码</p>

          <div>
            <label className="block text-xs font-song text-ink-600 mb-1 tracking-wide">成员名称</label>
            <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} required
              className="w-full px-3 py-2 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
              placeholder="输入成员名称" />
          </div>
          <div>
            <label className="block text-xs font-song text-ink-600 mb-1 tracking-wide">游戏ID</label>
            <input type="text" value={gameId} onChange={(e) => setGameId(e.target.value)} required
              className="w-full px-3 py-2 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
              placeholder="输入注册时填写的游戏ID" />
          </div>
          <div>
            <label className="block text-xs font-song text-ink-600 mb-1 tracking-wide">新密码</label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2 pr-10 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
                placeholder="至少6位" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-600/30 hover:text-ink-600 transition-colors">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded text-xs font-song border" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded btn-ink text-sm font-song font-medium active:scale-95 disabled:opacity-50">
            {loading ? "重置中..." : "重置密码"}
          </button>

          <div className="text-center text-xs font-song">
            <button type="button" onClick={onSwitchToLogin} className="text-gold-400 hover:text-gold-300 transition-colors">
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
