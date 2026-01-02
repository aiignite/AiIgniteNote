// 为了支持全局window对象扩展
declare global {
  interface Window {
    db?: any;
  }

  namespace ImportMetaEnv {
    const VITE_API_BASE_URL: string;
    const VITE_API_URL: string;
  }

  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

export {};
