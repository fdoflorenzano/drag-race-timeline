import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

import styles from "./Episode.module.css";

export default function Episode({ style, episode }) {
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className={styles.root} style={style} />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={styles.TooltipContent}
            sideOffset={5}
            align="start"
          >
            <p>{episode.title}</p>
            <p>{episode.seasonName}</p>
            <Tooltip.Arrow className={styles.TooltipArrow} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
