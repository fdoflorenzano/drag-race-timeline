import moment from "moment";

import { weeksArray } from "./weeks";
import type { ExtendedEpisode, GeneralStreak, Streak } from "./data";

// A streak (season or general) clipped to a single year. A streak that crosses
// a year boundary becomes one segment per year; the cut edges are squared so
// the segments read as one continuous bar across sections.
export interface SectionStreak {
  topRow: number; // local grid row of the newest week in the segment
  span: number; // number of rows the segment covers
  topRounded: boolean; // segment holds the true (newest) end and is finished
  bottomRounded: boolean; // segment holds the true (oldest) start
  unfinished: boolean;
  xOffset: number; // lane (season streaks only; general uses the last track)
  season: string;
  weeks: number; // full streak length, for the general-streak label
  showLabel: boolean; // label only on the segment that holds the true end
  isCurrent: boolean;
  isLongest: boolean;
}

export interface YearSection {
  year: number;
  rowCount: number;
  monthLabels: { row: number; label: string }[];
  monthStartRows: number[]; // local rows whose bottom edge is a month boundary
  episodes: { episode: ExtendedEpisode; row: number }[];
  streaks: SectionStreak[];
  generalStreaks: SectionStreak[];
}

export function buildSections(
  episodes: ExtendedEpisode[],
  streaks: Streak[],
  generalStreaks: GeneralStreak[],
): YearSection[] {
  // Monday + month for every week, used for the month ticks on the axis.
  const mondays = weeksArray.map((d) =>
    moment.utc().isoWeekYear(d.year).isoWeek(d.week).isoWeekday(1),
  );
  const isMonthStart = weeksArray.map(
    (d, i) => i === 0 || mondays[i].month() !== mondays[i - 1].month(),
  );

  // Group weeks into runs of the same ISO week-year, then emit newest-first so
  // the current year renders at the top of the page.
  const groups: { year: number; first: number; last: number }[] = [];
  weeksArray.forEach((d, i) => {
    const g = groups[groups.length - 1];
    if (g && g.year === d.year) g.last = i;
    else groups.push({ year: d.year, first: i, last: i });
  });
  groups.reverse();

  return groups.map((g) => {
    // weekIndex is 1-based and equals (chronological index + 1).
    const firstWk = g.first + 1;
    const lastWk = g.last + 1;
    const rowCount = lastWk - firstWk + 1;
    // Newest week sits at local row 1 (top); oldest at the bottom.
    const row = (weekIndex: number) => lastWk - weekIndex + 1;

    const monthLabels: { row: number; label: string }[] = [];
    const monthStartRows: number[] = [];
    for (let i = g.first; i <= g.last; i++) {
      if (!isMonthStart[i]) continue;
      const r = row(i + 1);
      monthLabels.push({ row: r, label: mondays[i].format("MMM") });
      monthStartRows.push(r);
    }

    const sectionEpisodes = episodes
      .filter((e) => e.week >= firstWk && e.week <= lastWk)
      .map((episode) => ({ episode, row: row(episode.week) }));

    const clip = (
      start: number,
      end: number,
      unfinished: boolean,
    ): Omit<
      SectionStreak,
      "unfinished" | "xOffset" | "season" | "weeks" | "isCurrent" | "isLongest"
    > | null => {
      const segStart = Math.max(start, firstWk);
      const segEnd = Math.min(end, lastWk);
      if (segStart > segEnd) return null;
      return {
        topRow: row(segEnd),
        span: segEnd - segStart + 1,
        topRounded: segEnd === end && !unfinished,
        bottomRounded: segStart === start,
        showLabel: end >= firstWk && end <= lastWk,
      };
    };

    const sectionStreaks: SectionStreak[] = [];
    for (const s of streaks) {
      const c = clip(s.start, s.end, s.unfinished);
      if (!c) continue;
      sectionStreaks.push({
        ...c,
        unfinished: s.unfinished,
        xOffset: s.episodes[0].xOffset,
        season: s.season,
        weeks: s.end - s.start + 1,
        isCurrent: false,
        isLongest: false,
      });
    }

    const sectionGeneral: SectionStreak[] = [];
    for (const s of generalStreaks) {
      const c = clip(s.start, s.end, false);
      if (!c) continue;
      sectionGeneral.push({
        ...c,
        unfinished: false,
        xOffset: 0,
        season: "",
        weeks: s.end - s.start + 1,
        isCurrent: s.isCurrent,
        isLongest: s.isLongest,
      });
    }

    return {
      year: g.year,
      rowCount,
      monthLabels,
      monthStartRows,
      episodes: sectionEpisodes,
      streaks: sectionStreaks,
      generalStreaks: sectionGeneral,
    };
  });
}
