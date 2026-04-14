import { addMyFavourite, listMyFavourites, removeMyFavourite } from '../../services/favouriteService.js';

export async function listFavouritesCore(userId) {
  return listMyFavourites(userId);
}

export async function addFavouriteCore(input) {
  return addMyFavourite(input);
}

export async function removeFavouriteCore(input) {
  return removeMyFavourite(input);
}
