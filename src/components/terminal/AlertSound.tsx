import { useEffect } from "react";
import { useAlerts } from "react-klinecharts-ui";

/** Plays a short beep (WebAudio) whenever a price alert fires. Renders nothing. */
export function AlertSound() {
  const { onAlertTriggered } = useAlerts();

  useEffect(() => {
    onAlertTriggered(() => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
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
        osc.onended = () => ctx.close();
      } catch {
        /* audio unavailable */
      }
    });
  }, [onAlertTriggered]);

  return null;
}
