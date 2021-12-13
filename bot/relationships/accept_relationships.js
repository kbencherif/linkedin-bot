import auto_scroll from "../../utils/autoscroll"

async function accept_relationships(page) {
    await page.click('[data-alias="relationships"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.click('a.ember-view.mn-invitations-preview__manage-all.artdeco-button.artdeco-button--tertiary.artdeco-button--muted.artdeco-button--2')
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await auto_scroll(page)
    const acceptation_buttons = await page.$$('button.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view.invitation-card__action-btn')
    acceptation_buttons.forEach(async button => {
        await button.click()
    })
}

export default accept_relationships
