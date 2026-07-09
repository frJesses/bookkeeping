# AGENTS.md
## 项目类型
这是一个微信小程序项目。生成代码时必须符合微信小程序组件化开发思想。
## 核心原则
- 页面 `pages/*/*.ts` 只负责页面生命周期、数据组合和事件转发
- 可复用 UI 必须抽成 `components`
- 接口请求必须统一放到 `services`
- 常量统一放到 `constants`
- 不允许把大量逻辑堆在页面 TS 文件中
- 如果后续能够复用的组件，需要抽离
## 推荐目录结构
```text
miniprogram/
  pages/
    bill/
      index.wxml
      index.wxss
      index.js
      index.json
      components/
        bill-item/
        bill-filter/
        bill-form/
  components/
    empty-state/
    custom-navbar/
    price-text/
  services/
    bill.js
    category.js
  utils/
    format.js
    date.js
    validator.js
  constants/
    category.js
    bill.js