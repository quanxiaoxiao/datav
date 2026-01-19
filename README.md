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

## 两种 API 模式

本库提供两种等价的转换方式，可根据场景选择：

### 模式一：Schema 驱动（声明式）

适合定义可复用的转换规则，结构清晰易维护。

```typescript
import { transform, createTransform, type SchemaExpress } from '@quanxiaoxiao/datav';
```

#### 基础类型转换

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

#### 嵌套对象转换

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

#### 数组转换

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

#### 使用 `$` 引用根数据

从根数据访问任意位置，不受当前路径层级限制。

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

#### 复用转换器

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

---

### 模式二：Field DSL（函数式）

适合需要动态组合或类型推导的场景。

```typescript
import { compile, toString, toNumber, toInteger, toBoolean, toObject, toArray } from '@quanxiaoxiao/datav';
```

#### 基础类型字段

```typescript
const field = toString('user.name');
const result = compile(field)({ user: { name: '张三' } }); // '张三'
```

#### 对象字段组合

```typescript
const userField = toObject('user', {
  name: toString('name'),
  age: toInteger('age'),
  score: toNumber('score')
});

const result = compile(userField)({
  user: { name: '张三', age: '25', score: '98.5' }
});
// { name: '张三', age: 25, score: 98.5 }
```

#### 数组字段转换

```typescript
const itemsField = toArray('items', toObject(undefined, {
  id: toInteger('id'),
  title: toString('title'),
  price: toNumber('price')
}));

const result = compile(itemsField)({
  items: [
    { id: '1', title: '产品A', price: '99.9' },
    { id: '2', title: '产品B', price: '199' }
  ]
});
// [
//   { id: 1, title: '产品A', price: 99.9 },
//   { id: 2, title: '产品B', price: 199 }
// ]
```

#### 类型推导示例

```typescript
const userField = toObject('user', {
  name: toString('name'),
  age: toInteger('age')
});

// result 类型自动推导为 { name: string; age: number }
const result = compile(userField)({ user: { name: '张三', age: '25' } });
```

---

## API 文档

### Schema 模式 API

#### `transform(schema, data)`

单次数据转换，返回转换后的结果。

```typescript
const result = transform(schema, data);
```

#### `createTransform(schema)`

创建可复用的转换器函数。

```typescript
const transformer = createTransform(schema);
const result = transformer(data);
```

#### `SchemaExpress`

转换规则的声明式定义：

```typescript
type SchemaExpress = { path: string } & (
  | { type: 'string' | 'number' | 'boolean' | 'integer' }
  | { type: 'object'; properties: Record<string, SchemaExpress> }
  | { type: 'array'; items: SchemaExpress }
);
```

#### `SchemaType`

支持的类型：`'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array'`

---

### Field DSL API

#### `compile(field)`

将 Field 编译为可执行函数。

```typescript
const run = compile(field);
const result = run(data);
```

#### 基础类型字段

```typescript
toString(path?: string): Field<string | null>
toNumber(path?: string): Field<number | null>
toInteger(path?: string): Field<number | null>
toBoolean(path?: string): Field<boolean | null>
```

#### 组合类型字段

```typescript
toObject<T extends Record<string, Field>>(
  path: string | undefined,
  fields: T
): Field<{ [K in keyof T]: Infer<T[K]> }>

toArray<T extends Field>(
  path: string | undefined,
  itemField: T
): Field<Array<Infer<T>>>
```

#### 类型推导

```typescript
type Infer<T> = T extends Field<infer U> ? U : never;
```

---

### 独立类型转换函数

可直接使用，无需通过 Schema 或 Field：

```typescript
import {
  toString,
  toNumber,
  toInteger,
  toBoolean,
  toArray,
  toObject,
  toJson
} from '@quanxiaoxiao/datav';

toString(123);              // '123'
toNumber('42.5');           // 42.5
toInteger('42');            // 42
toBoolean('true');          // true
toArray('[1,2,3]');         // [1, 2, 3]
toObject('{"a":1}');        // { a: 1 }
toJson('{"x":1}');          // { x: 1 }
```

---

## 路径语法

| 语法 | 说明 |
|------|------|
| `.` | 当前层级（隐式） |
| `key.subkey` | 访问嵌套属性 |
| `0`, `1`, `2` | 访问数组指定索引 |
| `-1` | 访问最后一个元素 |
| `$` | 引用根数据 |

### 路径示例

```typescript
// 普通路径
toString('user.profile.name')

// 数组访问
toNumber('items.0.price')

// 根路径引用（从根访问，不受当前层级限制）
toString('$.config.apiKey')

// 空路径（使用当前数据）
toObject(undefined, { ... })
```

---

## 错误处理

所有错误统一通过 `DataVError` 类型抛出：

```typescript
import { DataVError, isDataVError } from '@quanxiaoxiao/datav';

try {
  const result = transform(schema, data);
} catch (error) {
  if (isDataVError(error)) {
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
  }
}
```

### 错误码

- `INVALID_DATA_TYPE` - 无效的数据类型
- `INVALID_SCHEMA` - 无效的 Schema 定义
- `INVALID_PATH` - 无效的路径格式
- `INVALID_PATH_SEGMENT` - 路径包含空片段
- `TRANSFORM_ERROR` - 数据转换失败

---

## 与其他库对比

| 特性 | @quanxiaoxiao/datav | [transformers](https://github.com/adrianhall/transformers.js) | [map-transform](https://github.com/ryanpcmcquen/map-transform) |
|------|---------------------|--------------------------------------------------------------|------------------------------------------------------------|
| Schema 模式 | ✅ | ✅ | ✅ |
| Field DSL | ✅ | ❌ | ❌ |
| 类型推导 | ✅ 完整 | 基础 | ❌ |
| 路径语法 | 点分路径 + `$` | JSONPath | 点分路径 |
| 体积 | ~6KB | ~15KB | ~10KB |
| 依赖 | 0 | 0 | 0 |

---

## 许可证

MIT
