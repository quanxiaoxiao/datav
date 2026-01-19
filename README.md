# @quanxiaoxiao/datav

[![npm version](https://img.shields.io/npm/v/@quanxiaoxiao/datav.svg)](https://www.npmjs.com/package/@quanxiaoxiao/datav)
[![npm license](https://img.shields.io/npm/l/@quanxiaoxiao/datav.svg)](https://opensource.org/licenses/MIT)
[![node version](https://img.shields.io/node/v/@quanxiaoxiao/datav.svg)](https://nodejs.org)

数据转换工具库，支持类型转换、数据路径访问和 schema 驱动的数据转换。

## 特性

- **类型安全** - 完整的 TypeScript 类型支持
- **Schema 驱动** - 通过声明式 schema 定义转换规则
- **路径访问** - 支持点分路径访问嵌套数据
- **根路径引用** - 使用 `$` 从根数据访问
- **轻量级** - 零额外依赖

## 安装

```bash
npm install @quanxiaoxiao/datav
```

## 快速开始

```typescript
import { transform, createTransform, type SchemaExpress } from '@quanxiaoxiao/datav';
```

### 基础类型转换

```typescript
const schema = {
  path: 'user',
  type: 'object',
  properties: {
    name: { path: 'user.name', type: 'string' },
    age: { path: 'user.age', type: 'number' },
    isActive: { path: 'user.status', type: 'boolean' }
  }
};

const input = {
  user: {
    name: '张三',
    age: '25',
    status: 'true'
  }
};

const result = transform(schema, input);
// { name: '张三', age: 25, isActive: true }
```

### 嵌套对象转换

```typescript
const schema = {
  path: 'data',
  type: 'object',
  properties: {
    user: {
      path: 'data.user',
      type: 'object',
      properties: {
        profile: {
          path: 'data.user.profile',
          type: 'object',
          properties: {
            name: { path: 'data.user.profile.name', type: 'string' },
            email: { path: 'data.user.profile.email', type: 'string' }
          }
        }
      }
    }
  }
};
```

### 数组转换

```typescript
const schema = {
  path: 'items',
  type: 'array',
  items: {
    path: 'items',
    type: 'object',
    properties: {
      id: { path: 'id', type: 'integer' },
      title: { path: 'title', type: 'string' },
      price: { path: 'price', type: 'number' }
    }
  }
};

const input = {
  items: [
    { id: '1', title: '产品A', price: '99.9' },
    { id: '2', title: '产品B', price: '199' }
  ]
};

const result = transform(schema, input);
// [
//   { id: 1, title: '产品A', price: 99.9 },
//   { id: 2, title: '产品B', price: 199 }
// ]
```

### 使用 `$` 引用根数据

```typescript
const schema = {
  path: 'data',
  type: 'object',
  properties: {
    fullName: { path: '$.user.firstName', type: 'string' },
    email: { path: '$.contact.email', type: 'string' }
  }
};
```

### 复用转换器

```typescript
const userTransformer = createTransform({
  path: 'user',
  type: 'object',
  properties: {
    name: { path: 'user.name', type: 'string' },
    age: { path: 'user.age', type: 'integer' }
  }
});

const result1 = userTransformer({ user: { name: '张三', age: '30' } });
const result2 = userTransformer({ user: { name: '李四', age: '25' } });
```

## API 文档

### transform(schema, data)

单次数据转换。

```typescript
const result = transform(schema, data);
```

### createTransform(schema)

创建可复用的转换器。

```typescript
const transformer = createTransform(schema);
const result = transformer(data);
```

### SchemaExpress

转换规则的声明式定义：

```typescript
type SchemaExpress = {
  path: string;              // 数据路径，支持点分表示法
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: {              // object 类型必填
    [key: string]: SchemaExpress;
  };
  items?: SchemaExpress;     // array 类型必填
};
```

### 类型转换函数

```typescript
import {
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toArray,
  toObject
} from '@quanxiaoxiao/datav';
```

## 路径语法

- `.` - 当前层级
- `key.subkey` - 访问嵌套属性
- `0`, `1`, `2` - 访问数组元素
- `-1` - 访问最后一个元素
- `$` - 引用根数据

## 许可证

MIT
