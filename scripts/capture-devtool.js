import puppeteer from 'puppeteer-core';
import path from 'path';

async function run() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  console.log('Navigating to devtool viewer...');
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle0', timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const artifactDir = '/Users/gadgetplug/.gemini/antigravity/brain/7ff22e4a-deb5-4953-8ff2-27bea51002cc';
  
  await page.screenshot({ path: path.join(artifactDir, 'devtool_full.png') });
  console.log('Saved devtool_full.png');
  
  await page.close();
  await browser.disconnect();
}

run().catch(console.error);
