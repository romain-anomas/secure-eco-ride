import { Router } from 'express';
import { authenticate, optionalAuth, adminOnly, staffOrAdmin, driverOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bookingLimiter, contactLimiter, loginLimiter } from '../middleware/rateLimit.js';
import { imageUpload } from '../middleware/upload.js';
import { idParam } from '../validators/common.js';
import * as S from '../validators/schemas.js';
import { serviceSchema, vehicleSchema, driverSchema, pricingSchema, testimonialSchema, partialOf } from '../validators/resources.js';
import { Services, Vehicles, Drivers, Pricing, Testimonials } from '../models/resources.js';
import { resourceHandlers } from '../controllers/resourceController.js';
import * as auth from '../controllers/authController.js';
import * as bookings from '../controllers/bookingController.js';
import * as misc from '../controllers/miscController.js';
import * as wa from '../controllers/whatsappController.js';
import * as push from '../controllers/pushController.js';
import * as driver from '../controllers/driverController.js';

const router = Router();
const id = validate(idParam, 'params');

router.get('/health', (_req, res) => res.json({ data: { ok: true, time: new Date().toISOString() } }));

// ------------------------------------------------------------------ auth
router.post('/auth/login', loginLimiter, validate(S.loginSchema), auth.login);
router.get('/auth/me', authenticate, auth.me);
router.post('/auth/change-password', authenticate, validate(S.changePasswordSchema), auth.changePassword);

// -------------------------------------------------------------- bookings
router.post('/bookings', bookingLimiter, validate(S.createBookingSchema), bookings.createBooking);
router.get('/bookings', authenticate, staffOrAdmin, validate(S.listBookingsQuery, 'query'), bookings.listBookings);
router.get('/bookings/unseen-count', authenticate, staffOrAdmin, bookings.unseenCount);
router.post('/email/test', authenticate, adminOnly, bookings.testEmail);
router.get('/push/status', authenticate, adminOnly, push.status);
router.post('/push/devices', authenticate, adminOnly, push.registerDevice);
router.post('/push/test', authenticate, adminOnly, push.sendTest);
router.delete('/push/devices', authenticate, adminOnly, push.removeDevice);
router.get('/bookings/:id', authenticate, staffOrAdmin, id, bookings.getBooking);
router.post('/bookings/:id/send-update', authenticate, staffOrAdmin, id, validate(S.dispatchSchema), bookings.sendBookingUpdate);
router.patch('/bookings/:id', authenticate, staffOrAdmin, id, validate(S.bookingUpdateSchema), bookings.updateBooking);

// ------------------------------------------- services (public read, admin write)
const services = resourceHandlers(Services, { publicWhere: 'WHERE t.is_active = 1' });
router.get('/services', optionalAuth, services.list);
router.post('/services', authenticate, adminOnly, validate(serviceSchema), services.create);
router.patch('/services/:id', authenticate, adminOnly, id, validate(partialOf(serviceSchema)), services.update);
router.delete('/services/:id', authenticate, adminOnly, id, services.remove);

// ------------------------------------- fleet = vehicles (public read hides plates/status)
const fleet = resourceHandlers(Vehicles, {
  publicWhere: 'WHERE t.is_public = 1',
  publicMap: ({ id: vid, name, model, category, capacity, image_url, description, features }) => ({ id: vid, name, model, category, capacity, image_url, description, features: features || [] }),
});
router.get('/fleet', optionalAuth, fleet.list);
router.post('/fleet', authenticate, adminOnly, validate(vehicleSchema), fleet.create);
router.patch('/fleet/:id', authenticate, adminOnly, id, validate(partialOf(vehicleSchema)), fleet.update);
router.delete('/fleet/:id', authenticate, adminOnly, id, fleet.remove);

