import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, toLocalFormat, toE164, waLink, telHref } from '../src/utils/phone.js';

test('normalises Rwandan business numbers to international digits', () => {
  assert.equal(normalizePhone('0793157373'), '250793157373');
  assert.equal(normalizePhone('0793520636'), '250793520636');
  assert.equal(normalizePhone('0793463324'), '250793463324');
});

test('accepts common typed variants', () => {
  for (const v of ['+250793157373', '+250 793 157 373', '00250793157373', '250793157373', '793157373', '(0793) 157-373']) {
    assert.equal(normalizePhone(v), '250793157373', v);
  }
});

test('keeps other international numbers', () => {
  assert.equal(normalizePhone('+44 7911 123456'), '447911123456');
  assert.equal(normalizePhone('+1 415 555 2671'), '14155552671');
});

test('rejects nonsense', () => {
  for (const v of ['', 'abc', '07931', '0793157373123', null, undefined, '+12']) {
    assert.equal(normalizePhone(v), null, String(v));
  }
});

test('formatting helpers', () => {
  assert.equal(toLocalFormat('250793157373'), '0793157373');
  assert.equal(toLocalFormat('447911123456'), '+447911123456');
  assert.equal(toE164('250793157373'), '+250793157373');
  assert.equal(telHref('250793157373'), 'tel:+250793157373');
  assert.equal(waLink('250793157373', 'Hi there & you'), 'https://wa.me/250793157373?text=Hi%20there%20%26%20you');
});
