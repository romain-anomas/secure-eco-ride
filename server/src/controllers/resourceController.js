import { asyncHandler } from '../utils/asyncHandler.js';

/** Builds list/create/update/remove handlers for a CRUD model. */
export function resourceHandlers(model, { publicWhere, publicMap } = {}) {
  return {
    /** Public list: only rows matching publicWhere unless an authenticated staff member passes ?all=1 */
    list: asyncHandler(async (req, res) => {
      const all = req.user && req.query.all === '1';
      let rows = await model.list(all ? '' : publicWhere || '');
      if (!all && publicMap) rows = rows.map(publicMap);
      res.json({ data: rows });
    }),
    adminList: asyncHandler(async (_req, res) => res.json({ data: await model.list() })),
    create: asyncHandler(async (req, res) => res.status(201).json({ data: await model.create(req.body) })),
    update: asyncHandler(async (req, res) => res.json({ data: await model.update(req.params.id, req.body) })),
    remove: asyncHandler(async (req, res) => {
      await model.remove(req.params.id);
      res.json({ data: { deleted: true } });
    }),
  };
}
