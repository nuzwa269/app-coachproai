"use client";

import { useState } from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavedOutput } from "@/types/database";

type Category = SavedOutput["category"];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "database", label: "Database" },
  { value: "api", label: "API" },
  { value: "docs", label: "Docs" },
  { value: "general", label: "General" },
];

interface SaveToWorkspaceButtonProps {
  projectId: string;
  content: string;
  assistantType: string;
  onSaved?: () => void;
}

export function SaveToWorkspaceButton({
  projectId,
  content,
  assistantType,
  onSaved,
}: SaveToWorkspaceButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/saved-outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          content,
          category,
          assistant_type: assistantType,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save output");
      }

      setSaved(true);
      setOpen(false);
      setTitle("");
      setCategory("general");
      onSaved?.();

      // Reset saved indicator after a moment
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 gap-1.5 text-xs ${
          saved
            ? "text-green-600 hover:text-green-600"
            : "text-gray-400 hover:text-brand-orange"
        }`}
        onClick={() => {
          setSaved(false);
          setOpen(true);
        }}
      >
        {saved ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Saved
          </>
        ) : (
          <>
            <BookmarkPlus className="h-3.5 w-3.5" />
            Save to Workspace
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Save to Workspace</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="save-title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="save-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Database Schema Design"
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tab</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      category === cat.value
                        ? "bg-brand-orange text-white border-brand-orange"
                        : "bg-white text-gray-600 border-gray-200 hover:border-brand-orange hover:text-brand-orange"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
