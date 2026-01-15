import { createDataAccessor } from '../createDataAccessor.js';
import { parseValueByType } from '../parseValueByType.js';
import { isEmpty, isPlainObject } from '../utils.js';
import { validateExpressSchema } from './validateExpressSchema.js';

interface SchemaExpress {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, SchemaExpress> | [string, SchemaExpress] | SchemaExpress[];
  resolve?: (value: unknown, root: unknown) => unknown;
}

interface FieldHandler {
  fieldKey: string;
  schema: SchemaExpress;
  transform: (data: unknown, root: unknown) => unknown;
}

type TransformFn = (schema: SchemaExpress | [string, SchemaExpress]) => (data: unknown, root?: unknown) => unknown;

/**
 * 创建对象字段转换器
 */
const createObjectTransformer = (
  properties: Record<string, SchemaExpress>,
  createTransform: TransformFn
): ((data: unknown, root: unknown) => object) => {
  const handlers: FieldHandler[] = Object.entries(properties).map(([fieldKey, schema]) => ({
    fieldKey,
    schema,
    transform: createTransform(schema),
  }));

  return (data: unknown, root: unknown) => {
    const rootData = root ?? data;

    return handlers.reduce((result, handler) => {
      const fieldValue = Array.isArray(handler.schema)
        ? handler.transform(data, rootData)
        : handler.transform(data == null ? data : (data as Record<string, unknown>)[handler.fieldKey], rootData);

      return {
        ...result,
        [handler.fieldKey]: fieldValue,
      };
    }, {} as object);
  };
};

/**
 * 处理路径访问的数据提取
 */
const extractDataByPath = (pathname: string, data: unknown, root: unknown): unknown => {
  if (pathname.startsWith('$')) {
    return createDataAccessor(pathname.slice(1))(root);
  }
  return createDataAccessor(pathname)(data);
};

/**
 * 创建基础类型转换器
 */
const createPrimitiveTransformer = (schema: SchemaExpress): TransformFn => {
  return (value: unknown, root?: unknown) => {
    const rootData = root ?? value;
    const resolvedValue = schema.resolve ? schema.resolve(value, rootData) : value;
    return parseValueByType(resolvedValue, schema.type);
  };
};

/**
 * 创建简单对象转换器（无 properties）
 */
const createPlainObjectTransformer = (): TransformFn => {
  return (value: unknown) => {
    return isPlainObject(value) ? value : {};
  };
};

/**
 * 创建数组转换器（tuple 形式的 properties）
 */
const createArrayTransformer = (
  properties: [string, SchemaExpress],
  createTransform: TransformFn
): TransformFn => {
  const [pathname, itemSchema] = properties;
  const itemTransform = createTransform(itemSchema);

  return (data: unknown, root?: unknown) => {
    const rootData = root ?? data;

    if (!Array.isArray(data)) {
      if (pathname.startsWith('$')) {
        const extractedData = createDataAccessor(pathname.slice(1))(rootData);
        return extractedData == null ? [] : [itemTransform(extractedData, rootData)];
      }
      return [];
    }

    return data.map((item) => {
      if (pathname === '' || pathname === '.') {
        return itemTransform(item, rootData);
      }
      return itemTransform(createDataAccessor(pathname)(item), rootData);
    });
  };
};

/**
 * 创建数组对象转换器（对象形式的 properties）
 */
const createArrayObjectTransformer = (
  properties: Record<string, SchemaExpress>,
  createTransform: TransformFn
): TransformFn => {
  const objectTransform = createObjectTransformer(properties, createTransform);

  return (data: unknown, root?: unknown) => {
    const rootData = root ?? data;

    if (!Array.isArray(data)) {
      return isEmpty(properties) ? [] : [objectTransform(data, rootData)];
    }

    return data.map((item) => objectTransform(item, rootData));
  };
};

/**
 * 创建数据转换器
 * 根据 schema 表达式递归创建数据转换函数
 */
const createDataTransformer: TransformFn = (schema) => {
  // 处理路径访问形式: [pathname, schema]
  if (Array.isArray(schema)) {
    const [pathname, nestedSchema] = schema;

    if (typeof pathname !== 'string' || !isPlainObject(nestedSchema)) {
      throw new Error(`Invalid schema expression: ${JSON.stringify(schema)}`);
    }

    const nestedTransform = createDataTransformer(nestedSchema);

    return (data: unknown, root?: unknown) => {
      const rootData = root ?? data;
      const extractedData = extractDataByPath(pathname, data, rootData);
      return nestedTransform(extractedData, rootData);
    };
  }

  // 验证 schema 结构
  validateExpressSchema(schema);

  // 处理基础类型
  if (['string', 'number', 'boolean', 'integer'].includes(schema.type)) {
    return createPrimitiveTransformer(schema);
  }

  // array 和 object 类型不支持 resolve
  if (schema.resolve) {
    console.warn('Data type `array` or `object` does not support resolve function');
  }

  // 处理对象类型
  if (schema.type === 'object') {
    if (isEmpty(schema.properties)) {
      return createPlainObjectTransformer();
    }
    return createObjectTransformer(schema.properties as Record<string, SchemaExpress>, createDataTransformer);
  }

  // 处理数组类型
  if (Array.isArray(schema.properties)) {
    return createArrayTransformer(schema.properties as [string, SchemaExpress], createDataTransformer);
  }

  // 处理数组对象类型
  return createArrayObjectTransformer(schema.properties as Record<string, SchemaExpress>, createDataTransformer);
};

export default createDataTransformer;
