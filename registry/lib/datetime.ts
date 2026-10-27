/*
 * Port of @fundamental-ngx/core (datetime) by SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-registry: signals, root defaults and no i18n package.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    Injectable,
    InjectionToken,
    LOCALE_ID,
    Pipe,
    inject,
    signal,
    type PipeTransform,
    type Provider,
    type Signal
} from '@angular/core';

export const INVALID_DATE_ERROR = 'Invalid Date';

/** Left-pads a number with zeros. */
function pad(value: number, length = 2): string {
    return String(value).padStart(length, '0');
}

function range<T>(length: number, map: (index: number) => T): T[] {
    return Array.from({ length }, (_, index) => map(index));
}

/** ISO 8601 date and time without a time zone, e.g. `2024-03-09T14:05:00`. */
export function toIso8601(date: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}): string {
    return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}T${pad(date.hour)}:${pad(date.minute)}:${pad(date.second)}`;
}

function inRange(value: number | undefined, from: number, to: number): boolean {
    return value == null || (value >= from && value <= to);
}

/** Whether the parts make a real date (no 31st of April) and time. */
export function isValidByParams(params: {
    year: number;
    month: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
}): boolean {
    const { year, month, day, hour, minute, second } = params;
    if (
        !inRange(month, 1, 12) ||
        !inRange(day, 1, 31) ||
        !inRange(hour, 0, 23) ||
        !inRange(minute, 0, 59) ||
        !inRange(second, 0, 59)
    ) {
        return false;
    }
    if (!isNaN(year) && !isNaN(month) && day != null && !isNaN(day)) {
        const date = new Date(year, month - 1, day);
        if (date.getMonth() + 1 !== month) return false;
    }
    return !Number.isNaN(new Date(year, month - 1, day, hour, minute, second).getTime());
}

/** A local date and time; months count from 1. Invalid parts make the whole date invalid. */
export class FdDate {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    private valid: boolean;

    /** Without arguments: now. */
    constructor(year?: number, month = 1, day = 1, hour = 0, minute = 0, second = 0) {
        if (year === undefined) {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
            day = now.getDate();
            hour = now.getHours();
            minute = now.getMinutes();
            second = now.getSeconds();
        }
        const parts = [year, month, day, hour, minute, second].map((part) => Number.parseInt(String(part), 10));
        [year, month, day, hour, minute, second] = parts;
        this.valid = isValidByParams({ year, month, day, hour, minute, second });
        this.year = this.valid ? year : NaN;
        this.month = this.valid ? month : NaN;
        this.day = this.valid ? day : NaN;
        this.hour = this.valid ? hour : NaN;
        this.minute = this.valid ? minute : NaN;
        this.second = this.valid ? second : NaN;
    }

    static getNow(): FdDate {
        return new FdDate();
    }

    static getToday(): FdDate {
        return FdDate.getNow().setTime(0, 0, 0);
    }

    static getFdDateByDate(date: Date): FdDate {
        return new FdDate(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        );
    }

    /** Sets the time in place; missing parts stay. */
    setTime(hour: number, minute?: number, second?: number): FdDate {
        this.valid = isValidByParams({ year: this.year, month: this.month, day: this.day, hour, minute, second });
        if (!this.valid) {
            this.hour = this.minute = this.second = NaN;
        } else {
            this.hour = hour ?? this.hour;
            this.minute = minute ?? this.minute;
            this.second = second ?? this.second;
        }
        return this;
    }

    getTimeStamp(): number {
        return this.toDate().getTime();
    }

    /** Day of the week from 1 (Sunday) to 7. */
    getDayOfWeek(): number {
        return this.toDate().getDay() + 1;
    }

    toDate(): Date {
        if (!this.isDateValid()) return new Date(NaN);
        return new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second);
    }

    isDateValid(): boolean {
        return this.valid;
    }

    toString(): string {
        if (!this.isDateValid()) return INVALID_DATE_ERROR;
        return toIso8601(this);
    }

    valueOf(): number {
        return this.getTimeStamp();
    }

    toDateString(): string {
        return this.isDateValid() ? toIso8601(this).split('T')[0] : INVALID_DATE_ERROR;
    }

    toTimeString(): string {
        return this.isDateValid() ? toIso8601(this).split('T')[1] : INVALID_DATE_ERROR;
    }
}

/** Formats for parsing and displaying dates; with the default adapter, `Intl.DateTimeFormat` options. */
export interface DateTimeFormats<F = unknown> {
    parse: { dateInput: F; timeInput: F; dateTimeInput: F };
    display: {
        dateInput: F;
        timeInput: F;
        dateTimeInput: F;
        dateA11yLabel: F;
        monthA11yLabel: F;
        yearA11yLabel: F;
    };
    rangeDelimiter: string;
}

const dateInput: FdDateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
const timeInput: FdDateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
const dateTimeInput: FdDateTimeFormatOptions = { ...dateInput, ...timeInput };

/** The default formats of `FdDatetimeAdapter`. */
export const FD_DATETIME_FORMATS: DateTimeFormats<FdDateTimeFormatOptions> = {
    parse: { dateInput, timeInput, dateTimeInput },
    display: {
        dateInput,
        timeInput,
        dateTimeInput,
        dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
        monthA11yLabel: { month: 'long', year: 'numeric' },
        yearA11yLabel: { year: 'numeric' }
    },
    rangeDelimiter: ' - '
};

export const DATE_TIME_FORMATS = new InjectionToken<DateTimeFormats>('DateTimeFormats', {
    providedIn: 'root',
    factory: () => FD_DATETIME_FORMATS
});

/**
 * Reads, creates, compares, formats and parses dates of type D for the calendar, time and the
 * pickers. Provide another implementation to use e.g. a date library; `FdDatetimeAdapter` (dates of
 * type `FdDate`, formats from `Intl`) is the default.
 */
@Injectable({ providedIn: 'root', useFactory: () => new FdDatetimeAdapter() })
export abstract class DatetimeAdapter<D> {
    abstract getYear(date: D): number;
    /** Month from 1 to 12. */
    abstract getMonth(date: D): number;
    abstract getDate(date: D): number;
    /** Day of the week from 1 (Sunday) to 7. */
    abstract getDayOfWeek(date: D): number;
    abstract getHours(date: D): number;
    abstract getMinutes(date: D): number;
    abstract getSeconds(date: D): number;
    abstract setHours(date: D, hours: number): D;
    abstract setMinutes(date: D, minutes: number): D;
    abstract setSeconds(date: D, seconds: number): D;
    abstract getWeekNumber(date: D): number;
    abstract getMonthNames(style: 'long' | 'short' | 'narrow'): string[];
    abstract getDateNames(): string[];
    /** Names from Sunday to Saturday. */
    abstract getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[];
    abstract getYearName(date: D): string;
    abstract getWeekName(date: D): string;
    abstract getHourNames(options: { twoDigit: boolean; meridian: boolean }): string[];
    abstract getMinuteNames(options: { twoDigit: boolean; minuteStep?: number }): string[];
    abstract getSecondNames(options: { twoDigit: boolean }): string[];
    abstract getDayPeriodNames(): [string, string];
    /** First day of the week, 0 for Sunday. */
    abstract getFirstDayOfWeek(): number;
    abstract getNumDaysInMonth(date: D): number;
    abstract parse(value: unknown, parseFormat: unknown): D | null;
    abstract format(date: D | null | undefined, displayFormat: unknown): string;
    abstract createDate(year: number, month?: number, date?: number): D;
    abstract today(): D;
    abstract now(): D;
    abstract addCalendarYears(date: D, years: number): D;
    abstract addCalendarMonths(date: D, months: number): D;
    abstract addCalendarDays(date: D, days: number): D;
    abstract clone(date: D): D;
    abstract datesEqual(date1: D | null | undefined, date2: D | null | undefined): boolean;
    abstract dateTimesEqual(date1: D | null | undefined, date2: D | null | undefined): boolean;
    /** Whether a date is strictly between two others. */
    abstract isBetween(dateToCheck: D, startDate: D, endDate: D): boolean;
    abstract isValid(date: D | null | undefined): date is D;
    abstract toIso8601(date: D): string;
    abstract isTimeFormatIncludesDayPeriod(displayFormat: unknown): boolean;
    abstract isTimeFormatIncludesHours(displayFormat: unknown): boolean;
    abstract isTimeFormatIncludesMinutes(displayFormat: unknown): boolean;
    abstract isTimeFormatIncludesSeconds(displayFormat: unknown): boolean;
    /** Relative time, e.g. "3 days ago". */
    fromNow?(date: D): string;

    private readonly localeSignal = signal('');
    /** The locale of names and formats. */
    readonly locale: Signal<string> = this.localeSignal.asReadonly();

    setLocale(locale: string): void {
        this.localeSignal.set(locale);
    }

    setTime(date: D, hours: number, minutes: number, seconds: number): D {
        return this.setSeconds(this.setMinutes(this.setHours(date, hours), minutes), seconds);
    }

    /** Number of week rows of a month; the first day of the week counts from 1 (Sunday). */
    getAmountOfWeeks(year: number, month: number, firstDayOfWeek: number): number {
        const firstOfMonth = new Date(year, month - 1, 1);
        const lastOfMonth = new Date(year, month, 0);
        const offset = (firstOfMonth.getDay() - firstDayOfWeek + 8) % 7;
        return Math.ceil((offset + lastOfMonth.getDate()) / 7);
    }

    /** Negative, zero or positive as first is before, equal to or after second. */
    compareDate(first: D, second: D): number {
        return (
            this.getYear(first) - this.getYear(second) ||
            this.getMonth(first) - this.getMonth(second) ||
            this.getDate(first) - this.getDate(second) ||
            this.getHours(first) - this.getHours(second) ||
            this.getMinutes(first) - this.getMinutes(second) ||
            this.getSeconds(first) - this.getSeconds(second)
        );
    }
}

/** `Intl.DateTimeFormat` options, plus `dayPeriod: true` for "in the morning" style periods. */
export type FdDateTimeFormatOptions = Omit<Intl.DateTimeFormatOptions, 'dayPeriod'> & { dayPeriod?: boolean };

/** Names of the parts of the day for `dayPeriod: true` formats. */
export interface DayPeriodLabels {
    night: string;
    morning: string;
    afternoon: string;
    evening: string;
}

/** The default adapter: dates of type `FdDate`, names and formats from `Intl` in the app's locale. */
@Injectable()
export class FdDatetimeAdapter extends DatetimeAdapter<FdDate> {
    /** Labels for `dayPeriod: true` formats. */
    dayPeriodLabels: DayPeriodLabels = {
        night: 'at night',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening'
    };
    private relativeFormatter: Intl.RelativeTimeFormat | null = null;
    private dayFirst: boolean | null = null;

    constructor() {
        super();
        this.setLocale(inject(LOCALE_ID, { optional: true }) || 'en-US');
    }

    override setLocale(locale: string): void {
        super.setLocale(locale);
        this.relativeFormatter = null;
        this.dayFirst = null;
    }

    override fromNow(date: FdDate): string {
        if (!this.isValid(date)) return INVALID_DATE_ERROR;
        const diff = this.toDate(date).getTime() - Date.now();
        const seconds = Math.abs(diff / 1000);
        const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
            seconds < 60
                ? [Math.round(diff / 1000), 'second']
                : seconds < 3600
                  ? [Math.round(diff / 60000), 'minute']
                  : seconds < 86400
                    ? [Math.round(diff / 3600000), 'hour']
                    : seconds < 2592000
                      ? [Math.round(diff / 86400000), 'day']
                      : seconds < 31536000
                        ? [Math.round(diff / 2592000000), 'month']
                        : [Math.round(diff / 31536000000), 'year'];
        this.relativeFormatter ??= new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' });
        return this.relativeFormatter.format(value, unit);
    }

    getYear(date: FdDate): number {
        return date.year;
    }

    getMonth(date: FdDate): number {
        return date.month;
    }

    getDate(date: FdDate): number {
        return date.day;
    }

    getDayOfWeek(date: FdDate): number {
        return this.toDate(date).getDay() + 1;
    }

    getHours(date: FdDate): number {
        return date.hour;
    }

    getMinutes(date: FdDate): number {
        return date.minute;
    }

    getSeconds(date: FdDate): number {
        return date.second;
    }

    /** ISO week number. */
    getWeekNumber(fdDate: FdDate): number {
        const date = this.toDate(fdDate);
        date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
        const firstWeek = new Date(date.getFullYear(), 0, 4);
        return (
            1 + Math.round(((date.getTime() - firstWeek.getTime()) / 86400000 - 3 + ((firstWeek.getDay() + 6) % 7)) / 7)
        );
    }

    getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        const formatter = new Intl.DateTimeFormat(this.locale(), { month: style, timeZone: 'utc' });
        return range(12, (i) => this.formatDate(formatter, new Date(2017, i, 1)));
    }

    getDateNames(): string[] {
        const formatter = new Intl.DateTimeFormat(this.locale(), { day: 'numeric', timeZone: 'utc' });
        return range(31, (i) => this.formatDate(formatter, new Date(2017, 0, i + 1)));
    }

    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        const formatter = new Intl.DateTimeFormat(this.locale(), { weekday: style, timeZone: 'utc' });
        // 1 January 2017 was a Sunday
        return range(7, (i) => this.formatDate(formatter, new Date(2017, 0, i + 1)));
    }

    getYearName(date: FdDate): string {
        const formatter = new Intl.DateTimeFormat(this.locale(), { year: 'numeric', timeZone: 'utc' });
        return this.formatDate(formatter, this.toDate(date));
    }

    getWeekName(date: FdDate): string {
        return this.getWeekNumber(date).toLocaleString(this.locale());
    }

    getHourNames({ meridian, twoDigit }: { twoDigit: boolean; meridian: boolean }): string[] {
        return range(24, (hour) => {
            if (meridian) hour = hour === 0 || hour === 12 ? 12 : hour % 12;
            return hour.toLocaleString(this.locale(), { minimumIntegerDigits: twoDigit ? 2 : 1 });
        });
    }

    getMinuteNames({ twoDigit, minuteStep = 1 }: { twoDigit: boolean; minuteStep?: number }): string[] {
        return range(Math.ceil(60 / minuteStep), (index) =>
            (index * minuteStep).toLocaleString(this.locale(), { minimumIntegerDigits: twoDigit ? 2 : 1 })
        );
    }

    getSecondNames({ twoDigit }: { twoDigit: boolean }): string[] {
        return range(60, (second) => second.toLocaleString(this.locale(), { minimumIntegerDigits: twoDigit ? 2 : 1 }));
    }

    getDayPeriodNames(): [string, string] {
        const formatter = new Intl.DateTimeFormat(this.locale(), { hour: 'numeric', minute: 'numeric', hour12: true });
        const period = (hour: number) =>
            formatter.formatToParts(new Date(2020, 0, 1, hour)).find(({ type }) => type === 'dayPeriod')?.value;
        const am = period(6);
        const pm = period(16);
        return am && pm ? [am, pm] : ['AM', 'PM'];
    }

    setHours(date: FdDate, hours: number): FdDate {
        const instance = this.toDate(date);
        instance.setHours(hours);
        return FdDate.getFdDateByDate(instance);
    }

    setMinutes(date: FdDate, minutes: number): FdDate {
        const instance = this.toDate(date);
        instance.setMinutes(minutes);
        return FdDate.getFdDateByDate(instance);
    }

    setSeconds(date: FdDate, seconds: number): FdDate {
        const instance = this.toDate(date);
        instance.setSeconds(seconds);
        return FdDate.getFdDateByDate(instance);
    }

    getFirstDayOfWeek(): number {
        try {
            const locale = new Intl.Locale(this.locale()) as Intl.Locale & {
                weekInfo?: { firstDay: number };
                getWeekInfo?: () => { firstDay: number };
            };
            const weekInfo = locale.weekInfo ?? locale.getWeekInfo?.();
            if (weekInfo) return weekInfo.firstDay === 7 ? 0 : weekInfo.firstDay;
        } catch {
            // older engines: Sunday
        }
        return 0;
    }

    getNumDaysInMonth(fdDate: FdDate): number {
        return new Date(fdDate.year, fdDate.month, 0).getDate();
    }

    createDate(year: number, month = 1, date = 1): FdDate {
        return new FdDate(year, month, date);
    }

    today(): FdDate {
        return FdDate.getToday();
    }

    now(): FdDate {
        return FdDate.getNow();
    }

    /**
     * Parses an `FdDate`, a timestamp, an ISO or `Date.parse` string, a time (`14:05`, `2:05 PM`) or
     * a numeric date in the locale's order (`9.3.2024`, `3/9/2024`, `2024-03-09`), optionally with a time.
     */
    parse(value: unknown, parseFormat: FdDateTimeFormatOptions = {}): FdDate | null {
        if (!value && value !== 0) return null;
        if (value instanceof FdDate) return this.clone(value);
        if (typeof value === 'number') return FdDate.getFdDateByDate(new Date(value));
        const text = String(value);
        // numeric dates in the locale's order first: Date.parse reads "9.3.2024" month first
        let date = this.parseDate(text) ?? this.parseDateTime(text) ?? new Date(NaN);
        if (
            Number.isNaN(date.valueOf()) &&
            !parseFormat.year &&
            !parseFormat.day &&
            !parseFormat.month &&
            parseFormat.hour
        ) {
            date = this.parseTime(text);
        }
        if (Number.isNaN(date.valueOf())) date = new Date(Date.parse(text));
        return FdDate.getFdDateByDate(date);
    }

    format(date: FdDate | null | undefined, displayFormat: FdDateTimeFormatOptions): string {
        if (!this.isValid(date)) return INVALID_DATE_ERROR;
        const { dayPeriod, ...rest } = displayFormat ?? {};
        const options: Intl.DateTimeFormatOptions = { ...rest, timeZone: 'utc' };
        if (!dayPeriod) return this.formatWithIntl(date, options);
        // "2:05 in the afternoon"
        const time = this.formatWithIntl(date, options);
        const label = this.dayPeriodLabel(date);
        return options.year || options.month || options.day
            ? time.replace(/(\d{1,2}:\d{2})( [AP]M)?/, `$1 ${label}`)
            : time.replace(/(\d{1,2}:\d{2}(:\d{2})?)( [AP]M)?/, `$1 ${label}`);
    }

    addCalendarYears(date: FdDate, years: number): FdDate {
        return this.addCalendarMonths(date, years * 12);
    }

    /** Adds months, keeping the day where the month has it (31 January + 1 month = 28/29 February). */
    addCalendarMonths(fdDate: FdDate, months: number): FdDate {
        const date = this.toDate(fdDate);
        date.setMonth(date.getMonth() + months);
        if (date.getDate() !== fdDate.day) date.setDate(0);
        return FdDate.getFdDateByDate(date);
    }

    addCalendarDays(fdDate: FdDate, days: number): FdDate {
        const date = this.toDate(fdDate);
        date.setDate(date.getDate() + days);
        return FdDate.getFdDateByDate(date);
    }

    clone(date: FdDate): FdDate {
        return new FdDate(date.year, date.month, date.day, date.hour, date.minute, date.second);
    }

    isValid(date: FdDate | null | undefined): date is FdDate {
        return date instanceof FdDate && date.isDateValid();
    }

    isBetween(dateToCheck: FdDate, startDate: FdDate, endDate: FdDate): boolean {
        if (!dateToCheck || !startDate || !endDate) return false;
        const time = this.toDate(dateToCheck).getTime();
        return time > this.toDate(startDate).getTime() && time < this.toDate(endDate).getTime();
    }

    datesEqual(date1: FdDate | null | undefined, date2: FdDate | null | undefined): boolean {
        if (!date1 || !date2) return false;
        return this.toIso8601(date1).split('T')[0] === this.toIso8601(date2).split('T')[0];
    }

    dateTimesEqual(date1: FdDate | null | undefined, date2: FdDate | null | undefined): boolean {
        if (!date1 || !date2) return false;
        return this.toIso8601(date1) === this.toIso8601(date2);
    }

    toIso8601(date: FdDate): string {
        return toIso8601(date);
    }

    isTimeFormatIncludesDayPeriod(displayFormat: FdDateTimeFormatOptions): boolean {
        if (typeof displayFormat?.hour12 === 'boolean') return displayFormat.hour12;
        const date = this.createDate(2020);
        return this.format(date, displayFormat) === this.format(date, { ...displayFormat, hour12: true });
    }

    isTimeFormatIncludesHours(displayFormat: FdDateTimeFormatOptions): boolean {
        return typeof displayFormat?.hour === 'string';
    }

    isTimeFormatIncludesMinutes(displayFormat: FdDateTimeFormatOptions): boolean {
        return typeof displayFormat?.minute === 'string';
    }

    isTimeFormatIncludesSeconds(displayFormat: FdDateTimeFormatOptions): boolean {
        return typeof displayFormat?.second === 'string';
    }

    private dayPeriodLabel(date: FdDate): string {
        const hour = date.hour;
        const labels = this.dayPeriodLabels;
        return hour < 6 ? labels.night : hour < 12 ? labels.morning : hour < 18 ? labels.afternoon : labels.evening;
    }

    private formatWithIntl(date: FdDate, options: Intl.DateTimeFormatOptions): string {
        return this.formatDate(new Intl.DateTimeFormat(this.locale(), options), this.toDate(date));
    }

    /** Formats a local date in UTC, so no time zone shifts it, without directionality marks. */
    private formatDate(formatter: Intl.DateTimeFormat, date: Date): string {
        if (Number.isNaN(date.valueOf())) return INVALID_DATE_ERROR;
        const utc = new Date(0);
        utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        utc.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
        return formatter.format(utc).replace(/[‎‏]/g, '').replace(/ /g, ' ');
    }

    /** A local Date of an FdDate (years below 100 stay as they are). */
    private toDate(fdDate: FdDate): Date {
        if (!this.isValid(fdDate)) return new Date(NaN);
        const date = new Date(0);
        date.setFullYear(fdDate.year, fdDate.month - 1, fdDate.day);
        date.setHours(fdDate.hour, fdDate.minute, fdDate.second, 0);
        return date;
    }

    private parseTime(value: string): Date {
        const match = value.trim().match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp][Mm])?$/);
        if (!match) return new Date(NaN);
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = match[3] ? parseInt(match[3], 10) : 0;
        const period = match[4]?.toUpperCase();
        if (period) {
            if (hours < 1 || hours > 12) return new Date(NaN);
            hours = period === 'AM' ? hours % 12 : (hours % 12) + 12;
        }
        if (hours > 23 || minutes > 59 || seconds > 59) return new Date(NaN);
        const now = new Date();
        now.setHours(hours, minutes, seconds, 0);
        return now;
    }

    private parseDate(value: string): Date | null {
        const match = value.trim().match(/^(\d{1,4})([/\-.])(\d{1,2})\2(\d{1,4})$/);
        if (!match) return null;
        const [g1, g2, g3] = [match[1], match[3], match[4]].map((part) => parseInt(part, 10));
        let year: number;
        let month: number;
        let day: number;
        if (match[1].length === 4) {
            [year, month, day] = [g1, g2, g3];
        } else if (match[4].length === 4) {
            year = g3;
            [day, month] = this.isDayFirst() ? [g1, g2] : [g2, g1];
        } else {
            return null;
        }
        if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return null;
        const date = new Date(0);
        date.setFullYear(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private parseDateTime(value: string): Date | null {
        const match = value.trim().match(/^(.*?\d{4}),?\s+(.+)$/);
        if (!match) return null;
        const date = this.parseDate(match[1].trim());
        const time = this.parseTime(match[2].trim());
        if (!date || Number.isNaN(time.valueOf())) return null;
        date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
        return date;
    }

    /** Whether the locale writes the day before the month. */
    private isDayFirst(): boolean {
        if (this.dayFirst === null) {
            const parts = new Intl.DateTimeFormat(this.locale()).formatToParts(new Date(2020, 0, 2));
            const first = parts.find((part) => part.type === 'day' || part.type === 'month');
            this.dayFirst = first?.type === 'day';
        }
        return this.dayFirst;
    }
}

/** Provides the default adapter and formats explicitly, e.g. in a component that needs its own instance. */
export function provideDateTimeFormats(): Provider[] {
    return [
        { provide: DATE_TIME_FORMATS, useValue: FD_DATETIME_FORMATS },
        { provide: DatetimeAdapter, useClass: FdDatetimeAdapter }
    ];
}

/** Formats a date with the display date format: `{{ date | dateFormat }}`. */
@Pipe({ name: 'dateFormat', pure: false })
export class DateFormatPipe<D> implements PipeTransform {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);
    private readonly formats = inject(DATE_TIME_FORMATS);

    transform(date: D | null | undefined, noDateMessage = ''): string {
        this.adapter.locale();
        return date ? this.adapter.format(date, this.formats.display.dateInput) : noDateMessage;
    }
}

/** Formats a date with the display date and time format. */
@Pipe({ name: 'dateTimeFormat', pure: false })
export class DateTimeFormatPipe<D> implements PipeTransform {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);
    private readonly formats = inject(DATE_TIME_FORMATS);

    transform(date: D | null | undefined, noDateMessage = ''): string {
        this.adapter.locale();
        return date ? this.adapter.format(date, this.formats.display.dateTimeInput) : noDateMessage;
    }
}

/** Relative time, e.g. "3 days ago". */
@Pipe({ name: 'dateFromNow', pure: false })
export class DateFromNowPipe<D> implements PipeTransform {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);

    transform(date: D | null | undefined, noDateMessage = ''): string {
        if (!this.adapter.fromNow) return '';
        return date ? this.adapter.fromNow(date) : noDateMessage;
    }
}

/** Formats a date with a custom format, e.g. `{ hour: 'numeric', minute: '2-digit', dayPeriod: true }`. */
@Pipe({ name: 'dayPeriodFormat', pure: false })
export class DayPeriodFormatPipe<D> implements PipeTransform {
    private readonly adapter = inject<DatetimeAdapter<D>>(DatetimeAdapter);

    transform(date: D | null | undefined, customFormat: unknown = {}, noDateMessage = ''): string {
        return date ? this.adapter.format(date, customFormat) : noDateMessage;
    }
}
