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
import { createDataTransformer } from '@quanxiaoxiao/datav';

// 定义转换规则
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
    email: { type: 'string' }
  }
};

// 创建转换器
const transform = createDataTransformer(schema);

// 转换数据
const input = {
  name: '张三',
  age: '25',
  email: 'zhangsan@example.com',
  phone: '13800138000', // 忽略此字段
  address: '北京市'      // 忽略此字段
};

const result = transform(input);
console.log(result);
// 输出: { name: '张三', age: 25, email: 'zhangsan@example.com' }
```

## 核心功能

### createDataTransformer

根据 schema 定义将数据从一种格式转换为另一种格式。

```typescript
import { createDataTransformer } from '@quanxiaoxiao/datav';
```

#### 基础类型转换

```typescript
const transform = createDataTransformer({ type: 'string' });
transform(123);        // '123'
transform(true);       // 'true'
transform(null);       // null
```

| 类型 | 输入示例 | 输出 | 说明 |
|------|----------|------|------|
| `string` | `123` | `'123'` | 转换为字符串 |
| `number` | `'123.45'` | `123.45` | 转换为数字（保留小数） |
| `integer` | `'123.45'` | `123` | 转换为整数（截断小数） |
| `boolean` | `'true'` | `true` | 转换为布尔值 |

#### 对象转换

提取并转换对象的指定字段：

```typescript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
    score: { type: 'number' }
  }
};

const transform = createDataTransformer(schema);

transform({
  name: '李四',
  age: '28.7',
  score: '95.5',
  email: 'lisi@example.com',
  phone: '13900139000'
});
// { name: '李四', age: 28, score: 95.5 }
```

#### 嵌套对象转换

```typescript
const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        profile: {
          type: 'object',
          properties: {
            age: { type: 'integer' },
            city: { type: 'string' }
          }
        }
      }
    }
  }
};

const transform = createDataTransformer(schema);

transform({
  user: {
    name: '王五',
    profile: {
      age: '30',
      city: '上海市',
      phone: '13700137000'
    }
  }
});
// { user: { name: '王五', profile: { age: 30, city: '上海市' } } }
```

#### 路径访问

使用 `[路径, schema]` 语法访问嵌套数据：

```typescript
// 访问深层嵌套字段
const schema = ['user.profile.age', { type: 'integer' }];
const transform = createDataTransformer(schema);

transform({ user: { profile: { age: '25' } } });    // 25
transform({ user: { profile: { age: null } } });   // null
transform({ user: { name: 'test' } });             // null (路径不存在)
```

#### 根路径引用 (`$`)

使用 `$` 从根数据开始访问，常用于在数组转换中引用根数据：

```typescript
// 从根路径提取数据填充数组
const schema = {
  type: 'array',
  properties: ['$items', { type: 'string' }]
};
const transform = createDataTransformer(schema);

transform({ items: ['a', 'b', 'c'], other: 'data' });
// ['a', 'b', 'c']
```

```typescript
// 组合使用路径和根路径
const schema = {
  type: 'object',
  properties: {
    userId: ['.$id', { type: 'integer' }],
    items: {
      type: 'array',
      properties: {
        name: { type: 'string' },
        userName: ['$userName', { type: 'string' }]
      }
    }
  }
};

const transform = createDataTransformer(schema);

transform({
  id: '1001',
  userName: '张三',
  items: [
    { name: '商品A' },
    { name: '商品B' }
  ]
});
// {
//   userId: 1001,
//   items: [
//     { name: '商品A', userName: '张三' },
//     { name: '商品B', userName: '张三' }
//   ]
// }
```

#### 数组转换

**元组形式** - 转换每个数组元素：

```typescript
// 转换字符串数组为整数数组
const schema = {
  type: 'array',
  properties: ['.', { type: 'integer' }]
};
const transform = createDataTransformer(schema);

