import { useState } from "react";
import { useScreenshot } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Copy, Check, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ScreenshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenshotDialog({ open, onOpenChange }: ScreenshotDialogProps) {
  const t = useT();
  const { screenshotUrl, download } = useScreenshot();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!screenshotUrl) return;
    try {
      const blob = await (await fetch(screenshotUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable / denied */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("ss.title")}</DialogTitle>
        </DialogHeader>
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt={t("ss.title")}
            className="max-h-[60vh] w-full rounded-md border border-border object-contain"
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {t("ss.preparing")}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            disabled={!screenshotUrl}
            className="gap-1.5"
          >
            {copied ? <Check className="size-4 text-bull" /> : <Copy className="size-4" />}
            {copied ? t("ss.copied") : t("ss.copy")}
          </Button>
          <Button
            size="sm"
            onClick={() => download("tradedash-chart.jpeg")}
            disabled={!screenshotUrl}
            className="gap-1.5"
          >
            <Download className="size-4" />
            {t("ss.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
