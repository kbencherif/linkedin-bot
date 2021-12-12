async function accept_relationships(page) {
    await page.click('[data-alias="relationships"]')
    await page.waitForNavigation({waitUntil: 'networkidle2'});
}

export default accept_relationships
