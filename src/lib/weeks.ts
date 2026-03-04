import { getWeekNumber, weeksInYear } from "./dates";

const START_DATE = new Date(2009, 0, 1);

export const weeks: {
  [key: string]: { year: number; week: number; weekIndex: number };
} = {};

export const weeksArray: { year: number; week: number; weekIndex: number }[] =
  [];

export function buildWeeks(endDate: Date) {
  for (const key in weeks) delete weeks[key];
  weeksArray.length = 0;

  let weekIndex = 0;
  for (
    let year = START_DATE.getFullYear();
    year <= endDate.getFullYear();
    year++
  ) {
    for (let week = 1; week <= weeksInYear(year); week++) {
      weekIndex += 1;
      weeks[`${week}-${year}`] = { year, week, weekIndex };
      const weekYear = getWeekNumber(endDate);
      if (year === weekYear[0] && week === weekYear[1]) {
        break;
      }
    }
  }

  weeksArray.push(...Object.values(weeks));
}
