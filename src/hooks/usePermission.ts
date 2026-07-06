import { useAuth } from "../contexts/AuthContext";
import type { PermissionLevel } from "../contexts/AuthContext";

/**
 * 权限等级：
 * V1 (社长): 全部权限，可编辑/删除成员
 * V2 (副社长): 全部权限，可编辑/删除成员（不能改社长）
 * V3 (指挥): 添加成员 + 照片墙管理
 * V4 (社员): 上传/查看/下载照片
 * V5 (观众): 仅查看
 */
export function usePermission() {
  const { member, level } = useAuth();

  return {
    /** 当前用户是否已登录 */
    isLoggedIn: !!member,
    /** 当前用户的 member 记录 */
    member,
    /** 权限等级 */
    level,

    // === 成员管理权限 ===
    /** 可以查看成员详情（所有人） */
    canViewMember: true,
    /** 可以添加成员 (V1, V2, V3) */
    canAddMember: level <= 3,
    /** 可以编辑成员 (V1, V2) */
    canEditMember: level <= 2,
    /** 可以删除成员 (V1, V2) */
    canDeleteMember: level <= 2,

    // === 照片墙权限 ===
    /** 可以查看照片墙（所有人） */
    canViewPhotos: true,
    /** 可以上传照片到照片墙 (V1, V2, V3, V4) */
    canUploadPhoto: level <= 4,
    /** 可以编辑照片信息 (V1, V2, V3) */
    canEditPhoto: level <= 3,
    /** 可以删除照片 (V1, V2, V3) */
    canDeletePhoto: level <= 3,
    /** 可以下载照片（所有人） */
    canDownloadPhoto: true,

    // === UI 显示 ===
    /** 显示管理照片墙按钮 (V1, V2, V3) */
    showPhotoManager: level <= 3,
    /** 可以管理照片墙（增删改） (V1, V2, V3) */
    canManagePhoto: level <= 3,
    /** 显示添加成员按钮 (V1, V2, V3) */
    showAddMember: level <= 3,
    /** 显示卡片编辑/删除按钮 (V1, V2) */
    showCardActions: level <= 2,
    /** 可以修改主页背景 (V1, V2, V3) */
    canChangeBackground: level <= 3,
  };
}
