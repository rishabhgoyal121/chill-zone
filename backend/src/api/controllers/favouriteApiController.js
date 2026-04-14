import {
  addFavouriteCore,
  listFavouritesCore,
  removeFavouriteCore
} from '../../core/controllers/favouriteCoreController.js';

export async function listFavouritesApi(req, res) {
  return res.json(await listFavouritesCore(req.user.sub));
}

export async function addFavouriteApi(req, res) {
  const data = await addFavouriteCore({ userId: req.user.sub, titleExternalId: req.body.titleExternalId });
  return res.status(201).json(data);
}

export async function removeFavouriteApi(req, res) {
  const ok = await removeFavouriteCore({ userId: req.user.sub, titleExternalId: req.params.titleExternalId });
  return res.json({ removed: ok });
}
