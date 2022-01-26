/**
 * 快捷键
*/
import { listen } from '../utils/dom'

// 重做
function handleRedo (historyStore) {
  historyStore.go(1)
}

// 撤销
function handleUndo (historyStore) {
  historyStore.go(-1)
}

// 复制
function handleCopy (command) {
  command.exec('copy')
}

// 删除
function handleDelete (command) {
  command.exec('remove')
}

export function registerShortCutKeyInteractin ({ stage, historyStore, command }) {
  // 设置tabindex属性以便监听键盘事件
  const container = stage.getContainer()
  if (container.getAttribute('tabindex') !== '-1') {
    container.setAttribute('tabindex', '-1')
  }
  const unKeyDownListener = listen(container, 'keydown', e => {
    if (e.target !== e.currentTarget) return
    if (e.ctrlKey || e.metaKey) {
      switch (e.keyCode) {
        case 89:
          e.preventDefault()
          // ctrl + y
          handleRedo(historyStore)
          break
        case 90:
          e.preventDefault()
          // ctrl + z
          handleUndo(historyStore)
          break
        case 67:
          // ctr + c
          e.preventDefault()
          handleCopy(command)
          break
      }
    }
    // console.log(e.keyCode)
    switch (e.keyCode) {
      case 8:
      case 46:
        // backspace/delete key
        e.preventDefault()
        // 删除
        handleDelete(command)
        break
    }
  })
  return {
    destroy () {
      unKeyDownListener()
    }
  }
}
