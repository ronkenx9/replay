import puppeteer from 'puppeteer-core';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  console.log('Navigating to devtool viewer...');
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle0', timeout: 15000 });
  
  // Wait additional time for rendering/transitions
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const artifactDir = '/Users/gadgetplug/.gemini/antigravity/brain/7ff22e4a-deb5-4953-8ff2-27bea51002cc';
  const imgPath = path.join(artifactDir, 'devtool_clean.png');
  
  await page.screenshot({ path: imgPath });
  console.log(`Saved screenshot to ${imgPath}`);
  
  await browser.close();
}

run().catch(console.error);
