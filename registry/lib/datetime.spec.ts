import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    DATE_TIME_FORMATS,
    DateFormatPipe,
    DateTimeFormatPipe,
    DatetimeAdapter,
    DayPeriodFormatPipe,
    FD_DATETIME_FORMATS,
    FdDate,
    FdDatetimeAdapter,
    INVALID_DATE_ERROR
} from './datetime';

function adapter(locale = 'en-US'): FdDatetimeAdapter {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
    return TestBed.inject(DatetimeAdapter) as FdDatetimeAdapter;
}

describe('FdDate', () => {
    it('holds a local date and time with months from 1', () => {
        const date = new FdDate(2024, 2, 29, 13, 5, 9);
        expect(date.isDateValid()).toBe(true);
        expect(date.toString()).toBe('2024-02-29T13:05:09');
        expect(date.toDateString()).toBe('2024-02-29');
        expect(date.toTimeString()).toBe('13:05:09');
        expect(date.getDayOfWeek()).toBe(5);
        expect(date.toDate().getMonth()).toBe(1);
    });

    it('is invalid for impossible dates and times', () => {
        expect(new FdDate(2023, 2, 29).isDateValid()).toBe(false);
        expect(new FdDate(2024, 13, 1).isDateValid()).toBe(false);
        expect(new FdDate(2024, 1, 1, 24).isDateValid()).toBe(false);
        expect(new FdDate(2023, 4, 31).toString()).toBe(INVALID_DATE_ERROR);
        const date = new FdDate(2024, 1, 1).setTime(25, 0, 0);
        expect(date.isDateValid()).toBe(false);
    });

    it('is now without arguments and today at midnight', () => {
        const now = new Date();
        const today = FdDate.getToday();
        expect([today.year, today.month, today.day]).toEqual([now.getFullYear(), now.getMonth() + 1, now.getDate()]);
        expect([today.hour, today.minute, today.second]).toEqual([0, 0, 0]);
        expect(new FdDate().year).toBe(now.getFullYear());
    });
});

