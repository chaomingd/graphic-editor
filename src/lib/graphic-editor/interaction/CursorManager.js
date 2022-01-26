/**
 * 鼠标手型管理器
*/
const GRAB_CURSOR = 'grab'
const DEFAULT_CURSOR = 'auto'
class CursorManager {
  constructor ({ el } = {}) {
    this._cursor = DEFAULT_CURSOR
    this._el = el
    this._isLock = false
  }
  lock () {
    this._isLock = true
  }
  unLock () {
    this._isLock = false
  }
  grab () {
    this.setCursor(GRAB_CURSOR)
  }
  reset () {
    this.setCursor(DEFAULT_CURSOR)
  }
  setCursor (cursor) {
    if (this._isLock) return
    if (this._cursor !== cursor) {
      this._cursor = cursor
      this._el.style.cursor = cursor
    }
  }
}

export default CursorManager
