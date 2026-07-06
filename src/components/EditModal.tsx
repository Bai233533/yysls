import { useState, useRef, useEffect, useMemo } from "react";
import { X, Upload, ImagePlus, Film, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { uploadToStorage } from "../lib/supabase";
import LoadingOverlay from "./LoadingOverlay";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 图片上传区域（左栏用） */
function ImageUpload({
  label, preview, inputRef, onFile, onClick, required,
}: {
  label: string; preview: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: () => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-song text-ink-600 tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div
        className="relative w-full aspect-[3/4] rounded overflow-hidden bg-rice-200 border-2 border-dashed border-gold-400/20 cursor-pointer group hover:border-gold-400/50 transition-colors"
        onClick={onClick}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-rice-100/90 rounded px-3 py-1.5 flex items-center gap-1.5 text-xs text-ink-700 font-song">
                <Upload size={12} />更换
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-600/40 group-hover:text-ink-600/60 transition-colors">
            <ImagePlus size={24} strokeWidth={1.5} />
            <span className="mt-1.5 text-xs font-song">点击上传</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}

/** 详情媒体槽位 - 本地预览，保存时才上传 */
function DetailSlot({
  label, url, type, onFileSelect, onRemove, uploading,
}: {
  label: string; url: string; type: string;
  onFileSelect: (file: File) => void; onRemove: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("video/") && file.size > 50 * 1024 * 1024) {
      alert("视频不能超过 50MB");
      return;
    }
    onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  };
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs font-song text-ink-600 tracking-wide whitespace-nowrap min-w-[160px]">{label}</label>
      {url ? (
        <div className="relative w-20 h-20 rounded overflow-hidden border border-gold-400/20 group flex-none">
          {type === "video" ? (
            <>
              <video src={url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Film size={16} className="text-white/80" />
              </div>
            </>
          ) : (
            <img src={url} className="w-full h-full object-cover" alt="" />
          )}
          <button onClick={onRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={11} />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded border-2 border-dashed border-gold-400/20 flex items-center justify-center text-ink-600/30 hover:border-gold-400/50 hover:text-ink-600/50 transition-colors flex-none"
          disabled={uploading}>
          <div className="flex flex-col items-center gap-1">
            <Upload size={16} />
            <span className="text-[9px] font-song">上传</span>
          </div>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

export default function EditModal() {
  const { editingMember, addingMember, setEditingMember, setAddingMember, updateMember, addMember } = useStore();
  const { member: currentUser } = useAuth();
  const isOpen = editingMember !== null || addingMember;
  const isAdd = addingMember;

  useBodyScrollLock(isOpen);

  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("社员");
  const [gameId, setGameId] = useState("");
  const [signature, setSignature] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [detailPreview, setDetailPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  // 3个详情媒体槽位
  const [media1, setMedia1] = useState("");
  const [media2, setMedia2] = useState("");
  const [media3, setMedia3] = useState("");
  const [media1Type, setMediaType1] = useState("image");
  const [media2Type, setMediaType2] = useState("image");
  const [media3Type, setMediaType3] = useState("image");
  // 存储待上传的本地文件（延迟上传）
  const [pendingFile1, setPendingFile1] = useState<File | null>(null);
  const [pendingFile2, setPendingFile2] = useState<File | null>(null);
  const [pendingFile3, setPendingFile3] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [pendingDetail, setPendingDetail] = useState<File | null>(null);

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setRole(editingMember.role);
      setGameId(editingMember.gameId || "");
      setSignature(editingMember.signature || "");
      setAvatarPreview(editingMember.avatarUrl);
      setDetailPreview(editingMember.detailUrl);
      setMedia1(editingMember.detailMedia1 || "");
      setMedia2(editingMember.detailMedia2 || "");
      setMedia3(editingMember.detailMedia3 || "");
      setMediaType1(editingMember.detailMedia1Type || "image");
      setMediaType2(editingMember.detailMedia2Type || "image");
      setMediaType3(editingMember.detailMedia3Type || "image");
    } else if (addingMember) {
      setName(""); setRole("社员"); setGameId(""); setSignature("");
      setAvatarPreview(""); setDetailPreview("");
      setMedia1(""); setMedia2(""); setMedia3("");
      setMediaType1("image"); setMediaType2("image"); setMediaType3("image");
    }
    // 重置待上传文件
    setPendingAvatar(null); setPendingDetail(null);
    setPendingFile1(null); setPendingFile2(null); setPendingFile3(null);
  }, [editingMember, addingMember]);

  // 根据当前用户和编辑目标计算可选职位（必须在 early return 之前）
  // V1=社长, V2=副社长, V3=指挥, V4=社员, V5=观众
  const { availableRoles, canChangeRole } = useMemo(() => {
    if (isAdd) {
      const userRole = currentUser?.role;
      if (userRole === "社长") return { availableRoles: ["副社长", "指挥", "社员"], canChangeRole: true };
      if (userRole === "副社长") return { availableRoles: ["指挥", "社员"], canChangeRole: true };
      if (userRole === "指挥") return { availableRoles: ["社员"], canChangeRole: true };
      return { availableRoles: [], canChangeRole: false };
    }
    if (!editingMember) return { availableRoles: [], canChangeRole: false };
    // 编辑自己不能改职位
    const isEditingSelf = currentUser?.id === editingMember.id;
    if (isEditingSelf) {
      return { availableRoles: [editingMember.role || "社员"], canChangeRole: false };
    }
    const userRole = currentUser?.role;
    // V1 社长：可选副社长、指挥、社员
    if (userRole === "社长") return { availableRoles: ["副社长", "指挥", "社员"], canChangeRole: true };
    // V2 副社长：不能改社长，可选指挥、社员
    if (userRole === "副社长") {
      if (editingMember.role === "社长") return { availableRoles: [], canChangeRole: false };
      return { availableRoles: ["指挥", "社员"], canChangeRole: true };
    }
    // V3 指挥：可选社员
    if (userRole === "指挥") return { availableRoles: ["社员"], canChangeRole: true };
    return { availableRoles: [], canChangeRole: false };
  }, [currentUser, editingMember, isAdd]);

  // 社员编辑自己时：除职位外均可修改
  const isSelfAsMember = !isAdd && editingMember && currentUser?.id === editingMember.id && currentUser?.role === "社员";

  if (!isOpen) return null;

  const close = () => { setEditingMember(null); setAddingMember(false); };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 用 base64 预览，同时存储文件待上传
    setAvatarPreview(await fileToBase64(file));
    setPendingAvatar(file);
  };

  const handleDetailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 用 base64 预览，同时存储文件待上传
    setDetailPreview(await fileToBase64(file));
    setPendingDetail(file);
  };

  // 本地预览，不立即上传
  const handleMediaSelect = async (index: number, file: File) => {
    const isVideo = file.type.startsWith("video/");
    const setUrl = [setMedia1, setMedia2, setMedia3][index];
    const setType = [setMediaType1, setMediaType2, setMediaType3][index];
    const setPending = [setPendingFile1, setPendingFile2, setPendingFile3][index];

    // 使用 base64 进行本地预览（比 URL.createObjectURL 更持久）
    const previewUrl = await fileToBase64(file);
    setUrl(previewUrl);
    setType(isVideo ? "video" : "image");
    setPending(file); // 存储文件，保存时再上传
  };

  const handleMediaRemove = (index: number) => {
    [setMedia1, setMedia2, setMedia3][index]("");
    [setMediaType1, setMediaType2, setMediaType3][index]("image");
    [setPendingFile1, setPendingFile2, setPendingFile3][index](null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setUploadError("请输入成员名称");
      return;
    }
    if (!gameId.trim()) {
      setUploadError("请输入游戏ID");
      return;
    }
    if (!role) {
      setUploadError("请选择职位");
      return;
    }
    if (!avatarPreview) {
      setUploadError("请上传展示图片");
      return;
    }
    if (!detailPreview) {
      setUploadError("请上传详情图片");
      return;
    }
    setUploadError(null);
    setSaving(true);
    setUploading(true); // 显示上传进度

    try {
      // 上传展示图片
      let finalAvatarUrl = avatarPreview;
      if (pendingAvatar) {
        const url = await uploadToStorage(pendingAvatar, "member-photos", "avatars");
        if (url) finalAvatarUrl = url;
      }

      // 上传详情图片
      let finalDetailUrl = detailPreview;
      if (pendingDetail) {
        const url = await uploadToStorage(pendingDetail, "member-photos", "details");
        if (url) finalDetailUrl = url;
      }

      // 上传详情媒体
      const uploadMedia = async (pendingFile: File | null, currentUrl: string, index: number): Promise<{url: string, type: string}> => {
        if (!pendingFile) {
          const isVideo = currentUrl.includes("video") || [media1Type, media2Type, media3Type][index] === "video";
          return { url: currentUrl, type: isVideo ? "video" : "image" };
        }
        const isVideo = pendingFile.type.startsWith("video/");
        const bucket = isVideo ? "member-videos" : "member-photos";
        const folder = isVideo ? "videos" : "photos";
        const url = await uploadToStorage(pendingFile, bucket, folder);
        return { url: url || currentUrl, type: isVideo ? "video" : "image" };
      };

      const [result1, result2, result3] = await Promise.all([
        uploadMedia(pendingFile1, media1, 0),
        uploadMedia(pendingFile2, media2, 1),
        uploadMedia(pendingFile3, media3, 2),
      ]);

      if (isAdd) {
        await addMember({
          name: name || "新成员", role, title: "",
          avatarUrl: finalAvatarUrl, detailUrl: finalDetailUrl,
          joinDate: new Date().toISOString().split("T")[0],
          signature,
          detailMedia1: result1.url, detailMedia2: result2.url, detailMedia3: result3.url,
          detailMedia1Type: result1.type, detailMedia2Type: result2.type, detailMedia3Type: result3.type,
          userId: "", gameId, password: "123456",
        });
      } else if (editingMember) {
        const success = await updateMember(editingMember.id, {
          name, role, gameId, avatarUrl: finalAvatarUrl, detailUrl: finalDetailUrl, signature,
          detailMedia1: result1.url, detailMedia2: result2.url, detailMedia3: result3.url,
          detailMedia1Type: result1.type, detailMedia2Type: result2.type, detailMedia3Type: result3.type,
          password: editingMember.password || "123456",
        });
        if (success) {
          setEditingMember(null);
        } else {
          setUploadError("保存到数据库失败，请重试");
          setSaving(false);
          return;
        }
      }
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <LoadingOverlay show={saving} message={isAdd ? "正在录入新成员..." : "正在更新资料..."} />
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={close} />
      <div
        className="relative z-[115] bg-rice-100 rounded-lg w-[700px] max-w-[92vw] max-h-[90vh] flex flex-col border border-gold-400/20"
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/20 flex-none">
          <h2 className="font-calligraphy text-xl text-ink-800 tracking-widest">{isAdd ? "添加成员" : "编辑成员"}</h2>
          <button onClick={close} className="text-ink-600/40 hover:text-ink-800 transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex gap-6">
            {/* Left: Images */}
            <div className="w-[200px] flex-none flex flex-col gap-4">
              <ImageUpload label="展示图片" preview={avatarPreview} inputRef={avatarInputRef} onFile={handleAvatarChange} onClick={() => avatarInputRef.current?.click()} required />
              <ImageUpload label="详情图片" preview={detailPreview} inputRef={detailInputRef} onFile={handleDetailChange} onClick={() => detailInputRef.current?.click()} required />
            </div>

            {/* Right */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div>
                <label className="block text-xs font-song text-ink-600 mb-1.5 tracking-wide">成员名称<span className="text-red-500 ml-0.5">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
                  placeholder={isAdd ? "输入成员名称" : ""} />
              </div>
              <div>
                <label className="block text-xs font-song text-ink-600 mb-1.5 tracking-wide">
                  职位<span className="text-red-500 ml-0.5">*</span>{!canChangeRole && !isAdd ? "（不可修改）" : ""}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((r) => (
                    <button key={r} onClick={() => canChangeRole && setRole(r)}
                      disabled={!canChangeRole}
                      className={`px-3 py-2 rounded text-sm font-song font-medium border transition-all ${
                        role === r
                          ? "bg-gold-200/20 border-gold-400 text-ink-800"
                          : canChangeRole
                            ? "bg-rice-50 border-gold-400/20 text-ink-600 hover:border-gold-400/50"
                            : "bg-rice-100 border-gold-400/10 text-ink-600/50 cursor-not-allowed"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-song text-ink-600 mb-1.5 tracking-wide">游戏ID<span className="text-red-500 ml-0.5">*</span></label>
                <input type="text" value={gameId} onChange={(e) => setGameId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
                  placeholder="输入游戏内ID（必填，用于找回密码）" />
              </div>
              <div>
                <label className="block text-xs font-song text-ink-600 mb-1.5 tracking-wide">个性签名</label>
                <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gold-400/20 text-sm text-ink-800 font-song bg-rice-50 focus:outline-none focus:border-gold-400 transition-all"
                  placeholder="输入个性签名" />
              </div>

              <div className="border-t border-gold-400/10" />

              {/* 详情媒体 */}
              <div>
                <label className="block text-xs font-song text-ink-600 mb-2 tracking-wide">
                  详情图片/视频 <span className="text-gold-400">（最多3个，详情页可左右浏览）</span>
                </label>
                <div className="flex flex-col gap-3">
                  <DetailSlot label="第一个详情图片或视频" url={media1} type={media1Type} uploading={uploading}
                    onFileSelect={(f) => handleMediaSelect(0, f)} onRemove={() => handleMediaRemove(0)} />
                  <DetailSlot label="第二个详情图片或视频" url={media2} type={media2Type} uploading={uploading}
                    onFileSelect={(f) => handleMediaSelect(1, f)} onRemove={() => handleMediaRemove(1)} />
                  <DetailSlot label="第三个详情图片或视频" url={media3} type={media3Type} uploading={uploading}
                    onFileSelect={(f) => handleMediaSelect(2, f)} onRemove={() => handleMediaRemove(2)} />
                </div>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-gold-400 font-song">
                  <div className="w-4 h-4 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
                  上传中...
                </div>
              )}
              {uploadError && (
                <div className="px-3 py-2 rounded text-xs font-song border" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gold-400/20 flex-none">
          <button onClick={close} className="flex-1 px-4 py-2.5 rounded border border-gold-400/20 text-sm font-song text-ink-600 hover:bg-rice-200 transition-colors">取消</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded btn-ink text-sm font-song font-medium active:scale-95">
            {isAdd ? "添加" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