transform(['1.1', '2.9', '3']);    // [1, 2, 3]
transform(['10', '20', '30']);     // [10, 20, 30]
```

**对象形式** - 提取数组中对象的指定字段：

```typescript
const schema = {
  type: 'array',
  properties: { name: { type: 'string' }, age: { type: 'integer' } }
};
const transform = createDataTransformer(schema);

transform([
  { name: '张三', age: '25', email: 'a@a.com' },
  { name: '李四', age: '30', email: 'b@b.com' }
]);
// [
//   { name: '张三', age: 25 },
//   { name: '李四', age: 30 }
// ]
```

**提取数组字段为新数组**：

```typescript
const schema = {
  type: 'array',
  properties: ['.name', { type: 'string' }]
};
const transform = createDataTransformer(schema);

transform([
  { name: '张三', age: 25 },
  { name: '李四', age: 30 }
]);
// ['张三', '李四']
```

#### 字段重命名

使用元组 `[原字段路径, 目标schema]` 实现字段重命名：

```typescript
const schema = {
  type: 'object',
  properties: {
    fullName: ['name', { type: 'string' }],
    userAge: ['age', { type: 'integer' }]
  }
};

const transform = createDataTransformer(schema);

transform({ name: '王五', age: '28' });
// { fullName: '王五', userAge: 28 }
```

#### resolve 函数

使用 `resolve` 自定义转换逻辑：

```typescript
const schema = {
  type: 'object',
  properties: {
    fullName: {
      type: 'string',
      resolve: (value, root) => `${root.prefix}${value}`
    },
    total: {
      type: 'number',
      resolve: (value) => (value as number) * 1.1 // 增加 10%
    }
  }
};

const transform = createDataTransformer(schema);

transform({
  name: '赵六',
  prefix: '用户-',
  price: '100'
});
// { fullName: '用户-赵六', total: 110 }
```

**resolve 参数说明：**
- `value` - 当前字段的值
- `root` - 根数据（可用于访问其他字段）

#### 空 properties 处理

```typescript
// 空 properties 对象保留所有字段
const schema1 = { type: 'object', properties: {} };
const transform1 = createDataTransformer(schema1);

transform1({ a: 1, b: 2 });  // { a: 1, b: 2 }

// 空 properties 数组返回空数组
const schema2 = { type: 'array', properties: {} };
const transform2 = createDataTransformer(schema2);

transform2({ items: [1, 2, 3] });  // []
```

### parseValueByType

根据类型定义解析和转换值。

```typescript
import { parseValueByType } from '@quanxiaoxiao/datav';
```

| 类型 | 示例输入 | 输出 | 说明 |
|------|----------|------|------|
| `string` | `123` | `'123'` | 转换为字符串 |
| `number` | `'123.45'` | `123.45` | 转换为数字 |
| `integer` | `'123.45'` | `123` | 转换为整数 |
| `boolean` | `'true'` | `true` | 转换为布尔值 |
| `json` | `'{"a":1}'` | `{a:1}` | 解析 JSON |
| `object` | `'{"a":1}'` | `{a:1}` | 解析 JSON 对象 |
| `array` | `'[1,2,3]'` | `[1,2,3]` | 解析 JSON 数组 |

```typescript
parseValueByType('123', 'integer');           // 123
parseValueByType('123.45', 'number');         // 123.45
parseValueByType('true', 'boolean');          // true
parseValueByType('{"name":"test"}', 'json');  // { name: 'test' }
parseValueByType('[1,2,3]', 'array');         // [1, 2, 3]
parseValueByType(null, 'string');             // null
parseValueByType(null, 'array');              // []
```

### validateExpressSchema

验证 schema 表达式是否有效，无效时抛出错误：

```typescript
import { validateExpressSchema } from '@quanxiaoxiao/datav';

// 有效 schema
validateExpressSchema({ type: 'string' });
validateExpressSchema({ type: 'number' });
validateExpressSchema({ type: 'object', properties: {} });
validateExpressSchema({ type: 'array', properties: { name: { type: 'string' } } });
validateExpressSchema(['path', { type: 'string' }]);

