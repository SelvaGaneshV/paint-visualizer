import { createFileRoute } from "@tanstack/react-router";
import React, { useRef } from "react";
import { Canvas } from "~/components/canvas";
import { IMAGE_SETS } from "~/lib/image-sets";
import type { UploadedImages } from "~/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PaintBucket, RefreshCw, Palette, Image as ImageIcon, Link2 } from "lucide-react";

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
  const [selectedColor, setSelectedColor] = React.useState("#c9a26d");
  const [inputMode, setInputMode] = React.useState<"upload" | "preset">("upload");
  const [uploadedImages, setUploadedImages] = React.useState<UploadedImages>({
    cleaned: null,
    edge: null,
    normals: null,
    original: null,
  });
  const [imageUrls, setImageUrls] = React.useState({
    cleaned: "",
    edge: "",
    normals: "",
    original: "",
  });

  const cleanedInputRef = useRef<HTMLInputElement>(null);
  const edgeInputRef = useRef<HTMLInputElement>(null);
  const normalsInputRef = useRef<HTMLInputElement>(null);
  const originalInputRef = useRef<HTMLInputElement>(null);

  const inputRefs = {
    cleaned: cleanedInputRef,
    edge: edgeInputRef,
    normals: normalsInputRef,
    original: originalInputRef,
  };

  const clearAllInputs = (exceptType?: keyof UploadedImages) => {
    Object.entries(inputRefs).forEach(([key, ref]) => {
      if (key !== exceptType && ref.current) {
        ref.current.value = "";
      }
    });
  };

  const handleFileUpload = (type: keyof UploadedImages, file: File) => {
    setUploadedImages((prev) => {
      if (prev[type]) {
        clearAllInputs(type);
        return {
          cleaned: null,
          edge: null,
          normals: null,
          original: null,
          [type]: file,
        };
      }

      return {
        ...prev,
        [type]: file,
      };
    });
    setImageUrls({
      cleaned: "",
      edge: "",
      normals: "",
      original: "",
    });
  };

  const handleUrlSubmit = (type: keyof UploadedImages) => {
    const url = imageUrls[type];
    if (!url) return;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], url.split("/").pop() || "image", { type: blob.type });
        setUploadedImages((prev) => {
          if (prev[type]) {
            clearAllInputs(type);
            return {
              cleaned: null,
              edge: null,
              normals: null,
              original: null,
              [type]: file,
            };
          }

          return {
            ...prev,
            [type]: file,
          };
        });
        setImageUrls((prev) => ({
          ...prev,
          [type]: "",
        }));
      })
      .catch(console.error);
  };

  const handlePresetSelect = (setId: string) => {
    const preset = IMAGE_SETS.find((s) => s.id === setId);
    if (!preset) return;

    Promise.all([
      fetch(`${import.meta.env.VITE_VERCEL_BLOB}${preset.cleaned}`).then((r) => r.blob()),
      fetch(`${import.meta.env.VITE_VERCEL_BLOB}${preset.edge}`).then((r) => r.blob()),
      fetch(`${import.meta.env.VITE_VERCEL_BLOB}${preset.normals}`).then((r) => r.blob()),
      fetch(`${import.meta.env.VITE_VERCEL_BLOB}${preset.original}`).then((r) => r.blob()),
    ])
      .then(([cleanedBlob, edgeBlob, normalsBlob, originalBlob]) => {
        setUploadedImages({
          cleaned: new File([cleanedBlob], `cleaned.png`, { type: "image/png" }),
          edge: new File([edgeBlob], `edge.png`, { type: "image/png" }),
          normals: new File([normalsBlob], `normals.png`, { type: "image/png" }),
          original: new File([originalBlob], `original.png`, { type: "image/png" }),
        });
        setImageUrls({
          cleaned: "",
          edge: "",
          normals: "",
          original: "",
        });
        clearAllInputs();
      })
      .catch(console.error);
  };

  const handleModeChange = (mode: "upload" | "preset") => {
    setInputMode(mode);
    setUploadedImages({
      cleaned: null,
      edge: null,
      normals: null,
      original: null,
    });
    setImageUrls({
      cleaned: "",
      edge: "",
      normals: "",
      original: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">ColorCraft Paint Visualizer</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Upload your images or select a preset to get started
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Image Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleModeChange("upload")}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      inputMode === "upload"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => handleModeChange("preset")}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      inputMode === "preset"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    Preset
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {inputMode === "upload" ? "Upload Images" : "Select Preset"}
                </CardTitle>
                <CardDescription>
                  {inputMode === "upload"
                    ? "Upload files or enter URLs to get started"
                    : "Choose a sample building to paint"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inputMode === "upload" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cleaned" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Cleaned Image (Required)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="cleaned-url"
                          type="text"
                          placeholder="Image URL..."
                          value={imageUrls.cleaned}
                          onChange={(e) =>
                            setImageUrls((prev) => ({ ...prev, cleaned: e.target.value }))
                          }
                        />
                        <Button size="icon" onClick={() => handleUrlSubmit("cleaned")}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-xs text-muted-foreground">or</div>
                      <Input
                        ref={cleanedInputRef}
                        id="cleaned"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("cleaned", file);
                        }}
                        className="cursor-pointer"
                      />
                      {uploadedImages.cleaned && (
                        <div className="text-xs text-green-600">
                          ✓ Loaded: {uploadedImages.cleaned.name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edge" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Edge Detection Image (Required)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="edge-url"
                          type="text"
                          placeholder="Image URL..."
                          value={imageUrls.edge}
                          onChange={(e) =>
                            setImageUrls((prev) => ({ ...prev, edge: e.target.value }))
                          }
                        />
                        <Button size="icon" onClick={() => handleUrlSubmit("edge")}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-xs text-muted-foreground">or</div>
                      <Input
                        ref={edgeInputRef}
                        id="edge"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("edge", file);
                        }}
                        className="cursor-pointer"
                      />
                      {uploadedImages.edge && (
                        <div className="text-xs text-green-600">
                          ✓ Loaded: {uploadedImages.edge.name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="normals" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Normal Map Image (Required)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="normals-url"
                          type="text"
                          placeholder="Image URL..."
                          value={imageUrls.normals}
                          onChange={(e) =>
                            setImageUrls((prev) => ({ ...prev, normals: e.target.value }))
                          }
                        />
                        <Button size="icon" onClick={() => handleUrlSubmit("normals")}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-xs text-muted-foreground">or</div>
                      <Input
                        ref={normalsInputRef}
                        id="normals"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("normals", file);
                        }}
                        className="cursor-pointer"
                      />
                      {uploadedImages.normals && (
                        <div className="text-xs text-green-600">
                          ✓ Loaded: {uploadedImages.normals.name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="original" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Original Image (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="original-url"
                          type="text"
                          placeholder="Image URL..."
                          value={imageUrls.original}
                          onChange={(e) =>
                            setImageUrls((prev) => ({ ...prev, original: e.target.value }))
                          }
                        />
                        <Button size="icon" onClick={() => handleUrlSubmit("original")}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-xs text-muted-foreground">or</div>
                      <Input
                        ref={originalInputRef}
                        id="original"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("original", file);
                        }}
                        className="cursor-pointer"
                      />
                      {uploadedImages.original && (
                        <div className="text-xs text-green-600">
                          ✓ Loaded: {uploadedImages.original.name}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="preset">Select Building</Label>
                    <Select onValueChange={handlePresetSelect}>
                      <SelectTrigger id="preset">
                        <SelectValue placeholder="Choose a building..." />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_SETS.map((set) => (
                          <SelectItem key={set.id} value={set.id}>
                            Building {set.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {uploadedImages.cleaned && (
                      <div className="text-xs text-green-600">✓ Preset loaded</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paint Color</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <CardTitle className="flex items-center gap-2">
                    <PaintBucket className="h-5 w-5" />
                    Canvas
                  </CardTitle>
                  <CardDescription>Click regions to paint</CardDescription>
                </div>
                <Canvas uploadedImages={uploadedImages} selectedColor={selectedColor} />
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      const canvas = document.getElementById("uploaded-canvas");
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
                      const canvas = document.getElementById("uploaded-canvas");
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
