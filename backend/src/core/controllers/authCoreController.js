import { adminCreateUser, adminListUsers, login, me } from '../../services/authService.js';

export async function loginCore(input) {
  return login(input);
}

export async function createUserCore(input) {
  return adminCreateUser(input);
}

export async function meCore(userId) {
  return me(userId);
}

export async function listUsersCore() {
  return adminListUsers();
}
