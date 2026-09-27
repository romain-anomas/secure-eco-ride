// Used only to render the public site when the API is unreachable. Nothing here is invented company data.
export const DEFAULT_SETTINGS = {
  company_name: 'Secure Eco Ride',
  slogan: 'Safe journeys, cleaner tomorrow.',
  tagline: 'Your reliable taxi service for every journey.',
  company_description: 'Secure Eco Ride provides safe, reliable and professional taxi transportation, airport transfers, corporate travel and private rides.',
  about_text: 'We are a taxi service built around three promises: your safety, professional drivers, and a cleaner tomorrow.\n\nWhether you need a local trip, a long-distance ride, an airport transfer or regular business travel, our team confirms every booking personally and keeps you informed until you arrive.',
  phone_numbers: ['0793157373', '0793520636', '0793463324'],
  whatsapp_numbers: ['0793157373', '0793520636', '0793463324'],
  email: '', address: '', service_areas: '', business_hours: '',
  social_links: { facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '' },
  logo_url: '', hero_image_url: '', show_prices: false, currency: 'RWF',
};

export const DEFAULT_SERVICES = [
  { id: 'd1', slug: 'local-long-distance-rides', name: 'Local & Long Distance Rides', icon: 'car', description: 'Comfortable trips around town or across the country, with a professional driver.', is_bookable: 1 },
  { id: 'd2', slug: 'airport-transfers', name: 'Airport Transfers', icon: 'plane', description: 'Scheduled airport pickup and drop-off so you never miss a flight or wait on arrival.', is_bookable: 1 },
  { id: 'd3', slug: 'corporate-private-travel', name: 'Corporate & Private Travel', icon: 'briefcase', description: 'Reliable transport for businesses, hotels, events, executives and private clients.', is_bookable: 1 },
  { id: 'd4', slug: 'on-time-every-time', name: 'On Time, Every Time', icon: 'clock', description: 'Our promise on every booking: we plan the pickup so you arrive when you need to.', is_bookable: 0 },
];
