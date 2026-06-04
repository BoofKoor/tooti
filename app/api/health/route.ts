import { NextResponse } from 'next/server';

// Lightweight health check (used by the docker-compose healthcheck / uptime pings).
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
