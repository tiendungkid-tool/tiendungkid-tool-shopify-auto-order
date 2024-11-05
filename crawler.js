const puppeteer = require('puppeteer')

async function runCrawler (profile) {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage()
    await page.goto(`https://${profile.shop}`)
    const currentUrlPath = new URL(page.url())
    
    if (currentUrlPath.pathname == '/password') {
        await fillPassword(page, profile)
    }
    await addToCart(page, profile)
    await applyDiscountCode(page, profile.discount)
    await page.goto(`https://${profile.shop}/checkout`)
    await fillCountry(page, profile)
    await fillState(page, profile)
    await fillCustomerInformation(page, profile)
    await focusBodyToLoadShippingRate(page)
    await fillCreditCard(page)
    await page.focus('#checkout-pay-button')
    await page.click('#checkout-pay-button')
    await page.waitForNavigation()
    browser.close()
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
            delay: 20
        })
    }
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string} code 
 */
async function applyDiscountCode(page, code) {
    await page.evaluate(async (code) => {
        await fetch(`/discount/${code}`)
    }, code)
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
    await page.keyboard.type('1', { delay: 200 })
    await page.keyboard.press('Tab', { delay: 200 })
    await page.keyboard.type('1255', { delay: 200 })
    await page.keyboard.press('Tab', { delay: 200 })
    await page.keyboard.type('111', { delay: 200 })
    await page.keyboard.press('Tab', { delay: 200 })
    await page.keyboard.press('Tab', { delay: 200 })
    await page.keyboard.type('1', { delay: 200 })
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string} code 
 */
async function fillPassword(page, profile) {
    await page.focus('#password')
    await page.keyboard.type(String(profile.store_password), { delay: 100 })
    await page.keyboard.press('Enter')
    await page.waitForNavigation()
}

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {string} code 
 */
async function addToCart(page, profile) {
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
async function focusBodyToLoadShippingRate(page) {
    await page.focus('input[name=lastName]')
    await page.waitForSelector('#shipping_methods')
}

module.exports = runCrawler 