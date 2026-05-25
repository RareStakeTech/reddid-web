import { getReserveSnapshot } from '@/lib/db';

export async function GET() {
  const snapshot = getReserveSnapshot();
  return Response.json({ reserve: snapshot });
}
