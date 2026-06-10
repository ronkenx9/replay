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
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
  
  const artifactDir = '/Users/gadgetplug/.gemini/antigravity/brain/7ff22e4a-deb5-4953-8ff2-27bea51002cc';
  
  // 0. Capture Hero Section (Nav bar, Logo, Hero text)
  console.log('Capturing hero section...');
  await page.screenshot({ path: path.join(artifactDir, 'hero.png') });
  console.log('Saved hero.png');

  // 1. Capture Horizontal Scrub Cards
  console.log('Scrolling to #scrub start...');
  const scrubTop = await page.evaluate(() => {
    const el = document.getElementById('scrub');
    return el.getBoundingClientRect().top + window.scrollY;
  });
  
  // Scroll to the start of the pinned scrub section
  await page.evaluate((y) => window.scrollTo(0, y), scrubTop);
  await new Promise(resolve => setTimeout(resolve, 800));
  await page.screenshot({ path: path.join(artifactDir, 'scrub_step1.png') });
  console.log('Saved scrub_step1.png');

  // Scroll down a bit to show step 4 (middle)
  console.log('Scrolling to middle of #scrub...');
  await page.evaluate((y) => window.scrollTo(0, y + 1500), scrubTop);
  await new Promise(resolve => setTimeout(resolve, 800));
  await page.screenshot({ path: path.join(artifactDir, 'scrub_step4.png') });
  console.log('Saved scrub_step4.png');

  // Scroll down to the end of scrub section (step 7)
  console.log('Scrolling to end of #scrub...');
  await page.evaluate((y) => window.scrollTo(0, y + 3200), scrubTop);
  await new Promise(resolve => setTimeout(resolve, 800));
  await page.screenshot({ path: path.join(artifactDir, 'scrub_step7.png') });
  console.log('Saved scrub_step7.png');
  
  // 2. Capture Evidence Bento Section Hover Reveal
  console.log('Scrolling to #evidence...');
  await page.evaluate(() => {
    const el = document.getElementById('evidence');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const evidenceEl = await page.$('#evidence');
  await evidenceEl.screenshot({
    path: path.join(artifactDir, 'evidence_default.png')
  });
  console.log('Saved evidence_default.png');
  
  console.log('Hovering over the Evidence card (.c-packet)...');
  await page.hover('.c-packet .cell');
  await new Promise(resolve => setTimeout(resolve, 800));
  await evidenceEl.screenshot({
    path: path.join(artifactDir, 'evidence_hover_packet.png')
  });
  console.log('Saved evidence_hover_packet.png');

  await page.close();
  await browser.disconnect();
}

run().catch(console.error);
