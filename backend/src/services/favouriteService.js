import { addFavourite, listFavourites, removeFavourite } from '../db/repositories/favouriteRepository.js';

export async function listMyFavourites(userId) {
  return listFavourites(userId);
}

export async function addMyFavourite({ userId, titleExternalId }) {
  return addFavourite({ userId, titleExternalId });
}

export async function removeMyFavourite({ userId, titleExternalId }) {
  return removeFavourite({ userId, titleExternalId });
}
