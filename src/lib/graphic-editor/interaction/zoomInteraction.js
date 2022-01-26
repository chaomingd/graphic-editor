// 鼠标中心缩放交互
export function registerZoomInteraction ({ stage, zoomBy }) {
  stage.on('wheel.zoom', e => {
    e.evt.preventDefault()
    const oldScale = stage.scaleX()
    const point = stage.getPointerPosition()
    const newScale = e.evt.deltaY < 0 ? oldScale * zoomBy : oldScale / zoomBy
    zoomToPoint(stage, point, oldScale, newScale)
  })
  return {
    destroy () {
      stage.off('wheel.zoom')
    }
  }
}

/**
 * 指定缩放中心缩放舞台
*/
export function zoomToPoint (stage, point, oldZoom, zoom) {
  const position = stage.position()
  stage.scale({
    x: zoom,
    y: zoom
  })
  const scaled = zoom / oldZoom
  const offsetX = (point.x - position.x) * (scaled - 1)
  const offsetY = (point.y - position.y) * (scaled - 1)
  stage.position({
    x: position.x - offsetX,
    y: position.y - offsetY
  })
}
