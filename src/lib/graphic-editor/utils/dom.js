/**
 * 监听dom事件
*/
export function listen (dom, eventName, handleEventFunc, eventOptions = {}) {
  if (!dom) throw new Error('dom is required')
  if (!handleEventFunc) throw new Error('eventHandle is required')
  dom.addEventListener(eventName, handleEventFunc, eventOptions)
  return () => {
    dom.removeEventListener(eventName, handleEventFunc, eventOptions)
  }
}
