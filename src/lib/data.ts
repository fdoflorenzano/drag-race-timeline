import type { CollectionEntry } from "astro:content";
import { parseTime, getWeekNumber } from "../lib/dates";
import { weeks, weeksArray } from "../lib/weeks";

interface Episode {
  date: Date;
  week: number;
  title: string;
  isDouble: boolean;
  isSecond: boolean;
  image?: string | undefined;
}

interface Season {
  versionTitle: string;
  episodes: Episode[];
  season: string;
  shortSeason: string;
  shortTitle: string;
  year: number;
  unfinished?: boolean | undefined;
  xOffset?: number | undefined;
}

type SeasonDict = { [key: string]: Season[] };

type ExtendedSeason = Season & {
  weekStart: number;
  weekEnd: number;
};

type GraphicableSeason = ExtendedSeason & { xOffset: number };

export type ExtendedEpisode = Episode & {
  season: string;
  seasonName: string;
  xOffset: number;
};

export interface Streak {
  start: number;
  end: number;
  episodes: ExtendedEpisode[];
  unfinished: boolean;
  season: string;
}

export const processRawSeasons = (versions: CollectionEntry<"version">[]) => {
  const versionCount = versions.length;
  let seasonCount = 0;
  const countries: { [key: string]: true } = {};

  const seasons: SeasonDict = {};

  for (let version of versions) {
    const versionData = version.data;

    const processedSeasons = [];
    for (let rawSeason of versionData.seasons) {
      // Count
      seasonCount += 1;
      if (versionData.country != null) {
        if (Array.isArray(versionData.country)) {
          for (let c of versionData.country) {
            countries[c] = true;
          }
        } else {
          countries[versionData.country] = true;
        }
      }

      // Extend season's data
      const season: Season = {
        ...rawSeason,
        versionTitle: version.data.title,
        episodes: [],
      };

      // Extend episode
      let lastDate = null;
      for (let index = 0; index < rawSeason.episodes.length; index++) {
        const episode = rawSeason.episodes[index];
        const date = parseTime(episode.date) as Date;
        const weekYear = getWeekNumber(date);
        const weekObject = weeks[`${weekYear[1]}-${weekYear[0]}`];
        // console.log({ weekObject, weekYear, date });
        const week = weekObject.weekIndex;

        let isDouble = false;
        let isSecond = false;
        if (lastDate != null && date.toISOString() === lastDate.toISOString()) {
          isDouble = true;
          isSecond = true;

          season.episodes[index - 1].isDouble = true;
        }
        lastDate = date;

        const ep = { ...episode, date, week, isDouble, isSecond };
        season.episodes.push(ep);
      }
      processedSeasons.push(season);
    }
    seasons[version.data.title] = processedSeasons;
  }

  // Finish pending count
  const countryCount = Object.keys(countries).filter(
    (c) => c !== "World",
  ).length;

  return {
    seasons,
    counts: {
      versions: versionCount,
      countries: countryCount,
      seasons: seasonCount,
    },
  };
};

export const extendSeasons = (seasons: SeasonDict) => {
  const extendedSeasons: ExtendedSeason[] = [];
  for (let version in seasons) {
    const versionData = seasons[version];
    for (let season of versionData) {
      const premierDate = season.episodes[0].date;
      const premierWeek = getWeekNumber(premierDate);
      const weekStart = weeks[`${premierWeek[1]}-${premierWeek[0]}`].weekIndex;
      const finaleDate = season.episodes[season.episodes.length - 1].date;
      const finaleWeek = getWeekNumber(finaleDate);
      const weekEnd = weeks[`${finaleWeek[1]}-${finaleWeek[0]}`].weekIndex;

      extendedSeasons.push({
        ...season,
        weekStart,
        weekEnd,
        xOffset: season.xOffset ?? undefined,
      });
    }
  }
  return extendedSeasons;
};

