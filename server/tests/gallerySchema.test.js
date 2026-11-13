import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryItemSchema, partialOf } from '../src/validators/resources.js';

const imagePost = {
  title: 'Secure Eco Ride',
  caption: 'A ride in Kigali',
  media_type: 'IMAGE',
  media_url: '/gallery/secure-eco-ride.jpg',
  is_published: true,
};

test('gallery accepts uploaded image and video posts', () => {
  assert.equal(galleryItemSchema.safeParse(imagePost).success, true);
  assert.equal(galleryItemSchema.safeParse({
    ...imagePost,
    media_type: 'VIDEO',
    media_url: '/uploads/1791657038682-3db1bbead23e.mp4',
  }).success, true);
});

test('gallery rejects external media URLs and path traversal', () => {
  assert.equal(galleryItemSchema.safeParse({ ...imagePost, media_url: 'https://example.com/image.jpg' }).success, false);
  assert.equal(galleryItemSchema.safeParse({ ...imagePost, media_url: '/uploads/../private.jpg' }).success, false);
});

test('gallery posts can be hidden with a partial update', () => {
  assert.deepEqual(partialOf(galleryItemSchema).parse({ is_published: false }), { is_published: false });
});
