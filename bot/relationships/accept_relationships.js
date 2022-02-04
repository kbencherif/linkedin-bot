import auto_scroll from "../../utils/autoscroll.js"

async function accept_relationships(page) {
    await page.click('[data-link-to="mynetwork"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.click('a.ember-view.mn-invitations-preview__manage-all.artdeco-button.artdeco-button--tertiary.artdeco-button--muted.artdeco-button--2')
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    await auto_scroll(page)
    await page.$$eval('button.artdeco-button.artdeco-button--2.artdeco-button--secondary.ember-view.invitation-card__action-btn', els => els.forEach(el => el.click()))
}

export default accept_relationships
