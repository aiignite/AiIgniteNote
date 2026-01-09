import React, { useState } from 'react';
import { authApi } from '../../lib/api/auth';
import { validatePassword, getPasswordStrength, getPasswordStrengthColor } from '../../utils/passwordValidation';

interface ChangePasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onSuccess, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 验证
    if (!currentPassword) {
      setError('请输入当前密码');
      return;
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (currentPassword === newPassword) {
      setError('新密码不能与当前密码相同');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // 3秒后自动跳转或关闭
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          // 清除本地存储，强制重新登录
          localStorage.removeItem('auth_storage');
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || '修改密码失败，请重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    show: boolean,
    onToggleShow: () => void,
    placeholder: string,
    name: string
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {show ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  );

  const renderPasswordRequirements = () => {
    const requirements = [
      { text: '至少8位', met: newPassword.length >= 8 },
      { text: '包含大写字母', met: /[A-Z]/.test(newPassword) },
      { text: '包含小写字母', met: /[a-z]/.test(newPassword) },
      { text: '包含数字', met: /[0-9]/.test(newPassword) },
    ];

    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">密码要求：</p>
        <ul className="space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center text-sm">
              <span className={`mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`}>
                {req.met ? '✓' : '○'}
              </span>
              <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                {req.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderPasswordStrengthBar = () => {
    if (!newPassword) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">密码强度</span>
          <span
            className="text-sm font-medium"
            style={{ color: getPasswordStrengthColor(passwordStrength) }}
          >
            {['非常弱', '弱', '中等', '强', '非常强'][passwordStrength]}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              className="h-1 flex-1 rounded"
              style={{
                backgroundColor:
                  level < passwordStrength
                    ? getPasswordStrengthColor(passwordStrength)
                    : '#e5e7eb',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">修改密码</h2>

      {success ? (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-center font-medium">
            ✓ 密码修改成功！即将跳转到登录页面...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {renderPasswordInput(
            '当前密码',
            currentPassword,
            setCurrentPassword,
            showPassword.current,
            () => setShowPassword({ ...showPassword, current: !showPassword.current }),
            '请输入当前密码',
            'current-password'
          )}

          {renderPasswordInput(
            '新密码',
            newPassword,
            setNewPassword,
            showPassword.new,
            () => setShowPassword({ ...showPassword, new: !showPassword.new }),
            '请输入新密码',
            'new-password'
          )}

          {renderPasswordStrengthBar()}
          {renderPasswordRequirements()}

          {renderPasswordInput(
            '确认新密码',
            confirmPassword,
            setConfirmPassword,
            showPassword.confirm,
            () => setShowPassword({ ...showPassword, confirm: !showPassword.confirm }),
            '请再次输入新密码',
            'confirm-password'
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '修改中...' : '确认修改'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default ChangePassword;
