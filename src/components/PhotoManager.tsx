import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchAllPhotos,
  fetchPhotosByUploader,
  createPhoto,
  updatePhoto,
  deletePhoto,
  uploadToStorage,
  SupabasePhoto,
} from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import LoadingOverlay from "./LoadingOverlay";
import VideoCoverSelector from "./VideoCoverSelector";

/* ================================================================
 *  照片墙管理弹窗
 *  - 管理员（社长/副社长/指挥）：可以编辑所有照片
 *  - 社员：可以查看和管理自己上传的照片
 * ================================================================ */

interface Props {
  onClose: () => void;
  defaultMode?: "list" | "my-photos";
}

interface CropState {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function PhotoManager({ onClose, defaultMode }: Props) {
  useBodyScrollLock(true);
  const { member: currentUser } = useAuth();

  const [photos, setPhotos] = useState<SupabasePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMsg] = useState(() => [
    "稍等大侠，正在加载...",
    "运功中，请稍候...",
    "轻功施展中...",
    "正在翻山越岭...",
    "内力运转中...",
    "快马加鞭赶来...",
    "御剑飞行中...",
  ][Math.floor(Math.random() * 7)]);
  const [mode, setMode] = useState<"list" | "add" | "edit" | "my-photos">(defaultMode || "list");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // 编辑状态
  const [editingPhoto, setEditingPhoto] = useState<SupabasePhoto | null>(null);

  // 添加/编辑表单
  const [formName, setFormName] = useState("");
  const [formSrc, setFormSrc] = useState("");
  const [formRatio, setFormRatio] = useState("free");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [showCoverSelector, setShowCoverSelector] = useState(false);

