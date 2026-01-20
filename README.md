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
- **自定义转换** - 通过 `resolve` 函数实现复杂数据转换逻辑
- **轻量高效** - 零额外依赖，仅 6KB (gzip)
- **完善错误处理** - 统一的 `DataVError` 错误类型

## 使用示例

### Field DSL 模式

使用声明式的函数式 API 构建数据转换逻辑：

```typescript
import { toString, toNumber, toBoolean, toObject, toArray, compile, resolve } from '@quanxiaoxiao/datav';

const userField = toObject({
  id: toNumber('id'),
  name: toString('userName'),
  email: toString('email'),
  isActive: toBoolean('isActive'),
  score: toNumber('score'),
  tags: toArray('tags', toString()),
});

const transformer = compile(userField);

const result = transformer({
  id: '123',
  userName: 'Alice',
  email: 'alice@example.com',
  isActive: 'true',
  score: 95.5,
  tags: ['vip', 'premium'],
});

// 输出: { id: 123, name: 'Alice', email: 'alice@example.com', isActive: true, score: 95.5, tags: ['vip', 'premium'] }
```

#### 自定义转换（resolve）

使用 `resolve` 函数实现复杂的数据转换逻辑：

```typescript
import { toNumber, toObject, toArray, resolve } from '@quanxiaoxiao/datav';

const field = toObject({
  original: toNumber('price'),
  doubled: resolve(toNumber('price'), (value) => value * 2),
  withDiscount: resolve(
    toNumber('price'),
    (value, ctx) => value * ((ctx.rootData as any).discount || 1)
  ),
  itemCount: resolve(
    toArray('items'),
    (items) => `共${items.length}件`
  ),
});

field.run({
  price: 100,
  discount: 0.8,
  items: [{ name: 'A' }, { name: 'B' }],
});

// 输出: { original: 100, doubled: 200, withDiscount: 80, itemCount: '共2件' }
```

`resolve` 函数签名：
```typescript
resolve<T, R>(field: Field<T>, resolver: (value: T, ctx: { data: unknown; rootData: unknown; path: string }) => R): Field<R | null>
```

### Schema 模式

使用 JSON Schema 风格的声明式配置：

```typescript
import { transform } from '@quanxiaoxiao/datav';

const schema = {
  path: 'data',
  type: 'object',
  properties: {
    users: {
      path: 'data.users',
      type: 'array',
      items: {
        path: '.',
        type: 'object',
        properties: {
          id: { path: 'id', type: 'integer' },
          name: { path: 'name', type: 'string' },
          email: { path: 'contact.email', type: 'string' },
        },
      },
    },
  },
};

const result = transform(schema, {
  data: {
    users: [
      { id: '1', name: 'Bob', contact: { email: 'bob@example.com' } },
      { id: '2', name: 'Charlie', contact: { email: 'charlie@example.com' } },
    ],
  },
});

// 输出: { users: [{ id: 1, name: 'Bob', email: 'bob@example.com' }, { id: 2, name: 'Charlie', email: 'charlie@example.com' }] }
```

#### 自定义转换（resolve）

使用 `resolve` 函数实现复杂的数据转换逻辑：

```typescript
import { transform } from '@quanxiaoxiao/datav';

const schema = {
  path: '.',
  type: 'object',
  properties: {
    price: {
      path: '.price',
      type: 'number',
      resolve: (value, ctx) => (value as number) * (ctx.rootData as any).multiplier,
    },
    discount: {
      path: '.originalPrice',
      type: 'number',
      resolve: (value) => (value as number) * 0.9,
    },
    itemCount: {
      path: '.items',
      type: 'string',
      resolve: (value) => `共${(value as any[]).length}件商品`,
    },
  },
};

transform(schema, {
  price: 100,
  originalPrice: 200,
  multiplier: 1.5,
  items: [{ name: 'A' }, { name: 'B' }],
});

// 输出: { price: 150, discount: 180, itemCount: '共2件商品' }
```

`resolve` 函数接收两个参数：
- `value`: 从路径读取的原始值
- `context`: 包含 `{ data, rootData, path }` 的上下文对象

## 路径语法

### 普通路径

使用点分路径访问嵌套数据，支持数组索引：

```typescript
// 基础路径
toString('name')           // 从根获取 name 字段
toNumber('user.age')       // 嵌套访问

// 数组索引
toString('items.0.name')   // 第一个元素的 name
toString('matrix.1.2')     // 二维数组访问

// 空路径
toString()                 // 直接使用根数据
```

