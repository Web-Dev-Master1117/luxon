import {Instant} from '../../dist/cjs/luxon';

let instant = Instant.fromJSDate(new Date(1982, 4, 25, 9, 23, 54, 123)),
    utc = Instant.fromMillis(Date.UTC(1982, 4, 25, 9, 23, 54, 123)).utc();

//------
// year/month/day/hour/minute/second/millisecond
//-------

test('instant#year() returns the year', () => {
  expect(instant.year()).toBe(1982);
  expect(utc.year()).toBe(1982);
});

test('instant#month() returns the (1-indexed) month', () => {
  expect(instant.month()).toBe(5);
  expect(utc.month()).toBe(5);
});

test('instant#day() returns the day', () => {
  expect(instant.day()).toBe(25);
  expect(utc.day()).toBe(25);
});

test('instant#hour() returns the hour', () => {
  expect(instant.hour()).toBe(9);
  expect(utc.hour()).toBe(9);
});

test('instant#minute() returns the minute', () => {
  expect(instant.minute()).toBe(23);
  expect(utc.minute()).toBe(23);
});

test('instant#second() returns the second', () => {
  expect(instant.second()).toBe(54);
  expect(utc.second()).toBe(54);
});

test('instant#millisecond() returns the millisecond', () => {
  expect(instant.millisecond()).toBe(123);
  expect(utc.millisecond()).toBe(123);
});

//------
// locale
//-------
test('instant#locale() returns the locale', () => {
  let i = Instant.now().locale('be');
  expect(i.locale()).toBe('be');
});