// 无效 schema（抛出错误）
validateExpressSchema({ type: 'object' });         // Error: 缺少 properties
validateExpressSchema({ type: 'array' });          // Error: 缺少 properties
validateExpressSchema({ type: 'invalid' });        // Error: 无效类型
validateExpressSchema(['path']);                   // Error: 元组需要2个元素
```

## 辅助函数

### createDataAccessor

通过路径访问嵌套数据，支持字符串路径和数字索引。

```typescript
import { createDataAccessor } from '@quanxiaoxiao/datav';

// 字符串路径
const accessor = createDataAccessor('user.profile.name');
accessor({ user: { profile: { name: '张三' } } });        // '张三'
accessor({ user: { profile: null } });                    // null
accessor({ user: {} });                                   // null

// 数字索引
const arrayAccessor = createDataAccessor(0);
arrayAccessor(['a', 'b', 'c']);                           // 'a'
arrayAccessor({ 0: 'first' });                            // null（非数组）

// 负数索引
const lastAccessor = createDataAccessor(-1);
lastAccessor(['a', 'b', 'c']);                            // 'c'

// null/undefined
const nullAccessor = createDataAccessor(null);
nullAccessor({});                                         // null
```

### createArrayAccessor

创建数组元素访问器。

```typescript
import { createArrayAccessor } from '@quanxiaoxiao/datav';

// 正数索引
const accessor = createArrayAccessor(0);
accessor(['a', 'b', 'c']);       // 'a'

// 负数索引
const lastAccessor = createArrayAccessor(-1);
lastAccessor(['a', 'b', 'c']);   // 'c'

// 越界索引
const outOfBounds = createArrayAccessor(10);
outOfBounds(['a', 'b', 'c']);    // null

// 数组长度
const lengthAccessor = createArrayAccessor('length');
lengthAccessor(['a', 'b', 'c']); // 3

// 无效输入
createArrayAccessor(1.5)(['a', 'b', 'c']);  // null（浮点数）
createArrayAccessor('abc')(['a', 'b']);     // null（非数字字符串）
```

### createPathAccessor

通过路径段数组访问数据。

```typescript
import { createPathAccessor } from '@quanxiaoxiao/datav';

// 单个键
const accessor = createPathAccessor(['name']);
accessor({ name: '张三' });         // '张三'

// 嵌套路径
const nestedAccessor = createPathAccessor(['user', 'profile', 'age']);
nestedAccessor({ user: { profile: { age: 25 } } });  // 25

// 数组访问
const arrayAccessor = createPathAccessor(['items', '0', 'name']);
arrayAccessor({ items: [{ name: 'A' }, { name: 'B' }] });  // 'A'

// 空路径数组（返回原数据）
const identityAccessor = createPathAccessor([]);
identityAccessor({ a: 1 });  // { a: 1 }
```

### parseDotPath

解析点分路径字符串。

```typescript
import { parseDotPath } from '@quanxiaoxiao/datav';

parseDotPath('user.profile.name');      // ['user', 'profile', 'name']
parseDotPath('.user.name');              // ['user', 'name']（前导点被忽略）
parseDotPath('');                        // []
parseDotPath('name');                    // ['name']

// 转义点号
parseDotPath('user\\.name');             // ['user.name']
parseDotPath('a\\.b.c');                 // ['a.b', 'c']

// 错误情况
parseDotPath('user..name');              // Error: 包含空段
parseDotPath('.user');                   // Error: 包含空段
```

## 实际应用场景

### API 响应数据转换

```typescript
const apiResponseSchema = {
  type: 'object',
  properties: {
    code: { type: 'integer' },
    data: {
      type: 'object',
      properties: {
        userId: ['id', { type: 'integer' }],
        userName: ['name', { type: 'string' }],
        email: ['email', { type: 'string' }],
        createdAt: ['created_at', { type: 'string' }]
      }
    },
    message: { type: 'string' }
  }
};

const transform = createDataTransformer(apiResponseSchema);

