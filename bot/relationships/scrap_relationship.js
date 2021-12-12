async function scrap_relationship(page) {
    const name = await page.$eval("h1", el => el.innerText)
    const loc = await page.$eval("span.text-body-small.inline.t-black--light.break-words", el => el.innerText)
    console.log({name, loc})
}

export default scrap_relationship
