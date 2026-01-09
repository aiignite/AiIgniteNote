import React, { useEffect, useState } from 'react';
import { authApi } from '../../lib/api/auth';
import ChangePassword from './ChangePassword';

interface FirstTimePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const FirstTimePasswordModal: React.FC<FirstTimePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPassword = async () => {
      try {
        const response = await authApi.checkDefaultPassword();
        setIsDefaultPassword(response.data.isUsingDefaultPassword);
      } catch (error) {
        console.error('Failed to check password status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      checkPassword();
    }
  }, [isOpen]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">检查中...</p>
        </div>
      </div>
    );
  }

  if (!isDefaultPassword) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">安全提示</h3>
              <p className="text-sm text-gray-600">检测到您正在使用默认密码</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium mb-2">为了您的账户安全，请立即修改密码</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 默认密码存在安全风险</li>
              <li>• 新密码必须至少8位</li>
              <li>• 必须包含大写字母、小写字母和数字</li>
              <li>• 修改后需要重新登录</li>
            </ul>
          </div>

          <ChangePassword onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};

export default FirstTimePasswordModal;
