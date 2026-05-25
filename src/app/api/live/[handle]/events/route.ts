import type { NextRequest } from 'next/server';
import { getIdentityByHandle } from '@/lib/db';
import { sanitizeHandle } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const TIPPERS = [
  'ReddHead_77', 'CryptoCreator', 'SatoshiFloki', 'RedditRocket',
  'anonymous', 'anonymous', 'anonymous',
  'PoSV_Earner', 'TipJar_Bot', 'ReddFan',
];

const TIP_AMOUNTS = [10, 25, 50, 100, 100, 250, 500, 1000];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDelay(): number {
  // 4–16 seconds between demo tips
  return 4000 + Math.floor(Math.random() * 12000);
}

/**
 * GET /api/live/{handle}/events
 *
 * Server-Sent Events stream for the ReddRail live session prototype.
 * In v0.1 demo mode, emits simulated tip events on a random cadence.
 * In production (v0.3+), this will relay real on-chain events from a
 * Gajumaru state-channel session.
 *
 * Event types:
 *   "tip"    — { tipper, amount, timestamp }
 *   "ping"   — keepalive
 *   "init"   — { handle, displayName, rddAddress } — sent once on connect
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ handle: string }> }
) {
  const { handle } = await ctx.params;
  const clean = sanitizeHandle(handle);
  const identity = getIdentityByHandle(clean);

  if (!identity) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  function sseEvent(type: string, data: unknown): Uint8Array {
    return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send init payload immediately
      controller.enqueue(sseEvent('init', {
        handle: identity.handle,
        displayName: identity.displayName ?? identity.handle,
        rddAddress: identity.rddAddress,
        mode: 'demo',
      }));

      let closed = false;
      request.signal.addEventListener('abort', () => { closed = true; });

      // Ping every 25s to keep connection alive through proxies
      const pingInterval = setInterval(() => {
        if (closed) { clearInterval(pingInterval); return; }
        try { controller.enqueue(encoder.encode(': ping\n\n')); } catch { /* closed */ }
      }, 25000);

      // Demo tip scheduler
      function scheduleTip() {
        if (closed) return;
        const delay = randomDelay();
        setTimeout(() => {
          if (closed) return;
          const event = {
            tipper: randomFrom(TIPPERS),
            amount: randomFrom(TIP_AMOUNTS),
            timestamp: new Date().toISOString(),
          };
          try {
            controller.enqueue(sseEvent('tip', event));
            scheduleTip();
          } catch {
            closed = true;
          }
        }, delay);
      }

      scheduleTip();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
