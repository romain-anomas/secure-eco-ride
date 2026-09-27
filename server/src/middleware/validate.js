/** Validates req[source] with a zod schema and replaces it with the parsed (stripped, typed) value. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  req[source] = result.data;
  next();
};
