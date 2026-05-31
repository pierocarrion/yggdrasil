import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Stripe webhook handler placeholder
  return NextResponse.json({ received: true });
}
