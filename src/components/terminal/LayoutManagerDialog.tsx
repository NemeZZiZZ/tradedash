import { useState } from "react";
import { useLayoutManager } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Save, FolderOpen, Trash2, Pencil, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LayoutManagerDialog({ open, onOpenChange }: LayoutManagerDialogProps) {
  const t = useT();
  const {
    layouts,
    saveLayout,
    loadLayout,
    deleteLayout,
    renameLayout,
    autoSaveEnabled,
    setAutoSaveEnabled,
  } = useLayoutManager();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const save = () => {
    const n = name.trim();
    if (!n) return;
    saveLayout(n);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("lm.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span className="text-sm">{t("lm.autosave")}</span>
          <Switch checked={autoSaveEnabled} onCheckedChange={setAutoSaveEnabled} />
        </div>

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("lm.namePh")}
            className="h-8"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <Button size="sm" onClick={save} className="gap-1.5">
            <Save className="size-4" /> {t("lm.save")}
          </Button>
        </div>

        <ScrollArea className="max-h-72 rounded-md border border-border">
          {layouts.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("lm.empty")}
            </div>
          ) : (
            <ul className="p-1">
              {layouts.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 hover:bg-accent/50"
                >
                  {editing === l.id ? (
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renameLayout(l.id, editName.trim() || l.name);
                          setEditing(null);
                        }
                      }}
                      className="h-7"
                    />
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.symbol} · {l.period}
                      </div>
                    </div>
                  )}
                  <div className="flex shrink-0 items-center gap-0.5">
                    {editing === l.id ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          renameLayout(l.id, editName.trim() || l.name);
                          setEditing(null);
                        }}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            loadLayout(l.id);
                            onOpenChange(false);
                          }}
                        >
                          <FolderOpen className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing(l.id);
                            setEditName(l.name);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteLayout(l.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
