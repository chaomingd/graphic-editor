import {
  listen
} from '../utils/dom'
import ContextMenu from '../ui/ContextMenu'
import Vue from 'vue'
import BaseComponent from '../components/base/BaseComponent'
import Component from '../components/base/Component'
import ComponentGroup from '../components/base/ComponentGroup'
import NormalGroup from '../components/base/NormalGroup'
const ContextMenuVue = Vue.extend(ContextMenu)

// 取消组合 -> 内置命令 （查看Command.js）
function cancelCombinationAction (...args) {
  return {
    action: 'cancelCombination',
    actionName: '取消组合',
    args: args
  }
}

// 组合 -> 内置命令 （查看Command.js）
function combinationAction () {
  return {
    action: 'combination',
    actionName: '组合'
  }
}

// 基本操作选项 内置命令 （查看Command.js）
function getBaseMenuData () {
  return [
    {
      action: 'copy',
      actionName: '复制'
    },
    {
      action: 'reflectionY',
      actionName: '图形镜像'
    },
    {
      action: 'rotate',
      actionName: '旋转',
      children: [
        {
          action: 'rotateLeft',
          actionName: '旋转-90°'
        },
        {
          action: 'rotateRight',
          actionName: '旋转+90°'
        }
      ]
    },
    {
      action: 'sort',
      actionName: '顺序',
      children: [
        {
          action: 'moveToTop',
          actionName: '置于顶层'
        },
        {
          action: 'moveToBottom',
          actionName: '置于底层'
        },
        {
          action: 'moveUp',
          actionName: '上移一层'
        },
        {
          action: 'moveDown',
          actionName: '下移一层'
        }
      ]
    },
    {
      action: 'remove',
      actionName: '删除'
    }
  ]
}

// 元素所在的分组
function groupInWhich (target) {
  if (!target) return null
  const layer = target.getLayer()
  while (target && !(target instanceof ComponentGroup)) {
    if (target === layer) return null
    target = target.getParent()
  }
  return target
}

// 生成右键菜单列表
function generateMenuData (selectedElements) {
  let baseMenuData = getBaseMenuData()
  // 选中一个元素时
  if (selectedElements.length === 1) {
    const selectedElement = selectedElements[0]
    if (Component.isComponent(selectedElement) || ComponentGroup.isComponentGroup(selectedElement)) {
      // 组件
      // 如果当前组件在分组中则添加取消分组的操作
      const group = groupInWhich(selectedElement.getParent())
      if (group) {
        baseMenuData.push(cancelCombinationAction(group))
      }
    } else if (BaseComponent.isBaseComponent(selectedElement)) {
      // 如果选中的元素是 “间隔” 并且处于分组中,添加取消分组的操作
      const group = groupInWhich(selectedElement.getParent())
      if (group) {
        baseMenuData.push(cancelCombinationAction(group))
      }
    } else if (NormalGroup.isNormalGroup(selectedElement)) {
      // 分组
      baseMenuData.push(cancelCombinationAction())
    }
  } else {
    // 多选
    baseMenuData.push(combinationAction())
  }
  return baseMenuData
}

// 更新右键菜单位置
function updateContextMenuPosition (e, container, ContextMenuVm) {
  const containerRect = container.getBoundingClientRect()
  const contextMenuRect = ContextMenuVm.$el.getBoundingClientRect()
  let top = e.clientY - containerRect.top
  const left = Math.min(e.clientX - containerRect.left, containerRect.width - contextMenuRect.width)
  if (top + contextMenuRect.height > containerRect.height) {
    top -= contextMenuRect.height
  }
  ContextMenuVm.updatePosition(top, left)
}

// 注册右键菜单交互
export function registerContextMenuInteraction ({ container, selectionStore, command, isComponentEditor = false }) {
  const ContextMenuVm = new ContextMenuVue()
  ContextMenuVm.$mount()
  const contextMenuUnlisten = listen(container, 'contextmenu', (e) => {
    e.preventDefault()
    // 只有选中了元素才会打开右键菜单
    const selectedElements = selectionStore.getActiveElement()
    if (!selectedElements.length) return
    if (ContextMenuVm.$el.parentNode !== container) {
      container.appendChild(ContextMenuVm.$el)
    }
    // 如果是组件编辑则只需要设置一次
    if (isComponentEditor) {
      if (ContextMenuVm.menuDatas.length === 0) {
        ContextMenuVm.updateMenu(getBaseMenuData())
      }
    } else {
      ContextMenuVm.updateMenu(generateMenuData(selectedElements))
    }
    ContextMenuVm.show = true
    ContextMenuVm.$nextTick(() => {
      updateContextMenuPosition(e, container, ContextMenuVm)
    })
  })
  ContextMenuVm.$on('menuClick', (item) => {
    const actionType = item.action
    command.exec(actionType, item.args)
    ContextMenuVm.show = false
  })
  const unClickListen = listen(container, 'click', e => {
    if (!ContextMenuVm.$el.contains(e.target)) {
      ContextMenuVm.show = false
    }
  })
  return {
    destroy () {
      contextMenuUnlisten()
      unClickListen()
      ContextMenuVm.$el.parentNode && ContextMenuVm.$el.parentNode.removeChild(ContextMenuVm.$el)
      ContextMenuVm.$destroy()
    }
  }
}