// --------------------------------------------------------------- drivers
const drivers = resourceHandlers(Drivers);
router.get('/drivers', authenticate, staffOrAdmin, drivers.adminList);
router.post('/drivers', authenticate, adminOnly, validate(driverSchema), drivers.create);
router.patch('/drivers/:id', authenticate, staffOrAdmin, id, validate(partialOf(driverSchema)), drivers.update);
router.delete('/drivers/:id', authenticate, adminOnly, id, drivers.remove);
router.post('/drivers/:id/account', authenticate, adminOnly, id, validate(S.driverAccountSchema), driver.createAccount);
router.patch('/drivers/:id/account', authenticate, adminOnly, id, validate(S.driverAccountUpdateSchema), driver.updateAccount);
router.get('/driver/bookings', authenticate, driverOnly, driver.assignedBookings);
router.patch('/driver/availability', authenticate, driverOnly, validate(S.driverAvailabilitySchema), driver.updateAvailability);

// --------------------------------------------------------------- pricing
const pricing = resourceHandlers(Pricing);
router.get('/pricing/public', misc.publicPricing);
router.get('/pricing', authenticate, adminOnly, pricing.adminList);
router.post('/pricing', authenticate, adminOnly, validate(pricingSchema), pricing.create);
router.patch('/pricing/:id', authenticate, adminOnly, id, validate(partialOf(pricingSchema)), pricing.update);
router.delete('/pricing/:id', authenticate, adminOnly, id, pricing.remove);

// ---------------------------------------------------------- testimonials
const testimonials = resourceHandlers(Testimonials, { publicWhere: `WHERE t.status = 'APPROVED'` });
router.get('/testimonials', optionalAuth, testimonials.list);
router.post('/testimonials', authenticate, adminOnly, validate(testimonialSchema), testimonials.create);
router.patch('/testimonials/:id', authenticate, adminOnly, id, validate(partialOf(testimonialSchema)), testimonials.update);
router.delete('/testimonials/:id', authenticate, adminOnly, id, testimonials.remove);

// ------------------------------------------------------------- customers
router.get('/customers', authenticate, staffOrAdmin, misc.listCustomers);
router.patch('/customers/:id', authenticate, adminOnly, id, validate(S.customerUpdateSchema), misc.updateCustomer);

// --------------------------------------------------------------- contact
router.post('/contact', contactLimiter, validate(S.contactSchema), misc.createContact);
router.get('/contact', authenticate, staffOrAdmin, misc.listContacts);
router.patch('/contact/:id', authenticate, staffOrAdmin, id, validate(S.contactUpdateSchema), misc.updateContact);
router.delete('/contact/:id', authenticate, adminOnly, id, misc.deleteContact);

// -------------------------------------------------------------- whatsapp
router.get('/whatsapp/status', authenticate, staffOrAdmin, wa.status);
router.post('/whatsapp/test', authenticate, adminOnly, wa.test);
router.post('/whatsapp/send-booking/:id', authenticate, staffOrAdmin, id, wa.sendBooking);
router.get('/whatsapp/booking/:id/links', authenticate, staffOrAdmin, id, wa.bookingLinks);
router.get('/whatsapp/logs', authenticate, staffOrAdmin, wa.logs);
router.post('/whatsapp/logs/:id/retry', authenticate, staffOrAdmin, id, wa.retry);

// -------------------------------------------------------------- settings
router.get('/settings/public', misc.publicSettings);
router.get('/settings', authenticate, adminOnly, misc.adminSettings);
router.put('/settings', authenticate, adminOnly, validate(S.settingsSchema), misc.saveSettings);

// ------------------------------------------------ dashboard, reports, uploads
router.get('/dashboard/summary', authenticate, staffOrAdmin, misc.dashboardSummary);
router.get('/reports', authenticate, staffOrAdmin, misc.reports);
router.post('/uploads', authenticate, adminOnly, imageUpload, misc.uploadImage);

// ----------------------------------------------------------------- users
router.get('/users', authenticate, adminOnly, misc.listUsers);
router.post('/users', authenticate, adminOnly, validate(S.userCreateSchema), misc.createUser);
router.patch('/users/:id', authenticate, adminOnly, id, validate(S.userUpdateSchema), misc.updateUser);
router.delete('/users/:id', authenticate, adminOnly, id, misc.deleteUser);

export default router;
