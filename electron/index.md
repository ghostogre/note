#### Electron 架构

首先这是 Electron 的一个整体的架构，它是由 Github 开发了一个开源框架，允许我们使用来 HTML + CSS + Javascript 来构建开发桌面应用，大大降低了桌面应用的开发的复杂度。整体架构的核心组成是由 Chromium + Node.js + Native APIs 组成的。其中 Chromium 提供了 UI 的能力，Node.js 让 Electron 有了底层操作的能力，Navtive APIs 则解决了跨平台的一些问题，比如说 Windows 系统、MAC OS 系统及 Linux 系统之前一些差异的屏蔽，并且它还提供了一个比较统一体验的原生能力。

