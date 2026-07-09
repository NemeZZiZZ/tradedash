import { useEffect, useRef } from "react";
import { useAlerts } from "react-klinecharts-ui";

/** Plays a short beep (WebAudio) whenever a price alert fires. Renders nothing. */
export function AlertSound() {
  const { onAlertTriggered } = useAlerts();
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unsubscribe = onAlertTriggered(() => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        // Reuse one AudioContext instead of creating one per firing (browsers
        // cap ~6 active contexts). Created lazily on first alert.
        if (!ctxRef.current) ctxRef.current = new Ctx();
        const ctx = ctxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      } catch {
        /* audio unavailable */
      }
    });
    return () => {
      unsubscribe();
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [onAlertTriggered]);

  return null;
}
