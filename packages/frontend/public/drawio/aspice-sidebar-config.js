/**
 * ASPICE 专用图形库配置
 */

// 配置ASPICE相关的图形库
window.ASPICE_SIDEBAR_CONFIG = {
    // ASPICE 系统工程元素
    systemEngineering: [
        {
            id: 'sys_requirements',
            name: '系统需求',
            style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#E6F3FF;strokeColor=#0066CC;fontSize=12;',
            width: 120, height: 60
        },
        {
            id: 'sys_architecture',
            name: '系统架构',
            style: 'shape=module;whiteSpace=wrap;html=1;fillColor=#FFF2E6;strokeColor=#FF6600;fontSize=12;',
            width: 120, height: 80
        },
        {
            id: 'sys_interface',
            name: '系统接口',
            style: 'shape=interface;whiteSpace=wrap;html=1;fillColor=#E6FFE6;strokeColor=#009900;fontSize=12;',
            width: 100, height: 60
        },
        {
            id: 'sys_validation',
            name: '系统验证',
            style: 'rhombus;whiteSpace=wrap;html=1;fillColor=#FFE6F3;strokeColor=#CC0099;fontSize=12;',
            width: 120, height: 80
        }
    ],

    // ASPICE 软件工程元素
    softwareEngineering: [
        {
            id: 'sw_requirements',
            name: '软件需求',
            style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#F0F8FF;strokeColor=#4682B4;fontSize=12;',
            width: 120, height: 60
        },
        {
            id: 'sw_architecture',
            name: '软件架构',
            style: 'shape=process;whiteSpace=wrap;html=1;fillColor=#F5F5DC;strokeColor=#8B4513;fontSize=12;',
            width: 120, height: 80
        },
        {
            id: 'sw_unit',
            name: '软件单元',
            style: 'shape=component;whiteSpace=wrap;html=1;fillColor=#F0FFF0;strokeColor=#228B22;fontSize=12;',
            width: 100, height: 60
        },
        {
            id: 'sw_test',
            name: '软件测试',
            style: 'ellipse;whiteSpace=wrap;html=1;fillColor=#FFF0F5;strokeColor=#DC143C;fontSize=12;',
            width: 100, height: 60
        }
    ],

    // ASPICE 硬件工程元素
    hardwareEngineering: [
        {
            id: 'hw_component',
            name: '硬件组件',
            style: 'shape=cube;whiteSpace=wrap;html=1;fillColor=#F0E68C;strokeColor=#B8860B;fontSize=12;',
            width: 100, height: 80
        },
        {
            id: 'hw_interface',
            name: '硬件接口',
            style: 'shape=parallelogram;whiteSpace=wrap;html=1;fillColor=#E6E6FA;strokeColor=#4B0082;fontSize=12;',
            width: 120, height: 60
        },
        {
            id: 'hw_test',
            name: '硬件测试',
            style: 'shape=cloud;whiteSpace=wrap;html=1;fillColor=#F5DEB3;strokeColor=#8B4513;fontSize=12;',
            width: 120, height: 80
        }
    ],

    // ASPICE 流程元素
    processElements: [
        {
            id: 'process',
            name: '流程',
            style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#D3D3D3;strokeColor=#696969;fontSize=12;',
            width: 120, height: 60
        },
        {
            id: 'decision',
            name: '决策',
            style: 'rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFE0;strokeColor=#FFD700;fontSize=12;',
            width: 100, height: 80
        },
        {
            id: 'data',
            name: '数据',
            style: 'shape=document;whiteSpace=wrap;html=1;fillColor=#E6E6FA;strokeColor=#4B0082;fontSize=12;',
            width: 80, height: 100
        },
        {
            id: 'connector',
            name: '连接器',
            style: 'shape=ellipse;whiteSpace=wrap;html=1;fillColor=#F0F8FF;strokeColor=#4682B4;fontSize=12;',
            width: 60, height: 40
        }
    ]
};

// 扩展Sidebar配置以包含ASPICE元素
if (typeof Sidebar !== 'undefined') {
    // 添加ASPICE配置到Sidebar
    Sidebar.prototype.aspiceEntries = ['aspice_system', 'aspice_software', 'aspice_hardware', 'aspice_process'];

    // 扩展configuration数组
    Sidebar.prototype.configuration = Sidebar.prototype.configuration || [];
    Sidebar.prototype.configuration.push(
        {id: 'aspice_system', title: 'ASPICE系统工程', libs: ['aspice_system_elements']},
        {id: 'aspice_software', title: 'ASPICE软件工程', libs: ['aspice_software_elements']},
        {id: 'aspice_hardware', title: 'ASPICE硬件工程', libs: ['aspice_hardware_elements']},
        {id: 'aspice_process', title: 'ASPICE流程', libs: ['aspice_process_elements']}
    );
}