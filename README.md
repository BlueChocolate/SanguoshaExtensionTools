# 三国杀扩展包工具

三国杀扩展包工具是一个 VS Code 插件，可以对各类开源三国杀的扩展包（例如太阳神三国杀、无名杀等）的开发提供便捷的智能感知、图形化操作与快捷操作等支持。

[简体中文](https://github.com/BlueChocolate/SanguoshaExtensionTools/blob/main/README.md)

[English](https://github.com/BlueChocolate/SanguoshaExtensionTools/blob/main/README.en.md)

## 特性

该扩展提供对三国杀扩展包开发的基本语言支持：

* 读取已有的三国杀扩展包

图片 路径是相对于此 README 文件的

* 快速创建三国杀扩展包
* 快速定位到代码
* 对三国杀 API 提供智能感知
* 提供 CodeLens
* 可视化编辑武将属性
* 武将卡面生成器
* 快速添加武将与技能
* 快速导出扩展包

例如，如果您的扩展项目工作区下有一个图像子文件夹：
 
\!\[feature X\]\(resources/images/game.svg\)

> 提示：许多流行的扩展都使用动画。 这是炫耀您的扩展程序的绝佳方式！ 我们推荐简短、重点突出且易于理解的动画。

## 依赖项

如果您有任何要求或依赖项，请添加一个部分来描述这些要求以及如何安装和配置它们。

## 插件设置

如果您的扩展通过 `contributes.configuration` 扩展点添加任何 VS 代码设置，则包括在内。

例如：

此扩展提供以下设置：

* `myExtension.enable`：启用/禁用此扩展。
* `myExtension.thing`：设置为 `blah` 来做某事。

## 已知的问题

调出已知问题有助于限制用户针对您的扩展打开重复问题。

## 发行说明

用户在更新扩展时会欣赏到发行说明。

### 1.0.0

初始发布。

### 1.0.1

修复 issue #.

### 1.1.0

添加功能 X, Y, 和 Z.

---

## 遵循扩展指南

确保您已通读扩展指南并遵循创建扩展的最佳实践。

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## 使用 Markdown

您可以使用 Visual Studio Code 编写 README。 以下是一些有用的编辑器键盘快捷键：

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## 更多信息

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)