describe('FdDatetimeAdapter', () => {
    it('is the default adapter with the default formats', () => {
        expect(adapter()).toBeInstanceOf(FdDatetimeAdapter);
        expect(TestBed.inject(DATE_TIME_FORMATS)).toBe(FD_DATETIME_FORMATS);
    });

    it('names months, days, hours and periods in the locale', () => {
        const en = adapter();
        expect(en.getMonthNames('long')[0]).toBe('January');
        expect(en.getMonthNames('short')[11]).toBe('Dec');
        expect(en.getDayOfWeekNames('short')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        expect(en.getDateNames()[30]).toBe('31');
        expect(en.getHourNames({ twoDigit: false, meridian: true }).slice(0, 2)).toEqual(['12', '1']);
        expect(en.getHourNames({ twoDigit: true, meridian: false })[13]).toBe('13');
        expect(en.getMinuteNames({ twoDigit: true, minuteStep: 15 })).toEqual(['00', '15', '30', '45']);
        expect(en.getDayPeriodNames()).toEqual(['AM', 'PM']);
        expect(en.getFirstDayOfWeek()).toBe(0);
        en.setLocale('de-DE');
        expect(en.getMonthNames('long')[2]).toBe('März');
        expect(en.getFirstDayOfWeek()).toBe(1);
    });

    it('does calendar arithmetic', () => {
        const en = adapter();
        const date = en.createDate(2024, 1, 31);
        expect(en.addCalendarMonths(date, 1).toDateString()).toBe('2024-02-29');
        expect(en.addCalendarYears(en.createDate(2024, 2, 29), 1).toDateString()).toBe('2025-02-28');
        expect(en.addCalendarDays(date, 1).toDateString()).toBe('2024-02-01');
        expect(en.getNumDaysInMonth(en.createDate(2024, 2))).toBe(29);
        expect(en.getWeekNumber(en.createDate(2021, 1, 3))).toBe(53);
        expect(en.getWeekNumber(en.createDate(2024, 12, 30))).toBe(1);
        // September 2024 starts on a Sunday: six rows when weeks start on Monday (2)
        expect(en.getAmountOfWeeks(2024, 9, 2)).toBe(6);
        expect(en.getAmountOfWeeks(2024, 9, 1)).toBe(5);
        expect(en.isBetween(en.createDate(2024, 1, 2), en.createDate(2024, 1, 1), en.createDate(2024, 1, 3))).toBe(
            true
        );
        expect(en.datesEqual(new FdDate(2024, 1, 1, 9), new FdDate(2024, 1, 1, 18))).toBe(true);
        expect(en.dateTimesEqual(new FdDate(2024, 1, 1, 9), new FdDate(2024, 1, 1, 18))).toBe(false);
        expect(en.compareDate(new FdDate(2024, 1, 2), new FdDate(2024, 1, 1))).toBeGreaterThan(0);
        expect(en.setTime(en.createDate(2024, 1, 1), 14, 30, 15).toTimeString()).toBe('14:30:15');
    });

    it('formats dates, times and day periods', () => {
        const en = adapter();
        const date = new FdDate(2024, 3, 9, 14, 5);
        expect(en.format(date, FD_DATETIME_FORMATS.display.dateInput)).toBe('3/9/2024');
        expect(en.format(date, FD_DATETIME_FORMATS.display.timeInput)).toBe('2:05 PM');
        expect(en.format(date, FD_DATETIME_FORMATS.display.dateA11yLabel)).toBe('March 9, 2024');
        expect(en.format(date, { hour: 'numeric', minute: '2-digit', hour12: false, dayPeriod: true })).toBe(
            '14:05 in the afternoon'
        );
        expect(en.format(new FdDate(2024, 2, 30), {})).toBe(INVALID_DATE_ERROR);
        expect(en.isTimeFormatIncludesDayPeriod(FD_DATETIME_FORMATS.display.timeInput)).toBe(true);
        expect(en.isTimeFormatIncludesSeconds(FD_DATETIME_FORMATS.display.timeInput)).toBe(false);
        en.setLocale('de-DE');
        expect(en.format(date, FD_DATETIME_FORMATS.display.dateInput)).toBe('9.3.2024');
        expect(en.isTimeFormatIncludesDayPeriod(FD_DATETIME_FORMATS.display.timeInput)).toBe(false);
    });

    it('parses dates and times in the order of the locale', () => {
        const en = adapter();
        expect(en.parse('3/9/2024', FD_DATETIME_FORMATS.parse.dateInput)?.toDateString()).toBe('2024-03-09');
        expect(en.parse('2024-03-09T10:20:30', {})?.toString()).toBe('2024-03-09T10:20:30');
        expect(en.parse('2:05 PM', FD_DATETIME_FORMATS.parse.timeInput)?.toTimeString()).toBe('14:05:00');
        expect(en.parse('', {})).toBeNull();
        expect(en.parse('nonsense', {})?.isDateValid()).toBe(false);
        en.setLocale('de-DE');
        expect(en.parse('9.3.2024', FD_DATETIME_FORMATS.parse.dateInput)?.toDateString()).toBe('2024-03-09');
        expect(en.parse('9.3.2024 14:05', FD_DATETIME_FORMATS.parse.dateTimeInput)?.toString()).toBe(
            '2024-03-09T14:05:00'
        );
        expect(en.parse('31.4.2024', {})?.isDateValid()).toBe(false);
    });

    it('tells the time from now', () => {
        const en = adapter();
        const yesterday = en.addCalendarDays(en.now(), -1);
        expect(en.fromNow(yesterday)).toBe('yesterday');
    });
});

@Component({
    imports: [DateFormatPipe, DateTimeFormatPipe, DayPeriodFormatPipe],
    template: `<span>{{ date | dateFormat }}</span
        >|<span>{{ date | dateTimeFormat }}</span
        >|<span>{{ null | dateFormat: 'none' }}</span
        >|<span>{{ date | dayPeriodFormat: { year: 'numeric' } }}</span>`
})
class PipesHost {
    readonly date = new FdDate(2024, 3, 9, 14, 5);
}

describe('datetime pipes', () => {
    it('format dates in templates', async () => {
        const fixture = TestBed.createComponent(PipesHost);
        await fixture.whenStable();
        expect((fixture.nativeElement as HTMLElement).textContent).toBe('3/9/2024|3/9/2024, 2:05 PM|none|2024');
    });
});
