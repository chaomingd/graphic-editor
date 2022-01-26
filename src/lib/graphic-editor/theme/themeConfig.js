const primaryColor = '#16c2c2'

// 大组件的宽高（包含小组件和一个间隔）
const componentGroup = {
  width: 276,
  height: 708 + 96 + 34
}

// 小组件的宽高（只包含基本元件）
const component = {
  width: 276,
  height: 708
}

// 绑定数据的颜色
const bindDataColor = '#44D7B6'

export default {
  grid: [23, 23],
  primaryColor: primaryColor,
  stroke: '#0C1B32',
  fill: '#0C1B32',
  // 大组件包含间隔和组件
  componentGroup: componentGroup,
  // 组件
  component: component,
  // 基础元件
  baseComponent: {
    // 默认颜色
    defaultStyle: {
      stroke: '#0C1B32',
      fill: '#0C1B32'
    },
    // 激活
    activeStyle: {
      fill: primaryColor,
      stroke: primaryColor
    },
    // 拖拽
    dragStyle: {
      fill: primaryColor,
      stroke: primaryColor
    },
    // 数据绑定后
    bindDataStyle: {
      fill: bindDataColor,
      stroke: bindDataColor
    },
    // 有数据
    onStyle: {
      fill: bindDataColor,
      stroke: bindDataColor
    },
    // 无数据
    offStyle: {
      fill: '#F44444',
      stroke: '#F44444'
    }
  },
  // 组件线框（间隔）
  componentWireframe: {
    // 边框
    border: {
      stroke: '#E3E8F1',
      dash: [5, 5],
      strokeWidth: 1
    },
    // 默认
    defaultStyle: {
      stroke: '#E3E8F1',
      dash: [5, 5],
      strokeWidth: 1,
      dashEnabled: true,
      selected: false
    },
    // 选中
    selectStyle: {
      fill: '#fff',
      stroke: primaryColor,
      strokeWidth: 1,
      dashEnabled: false,
      selected: true
    }
  },
  // 边沿矩形
  edageBox: {
    dragStyle: {
      fill: 'rgba(19, 194, 194, 0.1)',
      stroke: primaryColor,
      dashEnabled: true
    },
    selectStyle: {
      fill: 'rgba(19, 194, 194, 0.2)',
      stroke: 'transparent',
      dashEnabled: false
    },
    // 绑定数据后的样式
    bindDataStyle: {
      dragStyle: {
        fill: 'rgba(68, 215, 182, 0.1)',
        stroke: 'rgb(68, 215, 182)',
        dashEnabled: true
      },
      selectStyle: {
        fill: 'rgba(68, 215, 182, 0.2)',
        stroke: 'transparent',
        dashEnabled: false
      }
    }
  },
  // 圆形控制点
  controlPoint: {
    style: {
      strokeWidth: 1,
      radius: 3
    },
    defaultStyle: {
      fill: '#ffffff',
      stroke: '#4C84FF'
    },
    // 碰撞后的样式
    collisionStyle: {
      fill: '#5064FF',
      stroke: '#5064FF'
    }
  },
  // 矩形控制点
  controlPointRect: {
    style: {
      strokeWidth: 1,
      width: 6,
      height: 6,
      fill: '#ffffff',
      stroke: primaryColor
    }
  },
  // 绑定数据的UI样式
  bindDataUI: {
    style: {
      fill: 'rgba(68, 215, 182, 0.2)',
      cornerRadius: 4
    },
    textStyle: {
      fill: bindDataColor,
      fontSize: 12,
      x: 10,
      y: 7,
      text: '已绑定数据'
    }
  },
  // 数据预览
  dataPreview: {
    style: {
      fill: primaryColor
    },
    boxStyle: {
      height: 94,
      width: component.width
    }
  },
  // 吸附辅助线
  snappingGuideLine: {
    style: {
      stroke: primaryColor,
      strokeWidth: 1,
      dash: [4, 6]
    }
  },
  // 选框
  selectionBox: {
    style: {
      fill: 'rgb(170, 176, 189, 0.2)',
      stroke: '#AAB0BD',
      strokeWidth: 2
    }
  }
}