### 根路径引用（$）

使用 `$` 从根数据访问任意位置，适用于需要跨层级引用的场景：

```typescript
import { transform } from '@quanxiaoxiao/datav';

const schema = {
  path: 'result',
  type: 'object',
  properties: {
    userName: { path: '$.user.name', type: 'string' },
    userEmail: { path: '$.contact.email', type: 'string' },
    firstItemName: { path: '$.items.0.name', type: 'string' },
  },
};

transform(schema, {
  user: { name: 'Alice', id: 1 },
  contact: { email: 'alice@example.com' },
  items: [{ name: 'First' }, { name: 'Second' }],
});

// 输出: { userName: 'Alice', userEmail: 'alice@example.com', firstItemName: 'First' }
```

## 类型安全

库提供完整的 TypeScript 类型推导，使用 `Infer<T>` 自动推断输出类型：

```typescript
import { Infer, toString, toNumber, toObject, toArray } from '@quanxiaoxiao/datav';

// 基础类型推导
type NameField = ReturnType<typeof toString>;
type InferredName = Infer<NameField>;  // string

// 复合类型推导
const userField = toObject({
  name: toString('name'),
  age: toNumber('age'),
  tags: toArray('tags', toString()),
});

type UserType = Infer<typeof userField>;
// 输出: { name: string; age: number; tags: string[] }
```

## API 参考

### Field DSL

| 函数 | 说明 |
|------|------|
| `toString(path?)` | 提取并转换为字符串 |
| `toNumber(path?)` | 提取并转换为数字 |
| `toInteger(path?)` | 提取并转换为整数 |
| `toBoolean(path?)` | 提取并转换为布尔值 |
| `toObject(path?, fields)` | 组合多个字段为对象 |
| `toArray(path?, itemField)` | 将数据转换为数组 |
| `compile(field)` | 将 Field 编译为可复用函数 |
| `resolve(field, resolver)` | 自定义值转换函数 |

### Schema 模式

| 函数 | 说明 |
|------|------|
| `transform(schema, data)` | 根据 Schema 转换数据 |
| `createTransform(schema)` | 创建转换函数 |
| `SchemaExpress` | Schema 类型定义 |

#### SchemaExpress 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 数据路径，支持点分路径和 `$` 根路径引用 |
| `type` | `'string' \| 'number' \| 'boolean' \| 'integer' \| 'object' \| 'array'` | 数据类型 |
| `resolve?` | `(value, context) => unknown` | 自定义转换函数（可选） |
| `properties?` | `Record<string, SchemaExpress>` | 对象类型属性定义（仅 type 为 object 时需要） |
| `items?` | `SchemaExpress` | 数组元素类型定义（仅 type 为 array 时需要） |

## 错误处理

转换过程中遇到无效数据时返回 `null`，而非抛出异常：

```typescript
const field = toNumber('count');
field.run({ count: 'invalid' });   // 返回 null
field.run({ count: '3.14' });      // 返回 null（浮点数）
field.run({ count: '42' });        // 返回 42
```

使用 `compile` 函数可获得更友好的错误信息：

```typescript
import { compile } from '@quanxiaoxiao/datav';

const transformer = compile(toObject({
  id: toNumber('id'),
}));

try {
  transformer({ id: 'not-a-number' });
} catch (error) {
  console.error(error.message);  // "Transformation Failed: ..."
}
```

## 与其他库对比

| 特性 | datav | JSONResume | Zod | Yup |
|------|-------|------------|-----|-----|
| 零依赖 | ✅ | ❌ | ❌ | ❌ |
| 体积 (gzip) | 6KB | 8KB | 13KB | 12KB |
| Schema 模式 | ✅ | ❌ | ❌ | ✅ |
| Field DSL | ✅ | ❌ | ❌ | ❌ |
| 类型推导 | ✅ | ❌ | ✅ | ❌ |
| 根路径引用 | ✅ | ❌ | ❌ | ❌ |
| 自定义转换 (resolve) | ✅ | ❌ | ✅ | ✅ |

## 相关链接

- [NPM 包](https://www.npmjs.com/package/@quanxiaoxiao/datav)
- [GitHub 仓库](https://github.com/quanxiaoxiao/datav)
- [问题反馈](https://github.com/quanxiaoxiao/datav/issues)
