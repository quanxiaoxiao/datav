# @quanxiaoxiao/datav

数据转换工具库，支持类型转换、数据路径访问和 schema 驱动的数据转换。

## 安装

```bash
npm install @quanxiaoxiao/datav
```

## 核心功能

### createDataTransformer

根据 schema 定义将数据从一种格式转换为另一种格式。

```typescript
import { createDataTransformer } from '@quanxiaoxiao/datav';
```

#### 基础类型转换

```typescript
const schema = { type: 'string' };
const transform = createDataTransformer(schema);

transform(123); // '123'
transform(null); // null
```

| 类型 | 说明 |
|------|------|
| `string` | 转换为字符串 |
| `number` | 转换为数字（保留小数） |
| `integer` | 转换为整数 |
| `boolean` | 转换为布尔值（只接受 'true'/'false'） |

#### 对象转换

```typescript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' }
  }
};

const transform = createDataTransformer(schema);

transform({ name: 'quan', age: '22.5', foo: 'bar' });
// { name: 'quan', age: 22 }
```

#### 路径访问

使用 `[路径, schema]` 语法访问嵌套数据：

```typescript
const schema = ['user.age', { type: 'integer' }];
const transform = createDataTransformer(schema);

transform({ user: { age: '33.3' } }); // 33
transform({ user: { age: 'abc' } });  // null
```

特殊路径前缀：
- `$` - 从根数据开始访问
- `.` - 当前层级访问

```typescript
// 从根路径提取数组
const schema = {
  type: 'array',
  properties: ['$items', { type: 'string' }]
};
const transform = createDataTransformer(schema);

transform({ items: ['a', 'b', 'c'], other: 'data' });
// ['a', 'b', 'c']
```

#### 数组转换

```typescript
// 元组形式: [路径, 元素schema]
const schema = {
  type: 'array',
  properties: ['.', { type: 'integer' }]
};
const transform = createDataTransformer(schema);

transform(['1.1', '2.2', '3']); // [1, 2, 3]

// 对象形式
const schema2 = {
  type: 'array',
  properties: { name: { type: 'string' } }
};
const transform2 = createDataTransformer(schema2);

transform2([{ name: 'a' }, { name: 'b' }]);
// [{ name: 'a' }, { name: 'b' }]
```

#### resolve 函数

用于自定义值转换逻辑：

```typescript
const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      resolve: (value, root) => `${value}_${root.suffix}`
    }
  }
};

const transform = createDataTransformer(schema);
transform({ name: 'quan', suffix: 'xx' }); // { name: 'quan_xx' }
```

### parseValueByType

根据类型定义解析和转换值。

```typescript
import { parseValueByType } from '@quanxiaoxiao/datav';

parseValueByType('123', 'integer'); // 123
parseValueByType('123.45', 'number'); // 123.45
parseValueByType('true', 'boolean'); // true
parseValueByType('', 'string'); // ''
parseValueByType(null, 'string'); // null
```

## 辅助函数

### createDataAccessor

通过路径访问嵌套数据：

```typescript
import { createDataAccessor } from '@quanxiaoxiao/datav';

const accessor = createDataAccessor('user.profile.name');
accessor({ user: { profile: { name: 'quan' } } }); // 'quan'
accessor({ user: { profile: null } }); // null

// 数组索引
const arrayAccessor = createDataAccessor(0);
arrayAccessor(['a', 'b', 'c']); // 'a'
arrayAccessor(-1); // 'c'
arrayAccessor(10); // null
```

### createArrayAccessor

创建数组元素访问器：

```typescript
import { createArrayAccessor } from '@quanxiaoxiao/datav';

const accessor = createArrayAccessor(0);
accessor(['a', 'b', 'c']); // 'a'

const accessor2 = createArrayAccessor(-1);
accessor2(['a', 'b', 'c']); // 'c'

const accessor3 = createArrayAccessor('length');
accessor3(['a', 'b', 'c']); // 3
```

### createPathAccessor

通过路径段数组访问数据：

```typescript
import { createPathAccessor } from '@quanxiaoxiao/datav';

const accessor = createPathAccessor(['user', 'profile', 'name']);
accessor({ user: { profile: { name: 'quan' } } }); // 'quan'
```

### parseDotPath

解析点分路径字符串：

```typescript
import { parseDotPath } from '@quanxiaoxiao/datav';

parseDotPath('user.profile.name'); // ['user', 'profile', 'name']
parseDotPath('.user.name'); // ['user', 'name']
parseDotPath(''); // []

// 转义点号
parseDotPath('user\\.name'); // ['user.name']
```

### validateExpressSchema

验证 schema 表达式是否有效：

```typescript
import { validateExpressSchema } from '@quanxiaoxiao/datav';

// 有效
validateExpressSchema({ type: 'string' });
validateExpressSchema({ type: 'object', properties: {} });
validateExpressSchema({ type: 'array', properties: ['item', { type: 'string' }] });

// 无效（抛出错误）
validateExpressSchema({ type: 'object' }); // 缺少 properties
validateExpressSchema({ type: 'array' });  // 缺少 properties
validateExpressSchema({ type: 'invalid' }); // 无效类型
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

### validateExpressSchema

```typescript
declare const validateExpressSchema: (schema: ExpressSchema) => void;
```

## 许可证

MIT
