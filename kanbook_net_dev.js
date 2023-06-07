const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const md5 = require("md5");
const Zip = require("adm-zip");
const readlineSync = require("readline-sync");

const userDataDir = "Profile";
const debugflag = true;

// const readline = readlineSync.question('请输入 startUrl：');

function checkReadline(readline="") {
    if (readline.match(/\d{1,}\/?/)) {
        return "https://www.kanbook.net/comic/" + readline;
    } else if (readline.match(/http(s)?:\/\/(www\.)?kanbook\.net\/comic\/\d{1,}\/?/)) {
        return readline;
    } else {
        return "https://www.kanbook.net/comic/1294";
    }
}

const startUrl = checkReadline();
const domain = new URL(startUrl).origin;
const retryLimit = 10;

async function delay(ms) {
    if (debugflag) {
        console.log(`delay ${ms}ms`);
    }
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/////////////////////////////////////////////////
async function getBookList(url, browser) {

    const [page] = browser.pages();
    let retryCount = 0;
    let bookList = [];
    let bookinfo = {};
    while (retryCount < retryLimit) {
        try {
            await page.goto(url, { timeout: 60 * 1000 });
            await page.waitForSelector("#myTab");
            const sheetCount = await page.$$eval("#myTab li", els => els.length);
            for (let i = 1; i <= sheetCount; i++) {
                await page.click("#myTab li:nth-child(" + i + ") a");
                await page.waitForSelector("ol.links-of-books li:nth-child(1)");
                const books = await page.$$eval("#comic-book-list ol.links-of-books li a", els => {
                    return els.map(el => {
                        var link = el.href;
                        var title = el.title;
                        return { link, title };
                    });
                });
                bookList = bookList.concat(books);
            }
            if(debugflag){console.log(`retryCount: ${retryCount}`)}
            const bookname = await page.$eval(".comic-main-section h2.comic-title", el => el.innerText);
            bookinfo = { bookname };
            break;
        } catch (e) {
            console.log(e);
            retryCount++;
        }
        
    }
    return { bookList, bookinfo };
}

/////////////////////////////////////////////////

async function downBook(book, browser, index) {
    console.log(`>>>> Downloading ${book.bookname} - ${book.title} <<<<`);

    let episodeFolder = path.join(__dirname, book.bookname, book.title);
    if (fs.existsSync(book.bookname) == false) {
        fs.mkdirSync(book.bookname);
    }
    if (fs.existsSync(episodeFolder + ".zip")) {
        return;
    }
    if (fs.existsSync(episodeFolder) == false) {
        fs.mkdirSync(episodeFolder);
    }

    const page = await browser.newPage();
    await page.goto(book.link, { timeout: 60 * 1000 });
    await page.waitForSelector("#page-selector");
    const sheetsNo = await page.$$eval("#page-selector option", els => {
        return els.map(el => {
            return el.value;
        });
    });

    for (let i = 0; i < sheetsNo.length; i++) {
        const sheet = sheetsNo[i];
        function getResponshand() {
            return function (res) {
                if (res.status() != "302") {
                    var url = res.url();
                    var name = url.split("/").pop().split("?")[0];
                    res.body()
                        .then(b => {
                            if (b.length > 0) {
                                var imgpath = path.join(episodeFolder, name);
                                if (!fs.existsSync(imgpath)) {
                                    fs.writeFileSync(imgpath, b);
                                    console.log(url + " >> " + imgpath);
                                } else {
                                    let m = md5(fs.readFileSync(imgpath));
                                    let n = md5(b);
                                    if (m == n) {
                                    } else {
                                        let o = path.parse(imgpath);
                                        let newpath = path.join(o.dir, o.name + "_2" + o.ext);
                                        fs.writeFileSync(newpath, b);
                                        console.log(url + " >> " + newpath);
                                    }
                                }
                            }
                        })
                        .catch(e => {
                            console.log(e);
                            i--;
                        });
                }
            };
        }
        const responsehand = getResponshand();

        page.on("response", responsehand);
        page.goto(domain + sheet);
        await page.waitForSelector("#all .ccdiv .w-100 img");

        page.off("response", responsehand);

        await delay(Math.random() * 1000 + 500);
    }

    zipPacking(episodeFolder).then(() => {
        console.log(`>>>> Zip Packing ${book.bookname} - ${book.title} <<<<`);
    });
    await delay(10 * 1000);
    await page.close();
}

async function zipPacking(folder) {
    var pkg = new Zip();
    await delay(10 * 1000);
    pkg.addLocalFolder(folder);
    pkg.writeZip(folder + ".zip");
    fs.rmSync(folder, { recursive: true });
}

async function main(url) {
    let bookurl = url;
    let bookid = bookurl.split("/").pop();

    const browser = await chromium.launchPersistentContext(userDataDir, {
        viewport: { width: 1600, height: 900 },
        headless: false,
        devtools: true,
        //proxy: {server: 'localhost:1080'},
        timeout: 0,
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
    });
    const disabledTypes = ["font", "stylesheet"];
    const blockedUrls = ["google-analytics.com", "googletagmanage", "ax1x.com", "bdstatic.com"];
    browser.route("**/*", route => {
        if (debugflag) {
            console.log(route.request().url());
        }
        if (
            disabledTypes.includes(route.request().resourceType()) ||
            blockedUrls.some(url => route.request().url().includes(url))
        ) {
            route.abort();
        } else {
            route.continue();
        }
    });


    // 判断是否有本地记录，有则从记录开始下载

    // 无，从网页抓取书籍信息，开始下载
    var { bookList, bookinfo } = await getBookList(bookurl, browser);

    bookList.forEach(e => (e.bookname = bookid + "_" + bookinfo.bookname));

    console.log(bookList)

    for (let i = 0; i < bookList.length; i++) {
        const book = bookList[i];
        await downBook(book, browser, i);
    }
}

main(startUrl);
