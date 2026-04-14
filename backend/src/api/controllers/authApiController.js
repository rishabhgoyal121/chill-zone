import { createUserCore, listUsersCore, loginCore, meCore } from '../../core/controllers/authCoreController.js';

export async function loginApi(req, res) {
  try {
    const data = await loginCore(req.body);
    return res.json(data);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

export async function createUserApi(req, res) {
  try {
    const data = await createUserCore({ ...req.body, actorId: req.user.sub });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function meApi(req, res) {
  const data = await meCore(req.user.sub);
  if (!data) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(data);
}

export async function listUsersApi(req, res) {
  return res.json(await listUsersCore());
}
