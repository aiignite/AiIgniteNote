// 为了支持全局window对象扩展
declare global {
  interface Window {
    db?: any;
  }
}

export {};
