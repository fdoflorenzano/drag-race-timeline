import { getWeekNumber, weeksInYear } from "./dates";

const START_DATE = new Date(2009, 0, 1);
const END_DATE = new Date(2024, 4, 19);

export const weeks: {
  [key: string]: { year: number; week: number; weekIndex: number };
} = {};
let weekIndex = 0;
for (
  let year = START_DATE.getFullYear();
  year <= END_DATE.getFullYear();
  year++
) {
  for (let week = 1; week <= weeksInYear(year); week++) {
    weekIndex += 1;
    weeks[`${week}-${year}`] = { year, week, weekIndex };
    const weekYear = getWeekNumber(END_DATE);
    if (year === weekYear[0] && week === weekYear[1]) {
      break;
    }
  }
}

console.log("weeks loaded");
export const weeksArray = Object.values(weeks);