export const calculateXOffSet = (seasons: ExtendedSeason[]) => {
  let graphicableSeasons: GraphicableSeason[] = [];
  let currentSeasons: ExtendedSeason[] = [];
  let maxOffset = 0;

  for (let season of seasons) {
    if (season.xOffset != null) {
      graphicableSeasons.push({ ...season, xOffset: season.xOffset });
    }
  }

  for (let week of weeksArray) {
    const { weekIndex } = week;

    currentSeasons = currentSeasons.filter((s) => s.weekEnd >= weekIndex);

    for (let season of seasons) {
      if (
        season.weekStart <= weekIndex &&
        season.weekEnd >= weekIndex &&
        season.xOffset == null
      ) {
        currentSeasons.push(season);
      }
    }

    let nextOffSet = 0;
    const updateOffset = () => {
      let shouldContinue = false;
      let first = true;
      while (shouldContinue || first) {
        shouldContinue = false;
        first = false;
        for (let index = 0; index < currentSeasons.length; index++) {
          const season = currentSeasons[index];
          if (season.xOffset === nextOffSet) {
            nextOffSet += 1;
            shouldContinue = true;
            break;
          }
        }
      }
    };

    updateOffset();

    for (let season of currentSeasons) {
      if (season.xOffset == null) {
        season.xOffset = nextOffSet;
        graphicableSeasons.push({ ...season, xOffset: nextOffSet });
        if (maxOffset < nextOffSet) {
          maxOffset = nextOffSet;
        }
        updateOffset();
      }
    }
  }

  return { graphicableSeasons, maxOffset };
};

export const calculateBaseStreaks = (seasons: GraphicableSeason[]) => {
  const episodes: ExtendedEpisode[] = [];
  let streaks: Streak[] = [];

  const usedWeeks: { [key: string]: true } = {};

  for (let season of seasons) {
    const seasonStreaks: Streak[] = [];
    let lastSeasonWeek = null;
    for (let episode of season.episodes) {
      const extEpisode: ExtendedEpisode = {
        ...episode,
        season: season.shortTitle,
        seasonName: season.versionTitle + " " + season.shortSeason,
        xOffset: season.xOffset,
      };
      episodes.push(extEpisode);

      const weekYear = getWeekNumber(extEpisode.date);
      const week = weeks[`${weekYear[1]}-${weekYear[0]}`].weekIndex;

      usedWeeks[week] = true;

      if (lastSeasonWeek == null) {
        lastSeasonWeek = week;
        seasonStreaks.push({
          start: week,
          end: week,
          episodes: [extEpisode],
          unfinished: !!season.unfinished,
          season: extEpisode.season,
        });
      } else {
        if (lastSeasonWeek + 1 === week || lastSeasonWeek === week) {
          const streak = seasonStreaks[seasonStreaks.length - 1];
          streak.end = week;
          streak.episodes.push(extEpisode);
        } else {
          seasonStreaks.push({
            start: week,
            end: week,
            episodes: [extEpisode],
            unfinished: !!season.unfinished,
            season: extEpisode.season,
          });
        }
        lastSeasonWeek = week;
      }
    }
    streaks = [...streaks, ...seasonStreaks];
  }

  episodes.sort((a, b) =>
    b.week === a.week ? a.xOffset - b.xOffset : b.week - a.week,
  );
  const usedWeeksArray = Object.keys(usedWeeks).map((k) => parseInt(k));
  usedWeeksArray.sort((a, b) => a - b);

  let generalStreaks = [];
  let lastWeek = null;
  for (let week of usedWeeksArray) {
    if (lastWeek == null) {
      lastWeek = week;
      generalStreaks.push({
        start: week,
        end: week,
      });
    } else {
      if (lastWeek + 1 === week || lastWeek === week) {
        const streak = generalStreaks[generalStreaks.length - 1];
        streak.end = week;
      } else {
        generalStreaks.push({
          start: week,
          end: week,
        });
      }
      lastWeek = week;
    }
  }

  const aux = [...generalStreaks];
  generalStreaks = [];
  for (let streak of aux) {
    if (generalStreaks.length === 0 || streak.end - streak.start > 30)
      generalStreaks.push(streak);
    else {
      const lastStreak = generalStreaks[generalStreaks.length - 1];
      if (lastStreak.end - lastStreak.start < streak.end - streak.start) {
        generalStreaks.push(streak);
      }
    }
  }

  return { episodes, streaks, generalStreaks };
};
