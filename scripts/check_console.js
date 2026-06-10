import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  console.log('Navigating to http://localhost:8000...');
  await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await page.close();
  await browser.disconnect();
}

run().catch(console.error);
