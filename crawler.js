const puppeteer = require('puppeteer')
const fs = require('fs')
const config = require('./config')

let processingProfileId = null

async function start(profile) {
    try {
        await runCrawler(profile)
    } catch (error) {
        logProcessStack('Finished with error')
        console.error(error)
    }
}

async function runCrawler (profile) {
    processingProfileId = profile.id
    logProcessStack('Input delay: ' + config.input_delay)
    logProcessStack('Starting')
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            // '--incognito',
            '--start-maximized'
        ]
    })
    const context = browser.defaultBrowserContext()
    const page = (await context.pages())[0]
    await page.setViewport({ width: 1920, height: 1080})
    await page.goto(`https://${profile.shop}`, {
        timeout: 0
    })
    const currentUrlPath = new URL(page.url())
    const isCombineDiscountCodes = profile.discount.length > 1
    
    if (currentUrlPath.pathname == '/password') {
        logProcessStack('Filling store password')
        await fillPassword(page, profile)
    }
    await redirectToRefCode(page, profile)
    await addToCart(page, profile)
    await applyDiscountCode(page, profile.discount)
    logProcessStack('Go to checkout page')
    await page.goto(`https://${profile.shop}/checkout`, {
        timeout: 0
    })
    logProcessStack('Filling shipping information')
    await fillCountry(page, profile)
    await fillState(page, profile)
    await fillCustomerInformation(page, profile)
    await focusBodyToLoadShippingRate(page)
    if (isCombineDiscountCodes) {
        logProcessStack('Apply combine discount')
        await applyOnCheckoutDiscount(page, profile.discount)
    }
    logProcessStack('Apply tip')
    await applyTip(page, profile.tip)
    logProcessStack('Filling credit card')
    await fillCreditCard(page)
    logProcessStack('Start complete order')
    await page.focus('#checkout-pay-button')
    await waitForCaptcha(page)
    await finishTracking(browser, page, profile)
    logProcessStack('Finished -------------------------------------')
}

function logProcessStack(action) {
    console.log(`[${processingProfileId}]: ${action}`)
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {*} profile 
 */
async function sleepClient(page, timeout) {
    await page.evaluate(async (timeout) => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }, timeout)
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {*} profile 
 */
async function fillCustomerInformation(page, profile) {
    await page.waitForSelector('#email')
    const fillInfo = [
        {
            selector: '#email',
            value: profile.email
        },
        {
            selector: 'input[name=firstName]',
            value: profile.first_name
        },
        {
            selector: 'input[name=lastName]',
            value: profile.last_name
        },
        {
            selector: 'input[name=address1]',
            value: profile.address
        },
        {
            selector: 'input[name=city]',
            value: profile.city
        },
        {
            selector: 'input[name=postalCode]',
            value: profile.postal_code
        },
    ]

    for (const info of fillInfo) {
        if (!Boolean(info.value)) {
            continue
        }
        await page.focus(info.selector)
        await page.keyboard.type(String(info.value), {
            delay: config.input_delay
        })
    }
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string} code 
 */
async function applyOnCheckoutDiscount(page, codes) {
    await page.waitForSelector('input[name="reductions"]')
    await page.focus('input[name="reductions"]')
    await page.keyboard.type(codes[1], { delay: config.input_delay })
    await page.keyboard.press('Enter')

    try {
        await page.waitForSelector('#gift-card-field form + div ul li:nth-child(2)', { timeout: 3e3 })
    } catch (e) {

    }
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string[]} codes
 */
async function applyDiscountCode(page, codes) {
    if (codes.length > 0) {
        logProcessStack('Apply discount code')
        await page.evaluate(async (code) => {
            await fetch(`/discount/${code}`)
        }, codes[0])
    }
}

/**
 * @param {puppeteer.Page} page 
 */
async function fillCreditCard(page) {
    await sleepClient(page, 1e3)
    const frameSelector = 'div[data-card-fields=number] iframe'
    await page.focus(frameSelector)
    const frame = await page.waitForSelector(frameSelector)
    const rect = await page.evaluate(el => {
        const {x, y} = el.getBoundingClientRect()
        return {x, y}
    }, frame)
    const offset = {x: 213 + 5, y: 11 + 5}
    await page.mouse.click(rect.x + offset.x, rect.y + offset.y)
    await sleepClient(page, 1e3)
    await page.keyboard.type('1', { delay: config.input_delay })
    await page.keyboard.press('Tab', { delay: config.input_delay })
    await page.keyboard.type('1255', { delay: config.input_delay })
    await page.keyboard.press('Tab', { delay: config.input_delay })
    await page.keyboard.type('111', { delay: config.input_delay })
    await page.keyboard.press('Tab', { delay: config.input_delay })
    await page.keyboard.press('Tab', { delay: config.input_delay })
    await page.keyboard.type('1', { delay: config.input_delay })
    await focusBodyToLoadShippingRate(page, '#TipsInput', null)
    await sleepClient(page, 1e3)
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string} code 
 */
async function fillPassword(page, profile) {
    await page.focus('#password')
    await page.keyboard.type(String(profile.store_password), { delay: config.input_delay })
    await page.keyboard.press('Enter')
    await page.waitForNavigation()
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string} code 
 */
async function addToCart(page, profile) {
    logProcessStack('Adding to cart')
    await page.evaluate(async (profile) => {
        const form = {
            items: profile.variants.map(e => ({
                id: e.variant_id,
                quantity: e.quantity
            }))
        }

        await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(form)
        })
    }, profile)
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {*} profile 
 */
