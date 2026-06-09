# Valley

微信小程序版等轴测解谜原型，基于 `threejs-miniprogram` 渲染。

## 当前内容

- 50x50 稀疏坐标关卡
- 多高度路径、楼梯、机关和桥梁
- A* 寻路
- 机关旋转与桥梁展开动画
- 硬编码小机器人角色与走路摆臂动画
- 通关镜头环绕与微信原生通关弹窗

## 目录

- `app.json`
- `pages/index/index.wxml`
- `pages/index/index.wxss`
- `pages/index/index.js`

## 运行前提

1. 使用微信开发者工具打开项目
2. 本地小程序工程配置中填写真实 `appid`
3. 依赖已安装并可解析 `threejs-miniprogram`

## 交互说明

- 点击普通路径、楼梯、桥面：角色按 A* 路径移动
- 点击机关：触发旋转，桥梁展开或收起
- 到达终点：触发通关镜头和原生弹窗，可选择重置回起点
