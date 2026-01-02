// simple-mind-map 类型声明
declare module "simple-mind-map" {
  export interface MindMapData {
    data: any;
    text?: string;
    children?: MindMapData[];
  }

  export interface MindMapOptions {
    el: HTMLElement;
    data: any;
    layout?: string;
    theme?: string;
    enableZoom?: boolean;
    mouseWheelZoom?: boolean;
    readonly?: boolean;
    enableShortCut?: boolean;
    enableNodeEdit?: boolean;
    enableNodeRichText?: boolean;
    enableFreeDrag?: boolean;
    selectTranslateStep?: number;
    selectTranslateLimit?: number;
    autoMoveWhenMouseInEdgeOnDrag?: boolean;
    dragPlaceholderRectFill?: string;
    dragMultiNodeRectConfig?: {
      width: number;
      height: number;
      fill: string;
    };
    dragOpacityConfig?: {
      cloneNodeOpacity: number;
      beingDragNodeOpacity: number;
    };
  }

  export default class MindMap {
    constructor(options: MindMapOptions);
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
    getData(withConfig?: boolean): any;
    setData(data: any): void;
    setLayout(layout: string): void;
    setTheme(theme: string): void;
    execCommand(command: string): void;
    export(format: string, isDownload: boolean): Promise<Blob>;
    destroy(): void;
    resize(): void;
    renderer: {
      activeNodeList: any[];
      copy(): void;
      cut(): void;
      paste(): void;
    };
    view: {
      enlarge(): void;
      narrow(): void;
      fit(): void;
    };
    static usePlugin(plugin: any): void;
  }
}

declare module "simple-mind-map-plugin-themes" {
  import MindMap from "simple-mind-map";
  export default {
    init(mindMap: typeof MindMap): void;
  };
}

declare module "simple-mind-map/src/plugins/Select.js" {
  export default {};
}

declare module "simple-mind-map/src/plugins/Drag.js" {
  export default {};
}
