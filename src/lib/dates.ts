import * as d3 from "d3";
import moment from "moment";

export function getWeekNumber(d: string | Date) {
  const date = moment.utc(new Date(+d));
  return [
    date.isoWeek() === 53 ? date.year() - 1 : date.year(),
    date.isoWeek(),
  ];
}

export function weeksInYear(year: number) {
  const d = new Date(year, 11, 31);
  const week = getWeekNumber(d)[1];
  return week == 1 ? 52 : week;
}

export const parseTime = d3.utcParse("%b %e, %Y");
