import { useState } from "react";
import { toast } from "sonner";
import { uploadProductImage } from "@/features/products/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, Link as LinkIcon } from "lucide-react";

export function ImageUploader({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadProductImage(file, productId);
      onChange([...images, url]);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleAddUrl() {
    const u = urlInput.trim();
    if (!u) return;
    try {
      new URL(u);
      onChange([...images, u]);
      setUrlInput("");
    } catch {
      toast.error("URL inválida");
    }
  }

  function handleRemove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((src, idx) => (
          <div
            key={src + idx}
            className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
          >
            <img
              src={src}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Eliminar imagen"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <label
          className={`flex aspect-square cursor-pointer items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-muted ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-xs">
              <Upload className="size-5" />
              Subir
            </div>
          )}
        </label>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="O pega una URL de imagen"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddUrl();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAddUrl}>
          <LinkIcon className="size-4" />
          Agregar
        </Button>
      </div>
    </div>
  );
}
