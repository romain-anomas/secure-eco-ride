import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, serviceUnavailable } from '../utils/AppError.js';
import { adminTokenCount, hasAdminToken, isFcmConfigured, registerAdminToken, removeAdminToken, sendAdminTestPush } from '../services/pushService.js';

export const status = asyncHandler(async (req, res) => {
  const hash = req.query.token_hash;
  const currentDeviceRegistered = typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)
    ? await hasAdminToken(req.user.id, hash)
    : false;
  res.json({ data: {
    configured: isFcmConfigured(),
    registeredDevices: await adminTokenCount(req.user.id),
    currentDeviceRegistered,
  } });
});

export const registerDevice = asyncHandler(async (req, res) => {
  if (!isFcmConfigured()) throw serviceUnavailable('Push notifications are not configured on the server.');
  const { token, device_name: deviceName } = req.body || {};
  if (typeof token !== 'string' || token.trim().length < 20 || token.length > 8192) {
    throw badRequest('A valid Firebase device token is required.');
  }
  if (deviceName !== undefined && (typeof deviceName !== 'string' || deviceName.length > 120)) {
    throw badRequest('Device name must be 120 characters or fewer.');
  }
  await registerAdminToken(req.user.id, token.trim(), deviceName?.trim());
  res.status(201).json({ data: { registered: true } });
});

export const sendTest = asyncHandler(async (req, res) => {
  if (!isFcmConfigured()) throw serviceUnavailable('Push notifications are not configured on the server.');
  res.json({ data: await sendAdminTestPush(req.user.id) });
});

export const removeDevice = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (typeof token !== 'string' || token.length < 20 || token.length > 8192) {
    throw badRequest('A valid Firebase device token is required.');
  }
  await removeAdminToken(req.user.id, token);
  res.json({ data: { registered: false } });
});