  // 裁剪
  const [cropFile, setCropFile] = useState<string | null>(null);
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null);
  const [cropRect, setCropRect] = useState<CropState>({ x: 0, y: 0, w: 200, h: 150 });
  const [cropAction, setCropAction] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
  const cropStart = useRef({ mx: 0, my: 0, rect: cropRect });
  const cropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevModeRef = useRef<"list" | "my-photos">("list");

  // 权限判断
  const isAdmin = currentUser?.role === "社长" || currentUser?.role === "副社长" || currentUser?.role === "指挥";
  const isMember = currentUser?.role === "社员";

  const loadAll = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllPhotos();
    setPhotos(data);
    setLoading(false);
  }, []);

  const loadMyPhotos = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const data = await fetchPhotosByUploader(currentUser.id);
    setPhotos(data);
    setLoading(false);
  }, [currentUser?.id]);

  // 只在 list / my-photos 模式下加载数据，edit / add 不触发
  useEffect(() => {
    if (mode === "my-photos") {
      loadMyPhotos();
    } else if (mode === "list") {
      loadAll();
    }
    // mode === "edit" || mode === "add" 时不加载，避免异步请求覆盖当前数据
  }, [mode, loadAll, loadMyPhotos]);

  const filtered = photos.filter((p) => p.name.includes(search));

  // ========== 文件选择 ==========
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      // 视频：直接预览，跳过裁剪
      setMediaType("video");
      setVideoFile(file);
      setFormSrc(URL.createObjectURL(file));
      setFormRatio("free");
      setCropFile(null);
    } else {
      // 图片：进入裁剪流程
      setMediaType("image");
      setVideoFile(null);
      const url = URL.createObjectURL(file);
      setCropFile(url);
      setFormSrc("");
      setFormRatio("free");
    }
    e.target.value = "";
  };

  const handleCropImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = cropRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const dw = Math.min(cw * 0.8, img.clientWidth * 0.8);
    const dh = Math.min(ch * 0.8, img.clientHeight * 0.8);
    setCropImg(img);
    setCropRect({
      x: (cw - dw) / 2,
      y: (ch - dh) / 2,
      w: dw,
      h: dh,
    });
    img.style.width = `${cw}px`;
    img.style.height = `${ch}px`;
    img.style.objectFit = "contain";
  };

  const handleCropMouseDown = (e: React.MouseEvent, action: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    setCropAction(action);
    cropStart.current = { mx: e.clientX, my: e.clientY, rect: { ...cropRect } };
  };

  const handleCropMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!cropAction || !cropRef.current) return;
      const container = cropRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const dx = e.clientX - cropStart.current.mx;
      const dy = e.clientY - cropStart.current.my;
      const s = cropStart.current.rect;

      let next = { ...s };

      if (cropAction === "move") {
        next.x = Math.max(0, Math.min(cw - s.w, s.x + dx));
        next.y = Math.max(0, Math.min(ch - s.h, s.y + dy));
      } else {
        if (cropAction === "se") {
          next.w = Math.max(60, Math.min(cw - s.x, s.w + dx));
          next.h = Math.max(60, Math.min(ch - s.y, s.h + dy));
        } else if (cropAction === "sw") {
          next.x = Math.max(0, s.x + dx);
          next.w = Math.max(60, s.w - dx);
          next.h = Math.max(60, Math.min(ch - s.y, s.h + dy));
        } else if (cropAction === "ne") {
          next.w = Math.max(60, Math.min(cw - s.x, s.w + dx));
          next.y = Math.max(0, s.y + dy);
          next.h = Math.max(60, s.h - dy);
        } else if (cropAction === "nw") {
          next.x = Math.max(0, s.x + dx);
          next.y = Math.max(0, s.y + dy);
          next.w = Math.max(60, s.w - dx);
          next.h = Math.max(60, s.h - dy);
        }
      }
      setCropRect(next);
    },
    [cropAction]
  );

  const handleCropMouseUp = useCallback(() => setCropAction(null), []);

  useEffect(() => {
    if (cropAction) {
      window.addEventListener("mousemove", handleCropMouseMove);
      window.addEventListener("mouseup", handleCropMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleCropMouseMove);
        window.removeEventListener("mouseup", handleCropMouseUp);
      };
    }
  }, [cropAction, handleCropMouseMove, handleCropMouseUp]);

  const handleCropConfirm = () => {
    if (!cropImg || !cropRef.current) return;
    const container = cropRef.current;
    const scaleX = cropImg.naturalWidth / cropImg.clientWidth;
    const scaleY = cropImg.naturalHeight / cropImg.clientHeight;

    const canvas = document.createElement("canvas");
    const maxPx = 1200;
    const outW = Math.round(cropRect.w * scaleX);
    const outH = Math.round(cropRect.h * scaleY);
    const scale = Math.min(maxPx / outW, maxPx / outH, 1);
    canvas.width = Math.round(outW * scale);
    canvas.height = Math.round(outH * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      cropImg,
      cropRect.x * scaleX,
      cropRect.y * scaleY,
      outW,
      outH,
      0,
      0,
      canvas.width,
      canvas.height
    );
    setFormSrc(canvas.toDataURL("image/jpeg", 0.92));

    const ratio = outW / outH;
    const stdRatios: [string, number][] = [
      ["1:1", 1], ["4:3", 4/3], ["3:4", 3/4], ["16:9", 16/9], ["3:2", 3/2], ["2:3", 2/3],
    ];
    let matched = "free";
    for (const [name, std] of stdRatios) {
      if (Math.abs(ratio - std) < 0.08) { matched = name; break; }
    }
    setFormRatio(matched);

    setCropFile(null);
    setCropImg(null);
  };

  // ========== 开始编辑 ==========
  const handleStartEdit = (photo: SupabasePhoto) => {
    prevModeRef.current = mode === "edit" || mode === "add" ? prevModeRef.current : mode;
    setEditingPhoto(photo);
    setFormName(photo.name);
    setFormSrc(photo.src);
    setFormRatio(photo.ratio || "free");
    setMediaType((photo.media_type as "image" | "video") || "image");
    setVideoFile(null);
    setCoverPreview(photo.cover_url || "");
    setMode("edit");
  };

  // ========== 保存（添加或编辑） ==========
  const handleSave = async () => {
    if (!formName.trim() || !formSrc) return;
    setSaving(true);
    setSaveError(null);
    try {
      let url = formSrc;
      let coverUrl = coverPreview; // 默认保留已有封面

      if (mediaType === "video" && videoFile) {
        // 视频：直接上传原始文件
        const uploadedUrl = await uploadToStorage(videoFile, "member-photos", "wall-photos");
        if (!uploadedUrl) {
          setSaveError("上传失败，请稍后再试");
          setSaving(false);
          return;
        }
        url = uploadedUrl;

        // 上传新封面（如果是新的 data URL）
        if (coverPreview && coverPreview.startsWith("data:")) {
          const coverRes = await fetch(coverPreview);
          const coverBlob = await coverRes.blob();
          const coverFile = new File([coverBlob], "cover.jpg", { type: "image/jpeg" });
          const uploadedCover = await uploadToStorage(coverFile, "member-photos", "wall-covers");
          if (uploadedCover) {
            coverUrl = uploadedCover;
          }
        }
      } else if (formSrc.startsWith("data:")) {
        // 图片 base64：转 Blob 后上传
        const res = await fetch(formSrc);
        const blob = await res.blob();
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const uploadedUrl = await uploadToStorage(file, "member-photos", "wall-photos");
        if (!uploadedUrl) {
          setSaveError("上传失败，请稍后再试");
          setSaving(false);
          return;
        }
        url = uploadedUrl;
      }

      if (mode === "edit" && editingPhoto) {
        await updatePhoto(editingPhoto.id, {
          name: formName.trim(),
          src: url,
          ratio: mediaType === "video" ? "free" : formRatio,
          media_type: mediaType,
          cover_url: mediaType === "video" ? coverUrl : undefined,
        });
      } else {
        await createPhoto({
          name: formName.trim(),
          src: url,
          sort_order: photos.length,
          is_active: true,
          ratio: mediaType === "video" ? "free" : formRatio,
          media_type: mediaType,
          cover_url: mediaType === "video" ? coverUrl : undefined,
          uploader: currentUser?.name || "匿名",
          uploader_id: currentUser?.id,
        });
      }

      resetForm();
    } catch (e) {
      setSaveError("操作失败: " + (e instanceof Error ? e.message : String(e)));
    }
    setSaving(false);
  };

  const resetForm = () => {
    setMode(prevModeRef.current);
    setEditingPhoto(null);
    setFormName("");
    setFormSrc("");
    setFormRatio("free");
    setMediaType("image");
    setVideoFile(null);
    setCoverPreview("");
    setShowCoverSelector(false);
    setCropFile(null);
    setCropImg(null);
    setSaveError(null);
  };

  // ========== 删除 ==========
  const TOAST_MSGS = [
    "已删除！新的故事等着你来记录~",
    "清理完毕！期待你的下一张佳作",
    "删掉过往，迎接新的风景",
    "搞定！继续上传精彩瞬间吧",
    "照片已远去，回忆永留存~",
  ];

  const handleDelete = async (id: number) => {
    setDeleteId(null);
    await deletePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setToast(TOAST_MSGS[Math.floor(Math.random() * TOAST_MSGS.length)]);
    setTimeout(() => setToast(null), 2500);
  };

  // 判断是否有权编辑某张照片
  const canEditPhoto = (photo: SupabasePhoto) => {
    if (isAdmin) return true;
    if (isMember && photo.uploader_id === currentUser?.id) return true;
    return false;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <LoadingOverlay show={saving} message={
        saving
          ? mediaType === "video"
            ? (mode === "edit" ? "正在更新视频..." : "正在上传视频...")
            : (mode === "edit" ? "正在更新照片..." : "正在上传照片...")
          : ""
      } />
      <div
        className="relative w-full h-full max-w-[1400px] max-h-[90vh] mx-4 flex flex-col rounded-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/20">
          <div className="flex items-center gap-4">
            <h2 className="font-calligraphy text-gold-200 text-xl tracking-widest">
              {mode === "my-photos" ? "我的照片" : "管理照片墙"}
            </h2>
            <span className="text-xs font-song px-2 py-0.5 rounded bg-gold-400/10 text-gold-400/70">
              共 {photos.length} 张
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="搜索照片..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded text-sm font-song bg-ink-900/60 border border-gold-400/20 text-gold-200 placeholder:text-gold-200/30 outline-none focus:border-gold-400/40"
              style={{ width: 200 }}
            />
            {/* 社员显示"查看我的照片"按钮 */}
            {isMember && mode !== "my-photos" && (
              <button
                onClick={() => setMode("my-photos")}
                className="btn-ink px-4 py-1.5 rounded text-sm font-song active:scale-95"
              >
                查看我的照片
              </button>
            )}
            {/* 从"我的照片"返回全部 */}
            {mode === "my-photos" && (
              <button
                onClick={() => setMode("list")}
                className="btn-ink px-4 py-1.5 rounded text-sm font-song active:scale-95"
              >
                返回全部
              </button>
            )}
            {/* 管理员显示"添加照片"按钮 */}
            {isAdmin && mode === "list" && (
              <button
                onClick={() => { prevModeRef.current = mode; setMode("add"); }}
                className="btn-ink px-4 py-1.5 rounded text-sm font-song active:scale-95"
              >
                + 添加照片
              </button>
            )}
            {/* 社员在"我的照片"模式下显示"上传照片"按钮 */}
            {isMember && mode === "my-photos" && (
              <button
                onClick={() => { prevModeRef.current = mode; setMode("add"); }}
                className="btn-ink px-4 py-1.5 rounded text-sm font-song active:scale-95"
              >
                + 上传照片
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-gold-400/20 text-gold-200/40 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === "add" || mode === "edit" ? (
            /* ===== 添加/编辑照片面板 ===== */
            <div className="max-w-[640px] mx-auto">
              <h3 className="font-calligraphy text-gold-200 text-lg tracking-widest mb-4">
                {mode === "edit" ? "编辑照片" : "添加照片"}
              </h3>

              {/* 名称输入 */}
              <div className="mb-4">
                <label className="block font-song text-gold-200/60 text-sm mb-1.5">照片名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="输入照片名称"
                  className="w-full px-4 py-2.5 rounded font-song text-sm border border-gold-400/20 bg-ink-900/60 text-gold-200 placeholder:text-gold-200/30 outline-none focus:border-gold-400/40"
                />
              </div>

              {/* 上传按钮 */}
              {!cropFile && !formSrc && (
                <div className="mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 rounded border-2 border-dashed border-gold-400/25 bg-ink-900/40 flex flex-col items-center justify-center gap-2 hover:border-gold-400/50 hover:bg-ink-900/60 transition-all cursor-pointer"
                  >
                    <svg className="w-10 h-10 text-gold-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="font-song text-sm text-gold-200/40">点击选择文件</span>
                    <span className="font-song text-xs text-gold-200/20">支持 JPG、PNG、MP4、WebM</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* 裁剪区域 */}
              {cropFile && (
                <div className="mb-4">
                  <label className="block font-song text-gold-200/60 text-sm mb-1.5">拖拽裁剪框调整区域</label>
                  <div
                    ref={cropRef}
                    className="relative w-full rounded border border-gold-400/20 overflow-hidden select-none"
                    style={{ height: 360, background: "#0a0806" }}
                  >
                    <img
                      src={cropFile}
                      onLoad={handleCropImgLoad}
                      className="absolute inset-0 pointer-events-none"
                      draggable={false}
                    />

                    {/* 裁剪框 + box-shadow 遮罩 */}
                    <div
                      className="absolute border-2 border-white/80"
                      style={{
                        left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h,
                        cursor: "move",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
                      }}
                      onMouseDown={(e) => handleCropMouseDown(e, "move")}
                    >
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
                      </div>

                      {(["nw", "ne", "sw", "se"] as const).map((pos) => (
                        <div
                          key={pos}
                          className="absolute w-5 h-5 bg-white/80 rounded-full border border-black/30"
                          style={{
                            cursor: pos === "nw" || pos === "se" ? "nwse-resize" : "nesw-resize",
                            top: pos.includes("n") ? -10 : "auto",
                            bottom: pos.includes("s") ? -10 : "auto",
                            left: pos.includes("w") ? -10 : "auto",
                            right: pos.includes("e") ? -10 : "auto",
                          }}
                          onMouseDown={(e) => handleCropMouseDown(e, pos)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-5 rounded text-sm font-song border border-gold-400/25 text-gold-200/60 hover:text-gold-200 hover:border-gold-400/45 transition-all active:scale-[0.98]"
                    >
                      重新上传
                    </button>
                    <button
                      onClick={handleCropConfirm}
                      className="flex-1 py-2.5 rounded text-sm font-song transition-all active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #c49b30, #e9c176)",
                        color: "#0f0a05",
                        fontWeight: 600,
                      }}
                    >
                      确认裁剪
                    </button>
                  </div>
                </div>
              )}

              {/* 图片预览（悬停显示操作） */}
              {formSrc && !cropFile && mediaType === "image" && (
                <div className="mb-4">
                  <label className="block font-song text-gold-200/60 text-sm mb-1.5">预览</label>
                  <div className="group relative w-full h-48 rounded border border-gold-400/20 overflow-hidden bg-ink-900/40 cursor-pointer">
                    <img src={formSrc} className="w-full h-full object-contain" alt="预览" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setCropFile(formSrc);
                          setFormSrc("");
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-song border border-gold-400/50 text-gold-200 hover:bg-gold-400/20 backdrop-blur-sm transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                        重新裁剪
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-song border border-gold-400/50 text-gold-200 hover:bg-gold-400/20 backdrop-blur-sm transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        重新上传
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 视频预览 + 封面选择 */}
              {formSrc && mediaType === "video" && (
                <div className="mb-4">
                  <label className="block font-song text-gold-200/60 text-sm mb-1.5">视频预览</label>
                  <div className="w-full rounded border border-gold-400/20 overflow-hidden bg-ink-900/40">
                    <video src={formSrc} controls className="w-full max-h-64 object-contain" />
                  </div>

                  {/* 封面选择 */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => setShowCoverSelector(true)}
                      className="px-4 py-2 rounded text-xs font-song border border-gold-400/30 text-gold-200/70 hover:text-gold-200 hover:border-gold-400/50 transition-colors"
                    >
                      {coverPreview ? "重新选择封面" : "选择视频封面"}
                    </button>
                    {coverPreview && (
                      <div className="flex items-center gap-2">
                        <img src={coverPreview} className="w-10 h-14 rounded object-cover border border-gold-400/20" alt="封面" />
                        <button
                          onClick={() => setCoverPreview("")}
                          className="text-xs font-song text-gold-200/30 hover:text-red-400 transition-colors"
                        >
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                  {coverPreview && (
                    <p className="font-song text-xs text-gold-200/30 mt-1">已选择封面，将在照片墙中展示此图</p>
                  )}

                  <button
                    onClick={() => { setFormSrc(""); setMediaType("image"); setVideoFile(null); setCoverPreview(""); }}
                    className="mt-2 text-xs font-song text-gold-200/40 hover:text-gold-200/70 transition-colors"
                  >
                    重新选择
                  </button>
                </div>
              )}

              {/* 视频封面选择器 */}
              {showCoverSelector && formSrc && (
                <VideoCoverSelector
                  videoUrl={formSrc}
                  initialCover={coverPreview || undefined}
                  onConfirm={(cover) => {
                    setCoverPreview(cover);
                    setShowCoverSelector(false);
                  }}
                  onCancel={() => setShowCoverSelector(false)}
                />
              )}

              {/* 错误提示 */}
              {saveError && (
                <div className="mb-3 px-4 py-2 rounded text-sm font-song border" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
                  {saveError}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim() || !formSrc}
                  className="flex-1 py-2.5 rounded text-sm font-song transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #c49b30, #e9c176)",
                    color: "#0f0a05",
                    fontWeight: 600,
                    opacity: saving || !formName.trim() || !formSrc ? 0.5 : 1,
                    cursor: saving || !formName.trim() || !formSrc ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded text-sm font-song border border-gold-400/20 text-gold-200/50 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
                >
                  返回
                </button>
              </div>
            </div>
          ) : (
            /* ===== 照片列表 ===== */
            <div>
              {loading ? (
                <div className="text-center py-16">
                  <div className="wuxia-spinner inline-block mb-3">
                    <svg viewBox="0 0 120 120" width="48" height="48">
                      <circle cx="60" cy="60" r="12" fill="#e9c176" opacity="0.9" />
                      <path d="M60 38 L44 52 L76 52 Z" fill="#c49b30" opacity="0.85" />
                      <line x1="60" y1="48" x2="60" y2="28" stroke="#e9c176" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="56" y1="31" x2="64" y2="31" stroke="#c49b30" strokeWidth="2" strokeLinecap="round" />
                      <path d="M48 56 Q38 68 42 80" fill="none" stroke="#e9c176" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
                      <path d="M72 56 Q82 68 78 80" fill="none" stroke="#e9c176" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="font-song text-gold-200/40 text-sm">{loadingMsg}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-song text-gold-200/30 text-sm">
                    {search ? "未找到匹配照片" : mode === "my-photos" ? "你还没有上传过照片" : "暂无照片，点击「添加照片」开始"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filtered.map((p) => (
                    <div key={p.id} className="group relative">
                      <div className="aspect-[4/3] rounded overflow-hidden border border-gold-400/10 relative">
                        {p.media_type === "video" && p.cover_url ? (
                          <img
                            src={p.cover_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : p.media_type === "video" ? (
                          <video
                            src={p.src}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                          />
                        ) : (
                          <img
                            src={p.src}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {/* 视频播放图标 */}
                        {p.media_type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                              <svg className="w-4 h-4 text-gold-200 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 font-song text-xs text-gold-200/60 truncate">{p.name}</p>
                      {p.uploader && (
                        <p className="font-song text-xs text-gold-200/30 truncate">上传者: {p.uploader}</p>
                      )}
                      {/* 悬停操作 */}
                      {canEditPhoto(p) && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                          {/* 编辑按钮 */}
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs border border-gold-400/40 bg-black/60 text-gold-400 hover:bg-gold-400/20 backdrop-blur-sm"
                            title="编辑"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          {/* 删除按钮 */}
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs border border-red-400/40 bg-black/60 text-red-400 hover:bg-red-400/20 backdrop-blur-sm"
                            title="删除"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {deleteId !== null && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-80 rounded-lg p-5 text-center border border-gold-400/20"
            style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-song text-gold-200 text-sm mb-4">确认删除此照片？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded text-sm font-song border border-gold-400/20 text-gold-200/50 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 rounded text-sm font-song border border-red-400/40 text-red-400 hover:bg-red-400/10 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除成功趣味提示 */}
      {toast && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[230] px-6 py-3 rounded-lg font-song text-sm pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(30,25,18,0.95), rgba(20,16,10,0.95))",
            border: "1px solid rgba(233,193,118,0.35)",
            color: "#e9c176",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(233,193,118,0.1)",
            animation: "toastIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
