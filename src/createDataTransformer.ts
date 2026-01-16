import { createDataAccessor } from './createDataAccessor.js';
import { DataVError } from './errors.js';
import { parseValueByType } from './parseValueByType.js';
import { isEmpty, isPlainObject } from './utils.js';
import { type ExpressSchema } from './validateExpressSchema.js';

interface SchemaExpress {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array';
  properties?: Record<string, unknown> | [string, unknown] | unknown[];
  resolve?: (value: unknown, root: unknown) => unknown;
}

interface FieldHandler {
  fieldKey: string;
  schema: unknown;
  transform: (data: unknown, root: unknown) => unknown;
}

type SchemaTransformer = (data: unknown, root?: unknown) => unknown;

type TransformFn = (schema: unknown) => SchemaTransformer;

const createObjectTransformer = (
  properties: Record<string, unknown>,
  createTransform: TransformFn,
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

const extractDataByPath = (pathname: string, data: unknown, root: unknown): unknown => {
  if (pathname.startsWith('$')) {
    return createDataAccessor(pathname.slice(1))(root);
  }
  return createDataAccessor(pathname)(data);
};

const createPrimitiveTransformer = (schema: SchemaExpress): SchemaTransformer => {
  return (value: unknown, root?: unknown) => {
    const rootData = root ?? value;
    const resolvedValue = schema.resolve ? schema.resolve(value, rootData) : value;
    return parseValueByType(resolvedValue, schema.type);
  };
};

const createPlainObjectTransformer = (): SchemaTransformer => {
  return (value: unknown) => {
    return isPlainObject(value) ? value : {};
  };
};

const createArrayTransformer = (
  properties: [string, unknown],
  createTransform: TransformFn,
): SchemaTransformer => {
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

const createArrayObjectTransformer = (
  properties: Record<string, unknown>,
  createTransform: TransformFn,
): SchemaTransformer => {
  const objectTransform = createObjectTransformer(properties, createTransform);

  return (data: unknown, root?: unknown) => {
    const rootData = root ?? data;

    if (!Array.isArray(data)) {
      return isEmpty(properties) ? [] : [objectTransform(data, rootData)];
    }

    return data.map((item) => objectTransform(item, rootData));
  };
};

export const createDataTransformer: TransformFn = (schema) => {
  if (Array.isArray(schema)) {
    const [pathname, nestedSchema] = schema;

    if (typeof pathname !== 'string') {
      throw DataVError.invalidTuple(schema);
    }

    if (Array.isArray(nestedSchema)) {
      const [rootPath, innerSchema] = nestedSchema;
      if (typeof rootPath === 'string' && rootPath === '$') {
        const innerTransform = createDataTransformer(innerSchema);
        return (data: unknown, root?: unknown) => {
          return innerTransform(root ?? data, root ?? data);
        };
      }
      throw DataVError.invalidTuple(schema);
    }

    if (!isPlainObject(nestedSchema)) {
      throw DataVError.invalidTuple(schema);
    }

    const nestedTransform = createDataTransformer(nestedSchema);

    return (data: unknown, root?: unknown) => {
      const rootData = root ?? data;
      const extractedData = extractDataByPath(pathname, data, rootData);
      return nestedTransform(extractedData, rootData);
    };
  }

  if (!isPlainObject(schema)) {
    throw DataVError.invalidTuple(schema);
  }

  const schemaObj = schema as Record<string, unknown>;
  const type = schemaObj.type as string | undefined;
  const resolve = schemaObj.resolve as ((value: unknown, root: unknown) => unknown) | undefined;

  if (resolve !== undefined && typeof resolve !== 'function') {
    throw DataVError.invalidSchema(schema as ExpressSchema, 'resolve must be a function');
  }

  if (type && ['string', 'number', 'boolean', 'integer'].includes(type)) {
    return createPrimitiveTransformer(schema as SchemaExpress);
  }

  if (schemaObj.resolve) {
    console.warn('Data type `array` or `object` does not support resolve function');
  }

  if (type === 'object') {
    const properties = schemaObj.properties as Record<string, unknown> | undefined;
    if (properties === undefined) {
      throw DataVError.missingProperties('object');
    }
    if (Array.isArray(properties)) {
      throw DataVError.invalidSchema(schema as ExpressSchema, 'object properties must be object, not array');
    }
    if (!isPlainObject(properties)) {
      throw DataVError.invalidSchema(schema as ExpressSchema, 'object properties must be object');
    }
    if (isEmpty(properties)) {
      return createPlainObjectTransformer();
    }
    return createObjectTransformer(properties, createDataTransformer);
  }

  if (type === 'array') {
    const properties = schemaObj.properties;
    if (properties === undefined) {
      throw DataVError.missingProperties('array');
    }
    if (Array.isArray(properties)) {
      if (properties.length !== 2) {
        throw DataVError.invalidSchema(schema as ExpressSchema, 'array properties tuple must have exactly 2 elements');
      }
      return createArrayTransformer(properties as [string, unknown], createDataTransformer);
    }
    if (!isPlainObject(properties)) {
      throw DataVError.invalidSchema(schema as ExpressSchema, 'array properties must be object or tuple');
    }
    return createArrayObjectTransformer(properties as Record<string, unknown>, createDataTransformer);
  }

  throw DataVError.invalidSchema(schema as ExpressSchema, `Unknown type: ${type}`);
};
