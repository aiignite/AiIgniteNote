/**
 * Draw.io 本地配置文件
 * 用于强制使用本地资源，禁用在线服务
 */

// 强制本地模式配置
window.DRAWIO_LOCAL_CONFIG = {
  mode: "local",
  // 禁用所有在线服务
  disableOnlineServices: true,
  // 启用本地存储
  enableLocalStorage: true,
  // 限制可用的图形库
  enabledLibraries: ["general", "uml", "flowchart", "bpmn", "er", "aspice"],
  // 隐藏不必要的菜单项
  hiddenMenuItems: ["file", "help", "share"],
  // 默认UI设置
  defaultUi: "kennedy",
  // 语言设置 - 简体中文
  lang: "zh",
  // 默认语言代码
  defaultLanguage: "zh",
};

// 覆盖在线服务URL为本地路径
window.DRAWIO_BASE_URL = window.location.origin;
window.DRAWIO_SERVER_URL = window.location.origin + "/drawio/";
window.DRAWIO_LIGHTBOX_URL = window.location.origin + "/drawio/viewer.html";
window.EXPORT_URL = window.location.origin + "/drawio/export";
window.PLANT_URL = window.location.origin + "/drawio/math";
window.SAVE_URL = null; // 禁用在线保存
window.OPEN_URL = null; // 禁用在线打开
window.PROXY_URL = null; // 禁用代理

// 本地资源路径配置
window.SHAPES_PATH = "shapes";
window.GRAPH_IMAGE_PATH = "img";
window.TEMPLATE_PATH = "templates";
window.RESOURCES_PATH = "resources";

// 禁用实时同步和在线功能
window.REALTIME_URL = null;
window.RT_WEBSOCKET_URL = null;
window.NOTIFICATIONS_URL = null;

// 启用本地插件
window.ALLOW_CUSTOM_PLUGINS = true;

// 禁用自动更新和在线检查
if (window.urlParams) {
  window.urlParams["dev"] = "1"; // 开发者模式
  window.urlParams["test"] = "1"; // 测试模式
  window.urlParams["local"] = "1"; // 本地模式
  window.urlParams["noSave"] = "1"; // 禁用云保存
  window.urlParams["noExitBtn"] = "0"; // 显示退出按钮
  window.urlParams["ui"] = "kennedy"; // 使用完整界面
}

// 覆盖默认的网络相关配置
if (window.EditorUi) {
  EditorUi.enableLogging = false;
  EditorUi.enableDrafts = true;
  EditorUi.nativeFileSupport = true;
}

// 设置本地存储
window.isLocalStorage = true;
