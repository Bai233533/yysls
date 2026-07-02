import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchAllPhotos,
  createPhoto,
  updatePhoto,
  deletePhoto,
  SupabasePhoto,
} from "../lib/supabase";
import { useStore } from "../store/useStore";

/* ================================================================
 *  照片墙管理弹窗
 *  - 浏览所有照片（含未启用）
 *  - 编辑名称 / 替换图片
 *  - 新增照片
 *  - 删除照片
 * ================================================================ */

interface Props {
  onClose: () => void;
}

type EditState = {
  photo: SupabasePhoto;
  mode: "edit";
} | {
  mode: "add";
} | null;

export default function PhotoManager({ onClose }: Props) {
  const loadWallPhotos = useStore((s) => s.loadWallPhotos);

  const [photos, setPhotos] = useState<SupabasePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);

  // 编辑表单
  const [formName, setFormName] = useState("");
  const [formSrc, setFormSrc] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  // 裁剪相关
  const [cropFile, setCropFile] = useState<string | null>(null);
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDragging, setCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const cropRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 删除确认
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 搜索
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllPhotos();
    setPhotos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 关闭滚动穿透
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const filtered = photos.filter(
    (p) => p.name.includes(search) || p.src.includes(search)
  );

  // ========== 表单操作 ==========
  const openEdit = (photo: SupabasePhoto) => {
    setFormName(photo.name);
    setFormSrc(photo.src);
    setFormOrder(photo.sort_order);
    setFormActive(photo.is_active);
    setCropFile(null);
    setCropImg(null);
    setEditState({ photo, mode: "edit" });
  };

  const openAdd = () => {
    setFormName("");
    setFormSrc("");
    setFormOrder(photos.length);
    setFormActive(true);
    setCropFile(null);
    setCropImg(null);
    setEditState({ mode: "add" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropFile(url);
    setFormSrc("");
  };

  const handleCropImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = cropRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    // 16:9 比例
    const ratio = 16 / 9;
    let dw: number, dh: number;
    if (cw / ch > ratio) {
      dh = ch;
      dw = dh * ratio;
    } else {
      dw = cw;
      dh = dw / ratio;
    }
    setCropImg(img);
    setCropOffset({ x: (cw - dw) / 2, y: (ch - dh) / 2 });
    img.style.width = `${dw}px`;
    img.style.height = `${dh}px`;
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setCropDragging(true);
    setCropDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleCropMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!cropDragging || !cropImg || !cropRef.current) return;
      const cw = cropRef.current.clientWidth;
      const ch = cropRef.current.clientHeight;
      const iw = cropImg.clientWidth;
      const ih = cropImg.clientHeight;
      let nx = e.clientX - cropDragStart.x;
      let ny = e.clientY - cropDragStart.y;
      nx = Math.min(0, Math.max(cw - iw, nx));
      ny = Math.min(0, Math.max(ch - ih, ny));
      setCropOffset({ x: nx, y: ny });
    },
    [cropDragging, cropDragStart, cropImg]
  );

  const handleCropMouseUp = useCallback(() => {
    setCropDragging(false);
  }, []);

  useEffect(() => {
    if (cropDragging) {
      window.addEventListener("mousemove", handleCropMouseMove);
      window.addEventListener("mouseup", handleCropMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleCropMouseMove);
        window.removeEventListener("mouseup", handleCropMouseUp);
      };
    }
  }, [cropDragging, handleCropMouseMove, handleCropMouseUp]);

  const handleCropConfirm = () => {
    if (!cropImg || !cropRef.current) return;
    const container = cropRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // 计算裁剪区域在原图中的比例
    const scaleX = cropImg.naturalWidth / cropImg.clientWidth;
    const scaleY = cropImg.naturalHeight / cropImg.clientHeight;
    const sx = -cropOffset.x * scaleX;
    const sy = -cropOffset.y * scaleY;
    const sw = cw * scaleX;
    const sh = ch * scaleY;
    ctx.drawImage(cropImg, sx, sy, sw, sh, 0, 0, 1920, 1080);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setFormSrc(dataUrl);
    setCropFile(null);
    setCropImg(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    if (editState?.mode === "edit") {
      await updatePhoto(editState.photo.id, {
        name: formName.trim(),
        src: formSrc,
        sort_order: formOrder,
        is_active: formActive,
      });
    } else {
      await createPhoto({
        name: formName.trim(),
        src: formSrc || "https://picsum.photos/seed/new/400/400",
        sort_order: formOrder,
        is_active: formActive,
      });
    }
    await loadAll();
    await loadWallPhotos();
    setEditState(null);
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    await deletePhoto(id);
    await loadAll();
    await loadWallPhotos();
    setDeleteId(null);
  };

  const handleToggleActive = async (photo: SupabasePhoto) => {
    await updatePhoto(photo.id, { is_active: !photo.is_active });
    await loadAll();
    await loadWallPhotos();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-[1400px] max-h-[90vh] mx-4 flex flex-col rounded-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/20">
          <h2 className="font-calligraphy text-gold-200 text-xl tracking-widest">管理照片墙</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="搜索照片..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded text-sm font-song bg-ink-900/60 border border-gold-400/20 text-gold-200 placeholder:text-gold-200/30 outline-none focus:border-gold-400/40"
              style={{ width: 200 }}
            />
            <button
              onClick={openAdd}
              className="btn-ink px-4 py-1.5 rounded text-sm font-song active:scale-95"
            >
              + 添加照片
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-gold-400/20 flex items-center justify-center text-gold-200/50 hover:text-gold-200 hover:border-gold-400/50 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 照片网格 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gold-200/40 font-song text-sm">加载中...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-gold-200/40 font-song text-sm">暂无照片</p>
              <button onClick={openAdd} className="btn-ink px-4 py-2 rounded text-sm font-song">
                添加第一张照片
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-gold-400/10 hover:border-gold-400/30 transition-all"
                  style={{ background: "rgba(26,21,16,0.8)" }}
                >
                  {/* 缩略图 */}
                  <div className="aspect-square overflow-hidden bg-black/40">
                    <img
                      src={photo.src}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  {/* 信息 */}
                  <div className="px-3 py-2">
                    <p className="font-song text-xs text-gold-200 truncate">{photo.name}</p>
                    <p className="font-song text-[10px] text-gold-200/30 mt-0.5">
                      排序: {photo.sort_order} · {photo.is_active ? "启用" : "隐藏"}
                    </p>
                  </div>
                  {/* 操作按钮 */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleActive(photo)}
                      className="w-7 h-7 rounded flex items-center justify-center text-xs transition-all"
                      style={{
                        background: photo.is_active ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                        border: `1px solid ${photo.is_active ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
                        color: photo.is_active ? "#4ade80" : "#f87171",
                      }}
                      title={photo.is_active ? "点击隐藏" : "点击显示"}
                    >
                      {photo.is_active ? "✓" : "✕"}
                    </button>
                    <button
                      onClick={() => openEdit(photo)}
                      className="w-7 h-7 rounded flex items-center justify-center text-xs"
                      style={{ background: "rgba(193,155,77,0.3)", border: "1px solid rgba(193,155,77,0.5)", color: "#e9c176" }}
                      title="编辑"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setDeleteId(photo.id)}
                      className="w-7 h-7 rounded flex items-center justify-center text-xs"
                      style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171" }}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div className="px-6 py-3 border-t border-gold-400/10 flex items-center justify-between">
          <span className="font-song text-xs text-gold-200/30">
            共 {photos.length} 张照片，显示 {filtered.length} 张
          </span>
          <span className="font-song text-xs text-gold-200/30">
            {photos.filter((p) => p.is_active).length} 张启用
          </span>
        </div>
      </div>

      {/* ========== 编辑/新增弹窗 ========== */}
      {editState && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setEditState(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-lg p-6 mx-4"
            style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)", border: "1px solid rgba(193,155,77,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-calligraphy text-gold-200 text-lg mb-4 tracking-wider">
              {editState.mode === "edit" ? "编辑照片" : "添加照片"}
            </h3>

            {/* 名称 */}
            <label className="block mb-3">
              <span className="font-song text-xs text-gold-200/50 mb-1 block">照片名称</span>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="输入照片名称"
                className="w-full px-3 py-2 rounded text-sm font-song bg-ink-900/60 border border-gold-400/20 text-gold-200 placeholder:text-gold-200/30 outline-none focus:border-gold-400/40"
              />
            </label>

            {/* 排序 */}
            <label className="block mb-3">
              <span className="font-song text-xs text-gold-200/50 mb-1 block">排序顺序</span>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded text-sm font-song bg-ink-900/60 border border-gold-400/20 text-gold-200 outline-none focus:border-gold-400/40"
              />
            </label>

            {/* 启用开关 */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <div
                onClick={() => setFormActive(!formActive)}
                className="w-10 h-5 rounded-full relative transition-all cursor-pointer"
                style={{
                  background: formActive ? "rgba(34,197,94,0.4)" : "rgba(100,100,100,0.3)",
                  border: `1px solid ${formActive ? "rgba(34,197,94,0.6)" : "rgba(100,100,100,0.4)"}`,
                }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    left: formActive ? 21 : 1,
                    background: formActive ? "#4ade80" : "#888",
                  }}
                />
              </div>
              <span className="font-song text-xs text-gold-200/50">
                {formActive ? "照片墙中显示" : "照片墙中隐藏"}
              </span>
            </label>

            {/* 图片预览 / 上传 */}
            <div className="mb-4">
              <span className="font-song text-xs text-gold-200/50 mb-1 block">照片预览</span>
              {cropFile ? (
                <div>
                  <div
                    ref={cropRef}
                    className="relative w-full bg-black overflow-hidden select-none rounded"
                    style={{ height: 240 }}
                  >
                    <img
                      ref={imgRef}
                      src={cropFile}
                      alt="crop"
                      className="absolute pointer-events-none select-none"
                      style={{ userSelect: "none", ["WebkitUserDrag" as string]: "none" }}
                      onLoad={handleCropImgLoad}
                      onMouseDown={handleCropMouseDown}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleCropConfirm} className="btn-ink px-4 py-1.5 rounded text-xs font-song flex-1">
                      确认裁剪
                    </button>
                    <button
                      onClick={() => { setCropFile(null); setCropImg(null); }}
                      className="px-4 py-1.5 rounded text-xs font-song flex-1"
                      style={{ background: "rgba(100,100,100,0.2)", border: "1px solid rgba(100,100,100,0.3)", color: "#aaa" }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {formSrc && (
                    <img src={formSrc} alt="preview" className="w-20 h-20 object-cover rounded border border-gold-400/20" />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ink px-4 py-2 rounded text-sm font-song"
                  >
                    {formSrc ? "更换图片" : "选择图片"}
                  </button>
                  {formSrc && (
                    <button
                      onClick={() => setFormSrc("")}
                      className="px-3 py-2 rounded text-xs font-song"
                      style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                    >
                      清除
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="btn-ink px-5 py-2 rounded text-sm font-song flex-1 active:scale-95 disabled:opacity-40"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                onClick={() => setEditState(null)}
                className="px-5 py-2 rounded text-sm font-song flex-1"
                style={{ background: "rgba(100,100,100,0.2)", border: "1px solid rgba(100,100,100,0.3)", color: "#aaa" }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 删除确认 ========== */}
      {deleteId !== null && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setDeleteId(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-lg p-6 mx-4 text-center"
            style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)", border: "1px solid rgba(239,68,68,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-calligraphy text-gold-200 text-lg mb-2">确认删除</p>
            <p className="font-song text-sm text-gold-200/50 mb-6">删除后不可恢复，确定要删除这张照片吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 rounded text-sm font-song flex-1 active:scale-95"
                style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171" }}
              >
                确认删除
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded text-sm font-song flex-1"
                style={{ background: "rgba(100,100,100,0.2)", border: "1px solid rgba(100,100,100,0.3)", color: "#aaa" }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