// 原始 API 响应
const apiResponse = {
  code: 200,
  data: {
    id: '10001',
    name: '张三',
    email: 'zhangsan@example.com',
    created_at: '2024-01-15',
    password: 'secret'
  },
  message: 'success',
  timestamp: 1705315200
};

// 转换后
const result = transform(apiResponse);
// {
//   code: 200,
//   data: {
//     userId: 10001,
//     userName: '张三',
//     email: 'zhangsan@example.com',
//     createdAt: '2024-01-15'
//   },
//   message: 'success'
// }
```

### 表单数据处理

```typescript
const formSchema = {
  type: 'object',
  properties: {
    username: { type: 'string' },
    age: ['age', { type: 'integer' }],
    email: { type: 'string' },
    phone: { type: 'string' }
  }
};

const transform = createDataTransformer(formSchema);

const formData = {
  username: '  张三  ',      // 保留空格
  age: '25',
  email: 'zhangsan@example.com',
  phone: '13800138000',
  confirmPassword: '123456'  // 忽略
};

transform(formData);
// {
//   username: '  张三  ',
//   age: 25,
//   email: 'zhangsan@example.com',
//   phone: '13800138000'
// }
```

### 列表数据提取

```typescript
const listSchema = {
  type: 'array',
  properties: ['.id', { type: 'integer' }]
};

const transform = createDataTransformer(listSchema);

const products = [
  { id: '001', name: '产品A', price: 100 },
  { id: '002', name: '产品B', price: 200 },
  { id: '003', name: '产品C', price: 300 }
];

transform(products);  // [1, 2, 3]
```

## API 参考

### createDataTransformer

```typescript
type SchemaExpress =
  | { type: 'string' | 'number' | 'boolean' | 'integer' }
  | { type: 'object'; properties?: Record<string, SchemaExpress> }
  | { type: 'array'; properties?: Record<string, SchemaExpress> | [string, SchemaExpress> }
  | [string, SchemaExpress];

declare const createDataTransformer: (
  schema: SchemaExpress
) => (data: unknown, root?: unknown) => unknown;
```

### parseValueByType

```typescript
declare const parseValueByType: (value: unknown, type: DataType) => unknown;

type DataType = 'string' | 'number' | 'boolean' | 'integer' | 'json' | 'object' | 'array';
```

### createDataAccessor

```typescript
declare const createDataAccessor: (
  pathname: string | number | null
) => (data: unknown) => unknown;
```

### createArrayAccessor

```typescript
declare const createArrayAccessor: (
  index: string | number
) => (array: unknown[]) => unknown;
```

### createPathAccessor

```typescript
declare const createPathAccessor: (
  pathSegments: string[]
) => (data: unknown) => unknown;
```

### parseDotPath

```typescript
declare const parseDotPath: (path: string) => string[];
```

### validateExpressSchema

```typescript
declare const validateExpressSchema: (schema: ExpressSchema) => void;

interface ExpressSchema {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, unknown> | [string, object];
  resolve?: (value: unknown, root: unknown) => unknown;
}
```

## 常见问题

### Q: 如何忽略某个字段？

A: 不在 schema 的 `properties` 中定义该字段即可。

### Q: 如何处理嵌套数组？

A: 组合使用对象类型和数组类型：

```typescript
const schema = {
  type: 'object',
  properties: {
    users: {
      type: 'array',
      properties: {
        name: { type: 'string' },
        tags: {
          type: 'array',
          properties: ['.', { type: 'string' }]
        }
      }
    }
  }
};
```

### Q: 如何访问数组的特定元素？

A: 使用路径访问语法：

```typescript
const schema = {
  type: 'object',
  properties: {
    firstItem: ['items.0', { type: 'string' }],
    secondItem: ['items.1', { type: 'string' }]
  }
};
```

### Q: `resolve` 和普通转换可以同时使用吗？

A: 可以。`resolve` 在类型转换之后执行：

```typescript
const schema = {
  type: 'string',
  resolve: (value) => value.toUpperCase()
};

createDataTransformer(schema)('hello');  // 'HELLO'
```

## 许可证

MIT
