import Konva from 'konva'
import themeConfig from '../theme/themeConfig'
import ComponentGroup from '../components/base/ComponentGroup'
import NormalGroup from '../components/base/NormalGroup'
// 事件后缀
const EVENT_SUFIX = '.snappingInteraction'
// 吸附距离
const GUIDELINE_OFFSET = 5
// 只有ComponentGroup/NormalGroup/ComponentWireframe才可以有边沿吸附效果
function canSnapping (node) {
  return ComponentGroup.isComponentGroup(node) ||
  NormalGroup.isNormalGroup(node)
}
// 获取吸附线点位 每个对象的左中右、上中下位置
function getLineGuideStops (skipShape, layer, stage) {
  const vertical = []
  const horizontal = []

  layer.children.forEach(guideItem => {
    if (guideItem === skipShape || !canSnapping(guideItem)) {
      return
    }
    const box = guideItem.getClientRect({ relativeTo: stage })
    // and we can snap to all edges of shapes
    vertical.push([box.x, box.x + box.width, box.x + box.width / 2])
    horizontal.push([box.y, box.y + box.height, box.y + box.height / 2])
  })
  return {
    vertical: vertical.flat(),
    horizontal: horizontal.flat()
  }
}

// 获取对象的吸附位置
function getObjectSnappingEdges (node, stage) {
  const box = node.getClientRect({ relativeTo: stage })
  return {
    vertical: [
      {
        guide: Math.round(box.x),
        offset: Math.round(node.x() - box.x),
        snap: 'start'
      },
      {
        guide: Math.round(box.x + box.width / 2),
        offset: Math.round(node.x() - box.x - box.width / 2),
        snap: 'center'
      },
      {
        guide: Math.round(box.x + box.width),
        offset: Math.round(node.x() - box.x - box.width),
        snap: 'end'
      }
    ],
    horizontal: [
      {
        guide: Math.round(box.y),
        offset: Math.round(node.y() - box.y),
        snap: 'start'
      },
      {
        guide: Math.round(box.y + box.height / 2),
        offset: Math.round(node.y() - box.y - box.height / 2),
        snap: 'center'
      },
      {
        guide: Math.round(box.y + box.height),
        offset: Math.round(node.y() - box.y - box.height),
        snap: 'end'
      }
    ]
  }
}

// 找到所有可能的吸附线
function getGuides (lineGuideStops, itemBounds) {
  if (!lineGuideStops) return []
  const resultV = []
  const resultH = []

  lineGuideStops.vertical.forEach(lineGuide => {
    itemBounds.vertical.forEach(itemBound => {
      const diff = Math.abs(lineGuide - itemBound.guide)
      // 小于吸附距离时添加到数组中
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset
        })
      }
    })
  })

  lineGuideStops.horizontal.forEach(lineGuide => {
    itemBounds.horizontal.forEach(itemBound => {
      const diff = Math.abs(lineGuide - itemBound.guide)
      // 小于吸附距离时添加到数组中
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset
        })
      }
    })
  })

  const guides = []

  // 找到距离最近的吸附线
  const minV = resultV.sort((a, b) => a.diff - b.diff)[0]
  const minH = resultH.sort((a, b) => a.diff - b.diff)[0]
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: 'V',
      snap: minV.snap
    })
  }
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: 'H',
      snap: minH.snap
    })
  }
  return guides
}

// 绘制吸附线
const guideLines = []
function drawGuides (guides, layer) {
  guides.forEach(lg => {
    let line
    if (lg.orientation === 'H') {
      line = new Konva.Line({
        points: [-6000, lg.lineGuide, 6000, lg.lineGuide],
        listening: false,
        strokeScaleEnabled: false,
        ...themeConfig.snappingGuideLine.style
      })
    } else if (lg.orientation === 'V') {
      line = new Konva.Line({
        points: [lg.lineGuide, -6000, lg.lineGuide, 6000],
        listening: false,
        strokeScaleEnabled: false,
        ...themeConfig.snappingGuideLine.style
      })
    }
    layer.add(line)
    guideLines.push(line)
  })
}

// 清除guideLines
function clearGuideLines (historyStore) {
  if (guideLines.length) {
    historyStore.noHistoryWrapper(() => {
      guideLines.forEach(guideLine => {
        guideLine.destroy()
      })
      guideLines.length = 0
    })
  }
}

export function regiterSnappingInteraction ({ stage, upperLayer, layer, historyStore }) {
  // 控制渲染频率
  let canRender = true
  // 吸附点位
  let lineGuideStops
  stage.on('dragstart' + EVENT_SUFIX, e => {
    if (canSnapping(e.target)) {
      lineGuideStops = getLineGuideStops(e.target, layer, stage)
    } else {
      lineGuideStops = undefined
    }
  })
  stage.on('dragmove' + EVENT_SUFIX, e => {
    if (canRender && lineGuideStops) {
      canRender = false
      window.requestAnimationFrame(() => {
        canRender = true
        if (lineGuideStops && lineGuideStops.length === 0 || !canSnapping(e.target)) return
        const itemBounds = getObjectSnappingEdges(e.target, stage)
        const guides = getGuides(lineGuideStops, itemBounds)
        // 清除上一次的guideLines
        clearGuideLines(historyStore)
        if (guides.length === 0) return
        // 绘制吸附线
        historyStore.noHistoryWrapper(() => {
          drawGuides(guides, upperLayer)
        })
        // 强制调整对象的位置
        guides.forEach(lg => {
          switch (lg.snap) {
            case 'start': {
              switch (lg.orientation) {
                case 'V': {
                  e.target.x(lg.lineGuide + lg.offset)
                  break
                }
                case 'H': {
                  e.target.y(lg.lineGuide + lg.offset)
                  break
                }
              }
              break
            }
            case 'center': {
              switch (lg.orientation) {
                case 'V': {
                  e.target.x(lg.lineGuide + lg.offset)
                  break
                }
                case 'H': {
                  e.target.y(lg.lineGuide + lg.offset)
                  break
                }
              }
              break
            }
            case 'end': {
              switch (lg.orientation) {
                case 'V': {
                  e.target.x(lg.lineGuide + lg.offset)
                  break
                }
                case 'H': {
                  e.target.y(lg.lineGuide + lg.offset)
                  break
                }
              }
              break
            }
          }
        })
      })
    }
  })
  stage.on('dragend' + EVENT_SUFIX, () => {
    clearGuideLines(historyStore)
    lineGuideStops = undefined
  })
  return {
    destroy () {
      stage.off('dragstart' + EVENT_SUFIX)
      stage.off('dragmove' + EVENT_SUFIX)
      stage.off('dragend' + EVENT_SUFIX)
      lineGuideStops = undefined
    }
  }
}
