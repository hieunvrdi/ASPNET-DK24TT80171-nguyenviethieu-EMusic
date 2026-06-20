"use client";

import { useState } from "react";
import PlayerBar from "./PlayerBar";
import QueuePanel from "./QueuePanel";

export default function PlayerShell() {
  const [queueOpen, setQueueOpen] = useState(false);

  return (
    <>
      {/* Queue panel — slides in above the bar */}
      {queueOpen && (
        <QueuePanel onClose={() => setQueueOpen(false)} />
      )}

      {/* Persistent player bar */}
      <PlayerBar
        queueOpen={queueOpen}
        onToggleQueue={() => setQueueOpen((o) => !o)}
      />
    </>
  );
}
