import { useState } from "react";
import { X, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToRecovery: () => void;
}

export default function LoginModal({ open, onClose, onSwitchToRegister, onSwitchToRecovery }: Props) {
  const { signIn } = useAuth();
  const [memberName, setMemberName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useBodyScrollLock(open);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(memberName, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setMemberName(""); setPassword("");
      onClose();
    }
  };

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
            <LogIn size={18} className="text-gold-400" />
            <h2 className="font-calligraphy text-lg text-ink-800 tracking-widest">登录</h2>
          </div>
          <button onClick={onClose} className="text-ink-600/40 hover:text-ink-800 transition-colors"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-song text-ink-600 mb-1 tracking-wide">成员名称或游戏ID</label>
            <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} required
              className="w-full px-3 py-2 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
              placeholder="输入成员名称或游戏ID" />
          </div>
          <div>
            <label className="block text-xs font-song text-ink-600 mb-1 tracking-wide">密码</label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2 pr-10 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
                placeholder="输入密码" />
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
            {loading ? "登录中..." : "登录"}
          </button>

          <div className="flex justify-between text-xs font-song">
            <button type="button" onClick={onSwitchToRecovery} className="text-gold-400 hover:text-gold-300 transition-colors">
              忘记密码？
            </button>
            <button type="button" onClick={onSwitchToRegister} className="text-gold-400 hover:text-gold-300 transition-colors">
              注册新账号
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
