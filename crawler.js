const puppeteer = require('puppeteer')

async function runCrawler (profile) {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.goto('https://developer.chrome.com/');
}

module.exports = runCrawler