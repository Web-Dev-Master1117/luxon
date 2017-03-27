/* global test expect */

import { DateTime } from '../../dist/cjs/luxon';
import { FakePT } from '../helpers/fakePT';
import { FakeET } from '../helpers/fakeET';

const millis = 391147200000,
  // 1982-05-25T04:00:00.000Z
  dt = () => DateTime.fromMillis(millis);

//------
// defaults
//------
test('timezone defaults to local', () => {
  expect(dt().isOffsetFixed()).toBe(false);
});

//------
// #toUTC()
//------
test("DateTime#utc() puts the dt in UTC 'mode'", () => {
  const zoned = dt().toUTC();
  expect(zoned.valueOf()).toBe(millis);
  expect(zoned.hour().valueOf()).toBe(4);
  expect(zoned.timezoneName()).toBe('UTC');
  expect(zoned.isOffsetFixed()).toBe(true);
  expect(zoned.isInDST()).toBe(false);
});

test("DateTime#utc(offset) sets dt in UTC+offset 'mode'", () => {
  const zoned = dt().toUTC(5 * 60);
  expect(zoned.valueOf()).toBe(millis);
  expect(zoned.hour().valueOf()).toBe(9);
  expect(zoned.timezoneName()).toBe('UTC+5');
  expect(zoned.isOffsetFixed()).toBe(true);
  expect(zoned.isInDST()).toBe(false);
});

//------
// #toLocal()
//------
test('DateTime#toLocal() sets the calendar back to local', () => {
  const relocaled = dt().toUTC().toLocal(), expected = new Date(millis).getHours();
  expect(relocaled.isOffsetFixed()).toBe(false);
  expect(relocaled.valueOf()).toBe(millis);
  expect(relocaled.hour()).toBe(expected);
});

//------
// #timezone()
//------
test('timezone sets the TZ to the specified zone', () => {
  const zoned = dt().timezone(new FakePT());

  expect(zoned.timezoneName()).toBe('Fake Pacific Time');
  expect(zoned.isOffsetFixed()).toBe(false);
  expect(zoned.valueOf()).toBe(millis);
  expect(zoned.hour()).toBe(21);
  // pacific daylight time
  expect(zoned.isInDST()).toBe(true);
});

test('works as a getter', () => {
  const zone = dt().timezone(new FakePT()).timezone();
  expect(zone.name).toBe('Fake Pacific Time');
});

test('accepts "local"', () => {
  const zoned = DateTime.utc().timezone('local');
  expect(zoned.offset()).toBe(DateTime.local().offset());
});

test('accepts "utc"', () => {
  const zoned = DateTime.local().timezone('utc');
  expect(zoned.offset()).toBe(0);
});

test('accepts "utc+3"', () => {
  const zoned = DateTime.local().timezone('utc+3');
  expect(zoned.offset()).toBe(3 * 60);
});

test('accepts IANA zone names', () => {
  // this will only work in Chrome/V8 for now
  const zoned = dt().timezone('Europe/Paris');

  expect(zoned.timezoneName()).toBe('Europe/Paris');
  expect(zoned.offsetNameShort()).toBe('GMT+2');
  // not convinced this is universal. Could also be 'CEDT'
  expect(zoned.offsetNameLong()).toBe('Central European Summer Time');
  expect(zoned.valueOf()).toBe(millis);
  expect(zoned.hour()).toBe(6); // cedt is +2
});

test('timezone accepts a keepCalendarTime option', () => {
  const zoned = dt().toUTC().timezone(new FakePT(), { keepCalendarTime: true });
  expect(zoned.timezoneName()).toBe('Fake Pacific Time');
  expect(zoned.year()).toBe(1982);
  expect(zoned.month()).toBe(5);
  expect(zoned.day()).toBe(25);
  expect(zoned.hour()).toBe(4);
  expect(zoned.isOffsetFixed()).toBe(false);

  const zonedMore = zoned.timezone(new FakeET(), { keepCalendarTime: true });
  expect(zonedMore.timezoneName()).toBe('Fake Eastern Time');
  expect(zonedMore.year()).toBe(1982);
  expect(zonedMore.month()).toBe(5);
  expect(zonedMore.day()).toBe(25);
  expect(zonedMore.hour()).toBe(4);
  expect(zonedMore.isOffsetFixed()).toBe(false);
});

//------
// #isInDST()
//------
test('DateTime#isInDST() returns false for pre-DST times', () => {
  const zoned = dt().timezone(new FakePT());
  expect(zoned.month(1).isInDST()).toBe(false);
});

test('DateTime#isInDST() returns true for during-DST times', () => {
  const zoned = dt().timezone(new FakePT());
  expect(zoned.month(4).isInDST()).toBe(true);
});

test('DateTime#isInDST() returns false for post-DST times', () => {
  const zoned = dt().timezone(new FakePT());
  expect(zoned.month(12).isInDST()).toBe(false);
});
