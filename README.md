# @quanxiaoxiao/datav

[![npm version](https://img.shields.io/npm/v/@quanxiaoxiao/datav.svg)](https://www.npmjs.com/package/@quanxiaoxiao/datav)
[![npm license](https://img.shields.io/npm/l/@quanxiaoxiao/datav.svg)](https://opensource.org/licenses/MIT)
[![node version](https://img.shields.io/node/v/@quanxiaoxiao/datav.svg)](https://nodejs.org)

轻量级数据转换工具库，支持 **Schema 驱动** 和 **Field DSL** 两种转换模式，提供类型安全的数据提取、转换和组合能力。

## 核心特性

- **双模式转换**: 支持声明式 Schema 和链式 Field DSL 两种方式
- **类型安全**: 完整的 TypeScript 类型支持，编译时检查
- **路径访问**: 强大的点分隔符路径访问，支持嵌套和数组索引
- **类型转换**: 自动类型转换，处理 string/number/boolean/integer 等
- **默认值支持**: 支持 `defaultValue`，在数据缺失或为空时提供默认值
- **错误处理**: 完善的错误机制，提供详细的错误信息

## 安装

```bash
npm install @quanxiaoxiao/datav
```

## 快速开始

### Schema 驱动模式

通过定义 Schema 来描述数据结构：

```typescript
import { transform } from '@quanxiaoxiao/datav';

const schema = {
  path: '.',
  type: 'object',
  properties: {
    name: { path: '.name', type: 'string' },
    age: { path: '.age', type: 'integer' },
    active: { path: '.active', type: 'boolean' },
  },
};

const result = transform(schema, {
  name: 123,
  age: '30',
  active: 'true',
});
// { name: '123', age: 30, active: true }
```

#### 默认值 (defaultValue)

当数据缺失或为空时，可以提供默认值：

```typescript
const schema = {
  path: '.',
  type: 'object',
  properties: {
    name: { path: '.name', type: 'string', defaultValue: 'Anonymous' },
    count: { path: '.count', type: 'number', defaultValue: 0 },
    items: {
      path: '.items',
      type: 'array',
      items: { path: '.', type: 'string' },
      defaultValue: ['default item'],
    },
  },
};

transform(schema, { name: null, count: null, items: [] });
// { name: 'Anonymous', count: 0, items: ['default item'] }
```

### Field DSL 模式

通过链式 API 构建转换规则：

```typescript
import { compile, toObject, toString, toInteger, toArray } from '@quanxiaoxiao/datav';

const field = toObject({
  name: toString('user.name'),
  age: toInteger('user.age'),
  tags: toArray('user.tags'),
});

const result = compile(field)({
  user: { name: 'Alice', age: '25', tags: [1, 2, 3] },
});
// { name: 'Alice', age: 25, tags: ['1', '2', '3'] }
```

## API 参考

### Schema 驱动模式

#### transform(schema, data)

一次性转换数据：

```typescript
const schema = {
  path: '.',
  type: 'object',
  properties: {
    id: { path: '.id', type: 'string' },
    items: {
      path: '.items',
      type: 'array',
      items: { path: '.', type: 'integer' },
    },
  },
};

transform(schema, { id: 123, items: ['1', '2', '3'] });
// { id: '123', items: [1, 2, 3] }
```

#### createTransform(schema)

创建可复用的转换函数：

```typescript
const userTransformer = createTransform({
  path: '.',
  type: 'object',
  properties: {
    name: { path: '.name', type: 'string' },
    age: { path: '.age', type: 'integer' },
  },
});

userTransformer({ name: 'Bob', age: '30' }); // { name: 'Bob', age: 30 }
userTransformer({ name: 'Carol', age: '25' }); // { name: 'Carol', age: 25 }
```

#### validateExpressSchema(schema)

验证 Schema 格式：

```typescript
const result = validateExpressSchema({
  path: '.',
  type: 'object',
  properties: {
    name: { path: '.name', type: 'string' },
  },
});
// { valid: true, errors: [] }
```

### Field DSL 模式

#### 基本类型转换

```typescript
toString(path?)      // 转换为字符串
toNumber(path?)      // 转换为数字
toInteger(path?)     // 转换为整数
toBoolean(path?)     // 转换为布尔值
```

#### 复合类型

```typescript
toObject(pathOrFields, fields?)  // 对象类型
toArray(pathOrField, field?)     // 数组类型
```

#### compile(field)

将 Field 编译为可执行函数：

```typescript
const field = toObject({
  name: toString('user.name'),
  age: toInteger('user.age'),
});

const executor = compile(field);
executor({ user: { name: 'Alice', age: '25' } });
// { name: 'Alice', age: 25 }
```

### 路径访问

支持点分隔符路径和数组索引：

```typescript
// 嵌套路径
toString('user.profile.name')

// 数组索引
toString('items.0.name')
toString('matrix.0.1.value')

// 根路径
toString('$')
```

### 错误处理

```typescript
import { DataVError, isDataVError, ERROR_CODES } from '@quanxiaoxiao/datav';

try {
  transform(schema, data);
} catch (error) {
  if (isDataVError(error)) {
    console.log(error.code);      // 错误码
    console.log(error.details);   // 详细错误信息
  }
}
```

## 高级用法

### 嵌套对象转换

```typescript
const schema = {
  path: '.',
  type: 'object',
  properties: {
    user: {
      path: '.user',
      type: 'object',
      properties: {
        id: { path: '.id', type: 'integer' },
        name: { path: '.name', type: 'string' },
        address: {
          path: '.address',
          type: 'object',
          properties: {
            city: { path: '.city', type: 'string' },
            zipCode: { path: '.zip', type: 'integer' },
          },
        },
      },
    },
  },
};

transform(schema, {
  user: {
    id: '42',
    name: 'Alice',
    address: { city: 'New York', zip: '10001' },
  },
});
// { user: { id: 42, name: 'Alice', address: { city: 'New York', zip: 10001 } } }
```

### 数组转换

```typescript
const schema = {
  path: '.users',
  type: 'array',
  items: {
    path: '.',
    type: 'object',
    properties: {
      id: { path: '.id', type: 'integer' },
      name: { path: '.name', type: 'string' },
    },
  },
};

transform(schema, {
  users: [
    { id: '1', name: 'A' },
    { id: '2', name: 'B' },
  ],
});
// [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
```

### 自定义 Resolver

通过 `resolve` 字段添加自定义转换逻辑：

```typescript
const schema = {
  path: '.',
  type: 'object',
  properties: {
    amount: {
      path: '.amount',
      type: 'number',
      resolve: (value) => (value as number) * 100,
    },
  },
};

transform(schema, { amount: 10 });
// { amount: 1000 }
```

## 类型定义

```typescript
type SchemaType = 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';

interface SchemaExpress {
  path: string;
  type: SchemaType;
  resolve?: (value: unknown, context: { data: unknown; rootData: unknown; path: string }) => unknown;
  defaultValue?: string | number | boolean | Record<string, unknown> | unknown[];
  properties?: Record<string, SchemaExpress>;
  items?: SchemaExpress;
}
```

### 默认值 (defaultValue)

Schema 支持 `defaultValue` 字段，当原始数据缺失、为空或为 `null` 时，将使用默认值：

```typescript
// primitive 类型
const schema1 = {
  path: '.name',
  type: 'string',
  defaultValue: 'Unknown',
};

// array 类型 - 空数组时使用默认值
const schema2 = {
  path: '.tags',
  type: 'array',
  items: { path: '.', type: 'string' },
  defaultValue: ['untagged'],
};

// object 类型 - null 时使用默认值
const schema3 = {
  path: '.config',
  type: 'object',
  properties: { theme: { path: 'theme', type: 'string' } },
  defaultValue: { theme: 'light' },
};

// 嵌套结构中的 defaultValue
const schema4 = {
  path: '.',
  type: 'object',
  properties: {
    user: {
      path: '.user',
      type: 'object',
      properties: {
        name: { path: '.name', type: 'string', defaultValue: 'Guest' },
      },
    },
  },
};

transform(schema4, { user: { name: null } });
// { user: { name: 'Guest' } }
```

## 许可证

MIT
