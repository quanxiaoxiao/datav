类似mongo，aggregate的$project，借助表达式,可以自由地选择性地保留或过滤输入数据中的某些字段,并可以按需对数据进行转换处理。

## Install

```shell
npm install @quanxiaoxiao/datav
```

## Quick Start

```javascript
import { select } from '@quanxiaoxiao/datav';

select({ type: 'number' })('33.3'); // 33.3
select({ type: 'integer' })('33.3'); // 33
select({ type: 'boolean' })('true'); // true
select({ type: 'boolean' })('false'); // false

select({
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'integer',
    },
  },
})({ name: 'quan', age: '22.2', foo: 'bar' }); // { name: "quan", age: 22 }

select(['age', { type: 'integer' }])({ age: '33.3' }); // 33
```

## Express

```json
{
    "type": "object",
    "anyOf": [
        {
            "properties": {
                "type": {
                    "enum": [
                        "object"
                    ]
                },
                "properties": {
                    "type": "object"
                }
            },
            "required": [
                "type",
                "properties"
            ]
        },
        {
            "properties": {
                "type": {
                    "enum": [
                        "array"
                    ]
                },
                "properties": {
                    "anyOf": [
                        {
                            "type": "object"
                        },
                        {
                            "type": "array",
                            "items": [
                                {
                                    "type": "string"
                                },
                                {
                                    "type": "object"
                                }
                            ],
                            "additionalItems": false,
                            "minItems": 2,
                            "maxItems": 2
                        }
                    ]
                }
            },
            "required": [
                "type",
                "properties"
            ]
        },
        {
            "properties": {
                "type": {
                    "enum": [
                        "string",
                        "number",
                        "boolean",
                        "integer"
                    ]
                }
            },
            "required": [
                "type"
            ]
        }
    ]
}
```

当输入为数组时,数组的第一个元素表示字段路径

```javascript
select(['sub.age', { type: 'integer' }])({
  name: 'quan',
  sub: { age: 33.3 },
}); // 33
```

### With resolve

```javascript
select({ type: 'integer', resolve: (v) =>  v + 1})(88); // 89

select({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      resolve: (a, b) => `${a}_${b.aa}`,
    },
    age: {
      type: 'integer',
      resolve: (a) => a + 1,
    },
  },
})({
  name: 'quan',
  aa: 'xx',
  age: 33,
}); // { "name": "quan_xx", "age": 34 }
```
