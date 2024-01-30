import React, { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

import styles from "./Episode.module.css";

export default function Episode({ style, episode }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root open={open === false ? undefined : open}>
        <Tooltip.Trigger asChild>
          <div
            className={styles.root}
            style={style}
            onTouchStart={() => setOpen(true)}
          />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={styles.TooltipContent}
            sideOffset={5}
            align="start"
            onTouchStart={() => setOpen(false)}
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
