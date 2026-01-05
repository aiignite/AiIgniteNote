/**
 * 权限控制辅助工具
 * 用于检查用户是否有权访问/修改资源
 */

/**
 * 构建查询条件：用户只能看到自己的数据 + 公有的数据
 */
export function buildUserQuery(userId: string) {
  return {
    OR: [
      { userId }, // 用户自己的数据
      { isPublic: true }, // 公有的数据
    ],
  };
}

/**
 * 检查用户是否有权修改资源
 * @param resourceUserId 资源创建者 ID
 * @param currentUserId 当前用户 ID
 * @returns 是否有权限
 */
export function canModify(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

/**
 * 检查用户是否有权删除资源
 * @param resourceUserId 资源创建者 ID
 * @param currentUserId 当前用户 ID
 * @returns 是否有权限
 */
export function canDelete(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

/**
 * 检查用户是否有权查看资源
 * @param resourceUserId 资源创建者 ID
 * @param currentUserId 当前用户 ID
 * @param isPublic 是否是公有资源
 * @returns 是否有权限
 */
export function canView(
  resourceUserId: string,
  currentUserId: string,
  isPublic: boolean
): boolean {
  return resourceUserId === currentUserId || isPublic;
}
