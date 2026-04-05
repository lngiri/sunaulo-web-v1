

import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';



// Helper to extract price from HTML

function extractPrice(html, label) {
  // Allow for any characters (including newlines) between label and 'रु' and the number
  const regex = new RegExp(label + "[\s\S]*?रु\s*([\d,]+)", "i");
  const match = html.match(regex);
  if (match && match[1]) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

export async function GET() {
  try {
    const res = await fetch('https://www.fngsgja.org.np/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    const html = await res.text();
    // Save the HTML to a file for inspection
    await writeFile(process.cwd() + '/fngsgja-latest.html', html);
    // Extract gold rate
    const goldMatch = html.match(/FINE GOLD[\s\S]*?Per 1 tola:[\s\S]*?<strong>NRs\.([\d,]+)\/-<\/strong>/i);
    // Extract silver rate
    const silverMatch = html.match(/SILVER[\s\S]*?Per 1 tola:[\s\S]*?<strong>NRs\.([\d,]+)\/-<\/strong>/i);
    const gold = goldMatch ? parseInt(goldMatch[1].replace(/,/g, ''), 10) : null;
    const silver = silverMatch ? parseInt(silverMatch[1].replace(/,/g, ''), 10) : null;
    return NextResponse.json({ gold, silver });
  } catch (e) {
    console.error('Gold rate fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch rates', details: e.message || String(e) }, { status: 500 });
  }
}
