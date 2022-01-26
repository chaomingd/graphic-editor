/**
 * 拖拽创建元件
*/
import wiringDiagramComponents from '../components/index'
import { transformPointByPointer } from '../utils/index'
import { createNodesByJSON } from '../utils/nodeUtils'
import ComponentNames from '../components/base/ComponentNames'

// 从dataTransfer中获取数据
function getJSONFromDataTransfer (e) {
  let jsonStr = e.dataTransfer.getData('text')
  if (!jsonStr) return null
  try {
    jsonStr = JSON.parse(jsonStr)
  } catch (e) {
    jsonStr = null
  }
  return jsonStr
}

// 注册拖放交互
export function registerDropInteraction ({ stage, layer, command }) {
  const container = stage.getContainer()
  const dropFunc = e => {
    const json = getJSONFromDataTransfer(e)
    if (json) {
      stage.setPointersPositions(e)
      let component
      // 创建基础元件
      if (json.type === ComponentNames.BaseComponent) {
        const Constructor = wiringDiagramComponents[json.name]
        component = new Constructor({
          draggable: true
        })
      } else if (json.type === ComponentNames.ComponentGroup) {
        // 创建组件
        const components = createNodesByJSON(json.data)
        if (components.length) {
          component = components[0]
          component.draggable(true)
        }
      }
      if (component) {
        component.position(transformPointByPointer(stage, stage.getPointerPosition()))
        command.selectElement(component)
        layer.add(component)
      } else {
        console.warn('no component created')
      }
    }
  }
  const dragOverFunc = e => {
    e.preventDefault()
  }
  container.addEventListener('drop', dropFunc)
  container.addEventListener('dragover', dragOverFunc)
  return {
    destroy () {
      container.removeEventListener('drop', dropFunc)
      container.removeEventListener('dragover', dragOverFunc)
    }
  }
}
