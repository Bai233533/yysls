import { useState, useRef, useEffect } from "react";
import { X, Upload, ImagePlus } from "lucide-react";
import { useStore } from "../store/useStore";
import { ROLES } from "../data/members";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditModal() {
  const { editingMember, addingMember, setEditingMember, setAddingMember, updateMember, addMember } = useStore();
  const isOpen = editingMember !== null || addingMember;
  const isAdd = addingMember;

  const [name, setName] = useState("");
  const [role, setRole] = useState("社员");
  const [signature, setSignature] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [detailPreview, setDetailPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setRole(editingMember.role);
      setSignature(editingMember.signature || "");
      setAvatarPreview(editingMember.avatarUrl);
      setDetailPreview(editingMember.detailUrl);
    } else if (addingMember) {
      setName("");
      setRole("社员");
      setSignature("");
      setAvatarPreview("");
      setDetailPreview("");
    }
  }, [editingMember, addingMember]);

  if (!isOpen) return null;

  const close = () => {
    setEditingMember(null);
    setAddingMember(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "detail") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    if (type === "avatar") setAvatarPreview(base64);
    else setDetailPreview(base64);
  };

  const handleSave = () => {
    if (isAdd) {
      addMember({
        name: name || "新成员",
        role,
        title: name || "新成员",
        description: "",
        avatarUrl: avatarPreview,
        detailUrl: detailPreview,
        rank: "I",
        karma: 0,
        valor: 0,
        joinDate: new Date().toISOString().split("T")[0],
        isVerified: false,
        signature,
      });
    } else if (editingMember) {
      updateMember(editingMember.id, { name, role, avatarUrl: avatarPreview, detailUrl: detailPreview, signature });
      setEditingMember(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={close} />
      <div className="relative z-[115] bg-rice-100 rounded w-[420px] max-w-[90vw] max-h-[85vh] overflow-y-auto border border-gold-400/20"
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-lg font-calligraphy text-ink-700">{isAdd ? "添加成员" : "编辑成员"}</h3>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded hover:bg-ink-700/10 text-ink-600/50 hover:text-ink-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-5">
          {/* Display Image */}
          <div>
            <label className="block text-sm font-song text-ink-700 mb-2">展示图片</label>
            <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-rice-200 border-2 border-dashed border-gold-400/20 cursor-pointer group hover:border-gold-400/50 transition-colors"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="展示图片" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-rice-100/90 rounded px-3 py-1.5 flex items-center gap-2 text-sm text-ink-700 font-song">
                      <Upload size={14} />更换图片
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-600/40 group-hover:text-ink-600/60 transition-colors">
                  <ImagePlus size={36} strokeWidth={1.5} />
                  <span className="mt-2 text-sm font-song">点击上传展示图片</span>
                </div>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "avatar")} />
          </div>
          {/* Detail Image */}
          <div>
            <label className="block text-sm font-song text-ink-700 mb-2">详情图片</label>
            <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-rice-200 border-2 border-dashed border-gold-400/20 cursor-pointer group hover:border-gold-400/50 transition-colors"
              onClick={() => detailInputRef.current?.click()}
            >
              {detailPreview ? (
                <>
                  <img src={detailPreview} alt="详情图片" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-rice-100/90 rounded px-3 py-1.5 flex items-center gap-2 text-sm text-ink-700 font-song">
                      <Upload size={14} />更换图片
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-600/40 group-hover:text-ink-600/60 transition-colors">
                  <ImagePlus size={36} strokeWidth={1.5} />
                  <span className="mt-2 text-sm font-song">点击上传详情图片</span>
                </div>
              )}
            </div>
            <input ref={detailInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "detail")} />
          </div>
          {/* Name */}
          <div>
            <label className="block text-sm font-song text-ink-700 mb-2">成员名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
              placeholder={isAdd ? "输入成员名称" : ""}
            />
          </div>
          {/* Role */}
          <div>
            <label className="block text-sm font-song text-ink-700 mb-2">职位</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`px-4 py-2.5 rounded text-sm font-song font-medium border transition-all ${
                    role === r
                      ? "bg-gold-200/20 border-gold-400 text-ink-800"
                      : "bg-rice-50 border-gold-400/20 text-ink-600 hover:border-gold-400/50"
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>
          {/* Signature */}
          <div>
            <label className="block text-sm font-song text-ink-700 mb-2">个性签名</label>
            <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)}
              className="w-full px-4 py-2.5 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
              placeholder="输入个性签名"
            />
          </div>
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={close}
              className="flex-1 px-4 py-2.5 rounded border border-gold-400/20 text-sm font-song text-ink-600 hover:bg-rice-200 transition-colors"
            >取消</button>
            <button onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded btn-ink text-sm font-song font-medium active:scale-95"
            >{isAdd ? "添加" : "保存"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
