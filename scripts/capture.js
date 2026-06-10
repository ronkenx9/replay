import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });
  
  console.log('Navigating to http://localhost:8000...');
  await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded' });
  
  console.log('Scrolling to #evidence...');
  await page.evaluate(() => {
    const el = document.getElementById('evidence');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  
  // Wait a bit for scroll-reveal transition to finish
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Taking screenshot of default state...');
  const evidenceEl = await page.$('#evidence');
  const artifactDir = '/Users/gadgetplug/.gemini/antigravity/brain/7ff22e4a-deb5-4953-8ff2-27bea51002cc';
  
  await evidenceEl.screenshot({
    path: path.join(artifactDir, 'evidence_default.png')
  });
  console.log('Saved evidence_default.png');
  
  console.log('Hovering over the Evidence card (.c-packet)...');
  // Hover over the inner cell of .c-packet
  await page.hover('.c-packet .cell');
  // Wait for hover reveal transition to finish
  await new Promise(resolve => setTimeout(resolve, 800));
  
  await evidenceEl.screenshot({
    path: path.join(artifactDir, 'evidence_hover_packet.png')
  });
  console.log('Saved evidence_hover_packet.png');
  
  console.log('Hovering over the Verified card (.c-verify)...');
  await page.hover('.c-verify .cell');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  await evidenceEl.screenshot({
    path: path.join(artifactDir, 'evidence_hover_verify.png')
  });
  console.log('Saved evidence_hover_verify.png');

  await page.close();
  await browser.disconnect();
}

run().catch(console.error);
