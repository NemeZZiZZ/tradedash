/**
 * A single multiplexed WebSocket with auto-reconnect, an outbound send queue
 * (buffered until the socket opens) and an optional keep-alive ping.
 *
 * Bybit and OKX expose one socket that carries many topics via subscribe
 * messages (unlike Binance's one-URL-per-stream model), so they share this.
 */
export interface ManagedSocketOptions {
  /** Called for every parsed JSON message. */
  onMessage: (data: unknown) => void;
  /** Resubscribe hook fired after every (re)connect, to restore topics. */
  onOpen?: () => void;
  /** Keep-alive payload sent every `pingIntervalMs`. */
  ping?: () => string | object;
  pingIntervalMs?: number;
  reconnectDelayMs?: number;
}

export class ManagedSocket {
  private ws: WebSocket | null = null;
  private queue: string[] = [];
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByUser = false;

  constructor(
    private readonly url: string,
    private readonly opts: ManagedSocketOptions,
  ) {}

  private get isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  open() {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.closedByUser = false;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      for (const msg of this.queue.splice(0)) ws.send(msg);
      this.opts.onOpen?.();
      this.startPing();
    };
    ws.onmessage = (event) => {
      if (typeof event.data === "string" && event.data === "pong") return;
      try {
        this.opts.onMessage(JSON.parse(event.data));
      } catch {
        /* non-JSON keep-alive frames are ignored */
      }
    };
    ws.onclose = () => {
      this.stopPing();
      if (!this.closedByUser) this.scheduleReconnect();
    };
    ws.onerror = () => {};
  }

  send(payload: string | object) {
    const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this.isOpen) this.ws!.send(msg);
    else {
      this.queue.push(msg);
      this.open();
    }
  }

  close() {
    this.closedByUser = true;
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.queue = [];
    this.ws?.close();
    this.ws = null;
  }

  private startPing() {
    const { ping, pingIntervalMs = 20_000 } = this.opts;
    if (!ping) return;
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.isOpen) this.ws!.send(this.serialize(ping()));
    }, pingIntervalMs);
  }

  private serialize(p: string | object) {
    return typeof p === "string" ? p : JSON.stringify(p);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    const delay = this.opts.reconnectDelayMs ?? 2000;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }
}
