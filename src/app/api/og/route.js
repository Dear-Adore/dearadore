import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract og:image or twitter:image
    let ogImage = $('meta[property="og:image"]').attr('content');
    if (!ogImage) {
      ogImage = $('meta[name="twitter:image"]').attr('content');
    }
    
    // Sometimes URLs are relative, though OG tags usually require absolute URLs.
    if (ogImage && !ogImage.startsWith('http')) {
      const urlObj = new URL(targetUrl);
      ogImage = `${urlObj.protocol}//${urlObj.host}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
    }

    return NextResponse.json({ ogImage });
  } catch (error) {
    console.error('OG Scrape Error:', error);
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
  }
}
