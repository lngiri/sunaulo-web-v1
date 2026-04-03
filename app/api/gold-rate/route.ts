import { NextResponse } from 'next/server';

// This is a placeholder for a real gold rate fetcher.
// In production, replace this with a real API call or web scraping logic.
export async function GET() {
  // Simulate fetching from an external API
  // TODO: Replace with real fetch from Nepal Gold & Silver Association
  const todayRate = 135000 + Math.floor(Math.random() * 2000 - 1000); // Simulate rate fluctuation
  return NextResponse.json({ rate: todayRate });
}
