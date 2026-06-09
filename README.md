# Valley

微信小程序版等轴测解谜原型，基于 `threejs-miniprogram` 渲染。

## 当前内容

- 50x50 稀疏坐标关卡
- 紧凑型立体空间迷宫，包含分支路径和高低差死胡同
- A* 寻路
- 多状态旋转机关，使用 `linksByState` 动态重建寻路图
- 机关旋转与长桥展开动画，桥中段注册为可点击、可站立节点
- 硬编码小机器人角色与走路摆臂动画
- 通关镜头环绕与微信原生通关弹窗

## 目录结构

- `app.js`
- `app.json`
- `app.wxss`
- `package.json`
- `pages/index/index.wxml`
- `pages/index/index.wxss`
- `pages/index/index.js`

## 本地准备

1. 在项目根目录执行 `npm install`
2. 用微信开发者工具打开项目根目录
3. 在微信开发者工具里执行“工具 -> 构建 NPM”
4. 在开发者工具本地工程配置里填写真实 `appid`

说明：

- `appid` 不在仓库内保存，也不要提交到 GitHub
- `project.config.json` 和 `project.private.config.json` 已被 `.gitignore` 忽略
- 这个项目不需要本地 dev server，不会占用额外端口

## 交互说明

- 点击普通路径、楼梯、桥面：角色按 A* 路径移动
- 站到机关相邻节点后点击机关：机关旋转 90 度，并按当前状态切换连通路径
- 两个机关都转到正确状态后，终点路线才会连通
- 到达终点：触发通关镜头和原生弹窗，确认后重置回起点

## 运行检查

如果微信开发者工具报缺依赖或页面空白，优先检查这几项：

1. `npm install` 是否已在项目根目录执行
2. 开发者工具是否已经“构建 NPM”
3. `miniprogram_npm/` 是否由开发者工具正确生成
4. 本地工程配置里是否填写了有效 `appid`
