const puppeteer = require("puppeteer");
var CronJob = require('cron').CronJob;

const USERNAME = "sondeso";
const PASSWORD = "0111pWd4986";

var job = new CronJob('0 16 * * 1,2,3,6,0', function () {
    signUpForGym();
}, null, true, 'Europe/Oslo');
job.start();
console.log("Adding user ", USERNAME, " to sit gym")

async function signUpForGym() {
    const browser = await puppeteer.launch({ headless: false });
    try {
        const page = await browser.newPage();
        await page.goto('https://www.sit.no/user', { waitUntil: 'networkidle2' });
        page.click(".button--login")
        await page.waitForNavigation({
            waitUntil: 'networkidle2',
        });
        await page.type("#org-chooser-selectized", "NTNU", { delay: 10 })
        await page.keyboard.press('Enter');
        await page.click("#discoform_feide button");

        await page.type("#username", USERNAME, { delay: 10 });
        await page.type("#password", PASSWORD, { delay: 10 });
        await page.click("form button");
        await page.waitForNavigation({
            waitUntil: 'networkidle2',
        });
        await page.goto("https://www.sit.no/trening/treneselv", { waitUntil: ["networkidle0", "domcontentloaded"] });
        const iframe = page.frames().find(i => i.url().includes('ibooking.sit.no'));
        await iframe.waitForSelector("#ScheduleApp");
        console.log("selecting moholt");
        await iframe.evaluate(() => {
            let studios = document.querySelectorAll(".selectBoxes button")
            console.log(studios);
            studios[0].click();
            studios[1].click();
            studios[2].click();
            studios[3].click();
        });

        // TODO: wait load
        await iframe.waitForSelector(".dayName");

        await iframe.evaluate(() => {
            const daysElems = document.querySelectorAll(".dayName")
            let theDay;
            daysElems.forEach(dayEl => {
                if (dayEl.innerText.includes("10.02.21")) {
                    theDay = dayEl;
                }
            });

            // ##################### TIME
            const TIME = "16.00–17.00";

            const sessions = theDay.parentElement.querySelectorAll(".instance")
            let sessionsToJoin;
            sessions.forEach(s => {
                console.log(s.children[0].innerText)
                if (s.children[0].innerText == TIME) {
                    sessionsToJoin = s;
                }
            });
            sessionsToJoin.click()
        })
        await iframe.waitForSelector(".modal-content .btn-primary");
        await iframe.evaluate(() => document.querySelector(".modal-content .btn-primary").click());
        console.log("User ", USERNAME, " successfully added to gym");
        await page.waitForTimeout(4000);
        await browser.close();
    } catch (err) {
        console.error("An error occured during gym signup", err);
        await browser.close();
    }
}
