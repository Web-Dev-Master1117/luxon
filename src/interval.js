import { Util } from './impl/util';
import { DateTime } from './datetime';
import { Duration } from './duration';

const INVALID = 'Invalid Interval';

/**
 * A half-open range of time spanning from one DateTime to another
 */
export class Interval {
  /**
   * @private
   */
  constructor(start, end) {
    Object.defineProperty(this, 's', { value: start, enumerable: true });
    Object.defineProperty(this, 'e', { value: end, enumerable: true });
    Object.defineProperty(this, 'valid', {
      value: !!start && !!end && start.isValid() && end.isValid() && start <= end
    });
  }

  static invalid() {
    return new Interval();
  }

  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime} start
   * @param {DateTime} end
   * @return {Interval}
   */
  static fromDateTimes(start, end) {
    return new Interval(start, end);
  }

  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime} start
   * @param {Duration|number} durationOrNumber - the length of the Interval.
   * @param {string} [unit='milliseconds'] - The unit to interpret the first argument as. Only applicable if the first argument is a number. Can be 'years', 'months', 'days', 'hours', 'minutes', 'seconds', or 'milliseconds'.
   * @return {Interval}
   */
  static after(start, durationOrNumber, unit) {
    const dur = Util.friendlyDuration(durationOrNumber, unit);
    return Interval.fromDateTimes(start, start.plus(dur));
  }

  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime} end
   * @param {Duration|number} durationOrNumber - the length of the Interval.
   * @param {string} [unit='milliseconds'] - The unit to interpret the first argument as. Only applicable if the first argument is a number. Can be 'years', 'months', 'days', 'hours', 'minutes', 'seconds', or 'milliseconds'.
   * @return {Interval}
   */
  static before(end, durationOrNumber, unit) {
    const dur = Util.friendlyDuration(durationOrNumber, unit);
    return Interval.fromDateTimes(end.minus(dur), end);
  }

  /**
   * Create an Interval from an ISO 8601 string
   * @return {Interval}
   */
  static fromISO(string, opts) {
    if (string) {
      const [s, e] = string.split(/\//);
      if (s && e) {
        return Interval.fromDateTimes(DateTime.fromISO(s, opts), DateTime.fromISO(e, opts));
      }
    }
    return Interval.invalid();
  }

  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {...string} [units=['milliseconds']] - the units (such as 'hours' or 'days') to include in the duration.
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('hours', 'minutes').toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('hours', 'minutes', 'seconds').toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(...units) {
    if (!this.valid) {
      return Duration.invalid();
    }
    return this.e.diff(this.s, ...units);
  }

  /**
   * Get or "set" the start of the Interval
   * @param {DateTime} start - the start DateTime to set. If omitted, the method operates as a getter.
   * @return {DateTime|Interval} - If a value is supplied, returns the new Interval, otherwise returns the start DateTime
   */
  start(start) {
    return Util.isUndefined(start)
      ? this.valid ? this.s : DateTime.invalid()
      : Interval.fromDateTimes(start, this.e);
  }

  /**
   * Get or "set" the end of the Interval
   * @param {DateTime} end - the end DateTime to set. If omitted, the method operates as a getter.
   * @return {DateTime|Interval} - If a value is supplied, returns the new Interval, otherwise returns the end DateTime
   */
  end(end) {
    return Util.isUndefined(end)
      ? this.valid ? this.e : DateTime.invalid()
      : Interval.fromDateTimes(this.s, end);
  }

  /**
   * Get the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(unit = 'milliseconds') {
    return this.valid ? this.toDuration(...[unit]).get(unit) : NaN;
  }

  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(unit) {
    return this.valid ? this.e.minus(1).hasSame(this.s, unit) : false;
  }

  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part
   * Unlike {@link length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @return {number}
   */
  count(unit = 'milliseconds') {
    if (!this.valid) return NaN;
    const start = this.start().startOf(unit), end = this.end().startOf(unit);
    return Math.floor(end.diff(start, unit).get(unit)) + 1;
  }

  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTimes} dateTimes - the unit of time to count.
   * @return {[Interval]}
   */
  splitAt(...dateTimes) {
    if (!this.valid) return [];
    const sorted = dateTimes.sort(), results = [];
    let s = this.s, i = 0;

    while (s < this.e) {
      const added = sorted[i] || this.e, next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
      i += 1;
    }

    return results;
  }

  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|number} durationOrNumber - The length of each resulting interval.
   * @param {string} [unit='milliseconds'] - The unit to interpret the first argument as. Only applicable if the first argument is a number. Can be 'years', 'months', 'days', 'hours', 'minutes', 'seconds', or 'milliseconds'.
   * @return {[Interval]}
   */
  splitBy(durationOrNumber, unit = 'milliseconds') {
    if (!this.valid) return [];
    const dur = Util.friendlyDuration(durationOrNumber, unit), results = [];
    let s = this.s, added, next;

    while (s < this.e) {
      added = s.plus(dur);
      next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
    }

    return results;
  }

  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {[Interval]}
   */
  divideEqually(numberOfParts) {
    if (!this.valid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  }

  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(other) {
    return this.e > other.s && this.s < other.e;
  }

  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(other) {
    if (!this.valid) return false;
    return +this.e === +other.s;
  }

  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(other) {
    if (!this.valid) return false;
    return +other.e === +this.s;
  }

  /**
   * Return whether this Interval engulfs the start and end of the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(other) {
    if (!this.valid) return false;
    return this.s <= other.s && this.e >= other.e;
  }

  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(other) {
    if (!this.valid) return Interval.invalid();
    const s = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;

    if (s > e) {
      return null;
    } else {
      return Interval.fromDateTimes(s, e);
    }
  }

  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(other) {
    if (!this.valid) return Interval.invalid();
    const s = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
    return Interval.fromDateTimes(s, e);
  }

  /**
   * Merge an array of Intervals into a equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * @param {[Interval]} intervals
   * @return {[Interval]}
   */
  static merge(intervals) {
    const [found, final] = intervals.sort((a, b) => a.s - b.s).reduce(([sofar, current], item) => {
      if (!current) {
        return [sofar, item];
      } else if (current.overlaps(item) || current.abutsStart(item)) {
        return [sofar, current.union(item)];
      } else {
        return [sofar.concat([current]), item];
      }
    }, [[], null]);
    if (final) {
      found.push(final);
    }
    return found;
  }

  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {[Interval]} intervals
   * @return {[Interval]}
   */
  static xor(intervals) {
    let start = null, currentCount = 0;
    const results = [],
      ends = intervals.map(i => [{ time: i.s, type: 's' }, { time: i.e, type: 'e' }]),
      arr = Util.flatten(ends).sort((a, b) => a.time - b.time);

    for (const i of arr) {
      currentCount += i.type === 's' ? 1 : -1;

      if (currentCount === 1) {
        start = i.time;
      } else {
        if (start && +start !== +i.time) {
          results.push(Interval.fromDateTimes(start, i.time));
        }

        start = null;
      }
    }

    return Interval.merge(results);
  }

  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Interval}
   */
  difference(...intervals) {
    return Interval.xor([this].concat(intervals))
      .map(i => this.intersection(i))
      .filter(i => i && !i.isEmpty());
  }

  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(other) {
    return this.s.equals(other.s) && this.e.equals(other.e);
  }

  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  }

  /**
   * Return whether this Interval's end is at least its start, i.e. that the Interval isn't 'backwards'.
   * @return {boolean}
   */
  isValid() {
    return this.valid;
  }

  /**
   * Return this Interval's start is after the specified DateTime.
   * @param {DateTime} other
   * @return {boolean}
   */
  isAfter(dateTime) {
    if (!this.valid) return false;
    return this.s > dateTime;
  }

  /**
   * Return this Interval's end is before the specified DateTime.
   * @param {Datetime} dateTime
   * @return {boolean}
   */
  isBefore(dateTime) {
    if (!this.valid) return false;
    return this.e.plus(1) < dateTime;
  }

  /**
   * Return this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(dateTime) {
    if (!this.valid) return false;
    return this.s <= dateTime && this.e > dateTime;
  }

  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    if (!this.valid) return INVALID;
    return `[${this.s.toISO()} – ${this.e.toISO()})`;
  }

  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {object} opts - The same options as {@link DateTime.toISO}
   * @return {string}
   */
  toISO(opts) {
    if (!this.valid) return INVALID;
    return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
  }

  /**
   * Returns a string representation of this Interval formatted according to the specified format string.
   * @param {string} dateFormat - the format string. This string formats the start and end time. See {@link DateTime.toFormat} for details.
   * @param {object} opts - options
   * @param {string} [opts.separator =  ' – '] - a separator to place between the start and end representations
   * @return {string}
   */
  toFormat(dateFormat, { separator = ' – ' } = {}) {
    if (!this.valid) return INVALID;
    return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
  }
}
