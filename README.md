# @quanxiaoxiao/datav

[![npm version](https://img.shields.io/npm/v/@quanxiaoxiao/datav.svg)](https://www.npmjs.com/package/@quanxiaoxiao/datav)
[![npm license](https://img.shields.io/npm/l/@quanxiaoxiao/datav.svg)](https://opensource.org/licenses/MIT)
[![node version](https://img.shields.io/node/v/@quanxiaoxiao/datav.svg)](https://nodejs.org)

轻量级数据转换工具库，支持 **Schema 驱动** 和 **Field DSL** 两种转换模式，提供类型安全的数据提取、转换和组合能力。

## 核心特性

- **双模式 API** - 支持声明式 Schema 和函数式 Field DSL 两种风格
- **类型安全** - 完整的 TypeScript 类型推导，`Infer<T>` 自动推断输出类型
- **路径访问** - 支持点分路径访问嵌套数据
- **根路径引用** - 使用 `$` 从根数据访问任意位置
- **丰富类型转换** - 自动处理字符串到数值/布尔值的转换
- **轻量高效** - 零额外依赖，仅 6KB (gzip)
- **完善错误处理** - 统一的 `DataVError` 错误类型

## 安装

```bash
npm install @quanxiaoxiao/datav
```
