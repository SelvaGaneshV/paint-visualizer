import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Canvas } from "~/components/canvas";
import { IMAGE_SETS } from "~/lib/image-sets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { PaintBucket, RefreshCw, Palette } from "lucide-react";

export const Route = createFileRoute("/")({
  component: App,
});

const PRESET_COLORS = [
  "#c9a26d",
  "#e8d4a8",
  "#8b7355",
  "#a0826d",
  "#d4b896",
  "#f5e6d3",
  "#7a6b5a",
  "#bfa68a",
  "#e6dcc8",
  "#9c8b74",
];

function App() {
  const [buildingId, setBuildingId] = useState("1");
  const [selectedColor, setSelectedColor] = useState("#c9a26d");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">ColorCraft Paint Visualizer</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Select regions and paint with realistic colors
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
                <CardDescription>Choose a building and pick your paint color</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select value={buildingId} onValueChange={(value) => setBuildingId(value)}>
                    <SelectTrigger id="building">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_SETS.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          Building {set.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="color">Paint Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="color"
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {selectedColor.toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quick Colors</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`h-8 w-full rounded-md border-2 transition-all hover:scale-110 ${
                            selectedColor === color
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    1
                  </div>
                  <p>Click on the building to select a region</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    2
                  </div>
                  <p>Shift+click to select multiple regions</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    3
                  </div>
                  <p>Use buttons below to apply paint</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PaintBucket className="h-5 w-5" />
                      Canvas
                    </CardTitle>
                    <CardDescription>
                      Building {buildingId} - Click regions to paint
                    </CardDescription>
                  </div>
                  <Canvas id={buildingId} selectedColor={selectedColor} />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      const canvas = document.getElementById(buildingId + "-canvas");
                      if (!canvas) return;
                      const event = new CustomEvent("paint-all");
                      canvas?.dispatchEvent(event);
                    }}
                  >
                    <PaintBucket className="h-4 w-4" />
                    Paint All
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      const canvas = document.getElementById(buildingId + "-canvas");
                      if (!canvas) return;
                      const event = new CustomEvent("reload");
                      canvas?.dispatchEvent(event);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reload Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
