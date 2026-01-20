import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Canvas } from "~/components/canvas";
import { IMAGE_SETS } from "~/lib/image-sets";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [buildingId, setBuildingId] = useState(1);
  const [color, setColor] = useState("#c9a26d");
  return (
    <div style={{ padding: 20 }}>
      <select
        value={buildingId}
        onChange={(e) => setBuildingId(Number(e.target.value))}
      >
        {IMAGE_SETS.map((set) => (
          <option key={set.id} value={set.id}>
            Building {set.id}
          </option>
        ))}
      </select>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <Canvas id={buildingId} />
    </div>
  );
}
