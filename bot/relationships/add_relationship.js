async function add_relationship(page) {
    await page.click('#ember20');
    await page.waitForSelector('#artdeco-button', { visible: true })
        .then(element => element.click());
    await page.waitForTimeout(5000);
}

export default add_relationship

