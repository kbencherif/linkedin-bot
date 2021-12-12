async function scrap_profile(page) {
    const name = await page.$eval("h1", el => el.innerText)
    const loc = await page.$eval(
        "span.text-body-small.inline.t-black--light.break-words",
        el => el.innerText.replace(/ /g, ''))
    console.log({ name, loc })
}

export default scrap_profile
