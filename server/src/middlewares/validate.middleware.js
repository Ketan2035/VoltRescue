import { z } from 'zod';
import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Express v5: req.query and req.params are read-only getters — only override req.body
    req.body = parsed.body || req.body;

    // Attach validated query/params as separate properties to avoid read-only errors
    if (parsed.query) req.validatedQuery = parsed.query;
    if (parsed.params) req.validatedParams = parsed.params;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod v4 uses error.issues; older versions used error.errors — support both
      const issues = error.issues ?? error.errors ?? [];
      const messages = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return next(new AppError(400, `Validation Error: ${messages}`));
    }
    next(error);
  }
};
