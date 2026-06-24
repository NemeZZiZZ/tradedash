import { useTimezone } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimezoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimezoneDialog({ open, onOpenChange }: TimezoneDialogProps) {
  const t = useT();
  const { timezones, activeTimezone, setTimezone } = useTimezone();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("tz.title")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]" viewportClassName="pe-2">
          <ul className="py-1">
            {timezones.map((tz) => {
              const isActive = tz.key === activeTimezone;
              return (
                <li key={tz.key}>
                  <button
                    onClick={() => {
                      setTimezone(tz.key);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-accent",
                      isActive && "text-primary",
                    )}
                  >
                    <span>{tz.localeKey}</span>
                    {isActive && <Check className="size-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
