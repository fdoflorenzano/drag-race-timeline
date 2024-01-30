import React from "react";
import * as d3 from "d3";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";

const formatTime = d3.utcFormat("%b %e, %Y");

import styles from "./Episode.module.css";

const Content = ({ episode }) => {
  console.log({ episode });
  return (
    <div className={styles.content}>
      <h2>{episode.title}</h2>
      <p>{formatTime(episode.date)}</p>
      <p>{episode.seasonName}</p>
    </div>
  );
};

export default function Episode({ style, episode }) {
  return (
    <>
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div
              className={`${styles.trigger} ${styles.desktopTrigger}`}
              style={style}
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className={styles.TooltipContent}
              sideOffset={5}
              align="start"
            >
              <Content episode={episode} />
              <Tooltip.Arrow className={styles.TooltipArrow} />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      <Popover.Root>
        <Popover.Trigger asChild>
          <div
            className={`${styles.trigger} ${styles.mobileTrigger}`}
            style={style}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className={styles.TooltipContent}
            sideOffset={5}
            align="start"
            side="top"
          >
            <Content episode={episode} />
            <Popover.Arrow className={styles.TooltipArrow} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
