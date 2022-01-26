import { ControlPoint } from './ControlPoint.js'
import BaseComponent from './base/BaseComponent.js'
import Component from './base/Component.js'
import ComponentGroup from './base/ComponentGroup.js'
import NormalGroup from './base/NormalGroup.js'
import EditableText from './EditableText'
import LogoCat from './LogoCat.js'
import NoActivity from './NoActivity'
import Password from './Password.js'
import Line from './Line'


const Components = {
  BaseComponent,
  Component,
  ComponentGroup,
  NormalGroup,
  ControlPoint,
  EditableText,
  LogoCat,
  NoActivity,
  Password,
  Line
}

export function getComponents () {
  return Components
}

// 为所有的组件注册getComponents静态方法
Object.keys(Components).forEach(key => {
  Components[key].getComponents = getComponents
})

export default Components
