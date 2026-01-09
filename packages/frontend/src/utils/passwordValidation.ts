/**
 * 密码验证工具函数
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证密码强度
 * 规则：至少8位，包含大写字母、小写字母和数字
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // 最小长度
  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }

  // 必须包含大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }

  // 必须包含小写字母
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }

  // 必须包含数字
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }

  // 不能与默认密码相同
  if (password === 'seeyao123') {
    errors.push('密码不能与默认密码相同');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 密码强度指示器
 * 返回 0-4 的强度等级
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(strength, 4);
}

/**
 * 获取密码强度文本
 */
export function getPasswordStrengthText(strength: number): string {
  const texts = ['非常弱', '弱', '中等', '强', '非常强'];
  return texts[strength] || '';
}

/**
 * 获取密码强度颜色
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = ['#ff4d4f', '#ff4d4f', '#faad14', '#52c41a', '#52c41a'];
  return colors[strength] || '#d9d9d9';
}
