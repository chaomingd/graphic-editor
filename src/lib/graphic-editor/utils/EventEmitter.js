class EventEmitter {
  constructor () {
    this._listeners = []
  }
  on (type, fn) {
    if (!this._listeners[type]) {
      this._listeners[type] = []
    }
    this._listeners[type].push(fn)
    return () => {
      this.off(type, fn)
    }
  }
  fire (type, ...args) {
    const listeners = this._listeners[type]
    if (!listeners || !listeners.length) return false
    listeners.forEach(fn => {
      fn(...args)
    })
    return true
  }
  off (type, fn) {
    const listeners = this._listeners[type]
    if (!listeners || !listeners.length) return
    if (!fn) {
      this._listeners[type] = undefined
      return
    }
    for (let i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === fn) {
        listeners.splice(i, 1)
      }
    }
  }
}

export default EventEmitter