async function fillCountry(page, profile) {
    if (!profile.country) {
        return
    }
    await page.select('select[name=countryCode]', profile.country)
    await sleepClient(page, 5e2)
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {*} profile 
 */
async function fillState(page, profile) {
    if (!profile.state) {
        return
    }
    await sleepClient(page, 5e2)
    await page.focus('select[name=zone]')
    await page.select('select[name=zone]', profile.state)
    await sleepClient(page, 1e3)
}
/**
 * @param {puppeteer.Page} page 
 */
async function focusBodyToLoadShippingRate(page, focusTo = 'input[name=lastName]', wantLoaded = '#shipping_methods') {
    try {
        await page.focus(focusTo)
        if (!wantLoaded) {
            return
        }
        await page.waitForSelector(wantLoaded, { timeout: 8e3})
    } catch (e) {
        logProcessStack('Skipping shipping method')
    }
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {profile} profile 
 */
async function redirectToRefCode(page, profile) {
    logProcessStack('Redirect to affiliate link')
    await page.goto(`https://${profile.shop}?sca_ref=${profile.ref_code}`, {
        timeout: 0
    })
    try {
        await page.waitForResponse('https://pixel-test.uppromote.com/api/logs', {
            timeout: 2e3
        })
    } catch (e) {
    }
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {number} tipValue 
 */
async function applyTip(page, tipValue) {

    if (!tipValue) {
        return
    }
    try {
        await page.focus('#TipsInput')
        await page.keyboard.type(String(tipValue), {
            delay: config.input_delay
        })
        await page.focus('#tipping_list-tipping_list_options-collapsible button[type=submit]')
        await sleepClient(page, 1e3)
        await page.keyboard.press('Enter')
        await page.waitForFunction(async () => {
            const selector = `div[aria-labelledby="MoneyLine-Heading0"]`
            const node = document.querySelector(selector)
            return node.textContent.includes('Tip')
        }, {
            timeout: 2e3
        })
    } catch (error) {
    }
}

/**
 * 
 * @param {puppeteer.Page} page
 */
async function waitForCaptcha(page) {
    const requireCaptcha = Boolean(await page.$('textarea#g-recaptcha-response'))
    if (!requireCaptcha) {
        return
    }

    const maxSecondToWait = 300 // 5 minutes
    let currentWaitTime = 1;
    let finishedCaptcha = false

    while (currentWaitTime <= maxSecondToWait && !finishedCaptcha) {
        try {
            finishedCaptcha = await page.$eval('textarea#g-recaptcha-response', (input) => input.value)
        } catch (error) {
        }
        await sleepClient(page, 1e3)
        currentWaitTime++
    }
}

/**
 * 
 * @param {puppeteer.Page} page
 */
async function finishTracking(browser, page, _profile) {
    if (!fs.existsSync('results')) {
        fs.mkdirSync('results')
    }

    await page.screenshot({
        path: `results/screenshot-${processingProfileId}.png`,
        fullPage: true
    })

    await page.click('#checkout-pay-button')

    try {
        await page.waitForNavigation({
            timeout: 10e3
        })
        await page.waitForResponse('https://pixel-test.uppromote.com/api/logs', {
            timeout: 5e3
        })
        await page.waitForSelector('#checkout-main', {
            timeout: 5e3
        })
    } catch (error) {
    }

    browser.close()
}

module.exports = start 