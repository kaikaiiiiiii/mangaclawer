const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const axios = require('axios').default;

const userDataDir = 'Profile';


(async () => {
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    devtools: true,
    //proxy: {server: 'localhost:1080'},
    timeout: 0,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  })
  const page = await browser.newPage()
  await page.goto('http://www.90mh.com/manhua/zongzhijiushifeichangkeai/');
  const book = await page.$$eval('#chapter-list-10 li a', els => {
    return els.map(el => {
      var link = el.href;
      var title = el.children[0].innerText;
      return { link, title };
    });
  });
  for await (var [index, chap] of book.entries()) {
    console.log(index, chap);
    var volume = index.toString().padStart(3, '0');

    await page.goto(chap.link);
    var totalsheets = await page.$eval('#chapter-image div.main-btn select', select => select.options.length);
    var imgurl = await page.$eval('#images img', img => img.src);
    console.log(imgurl);
    downloadImage(imgurl, 'test.jpg')
    break;
  }
  //await browser.close();

})()

async function downloadImage(url, name) {
  var writer = fs.createWriteStream(name);
  const response = await axios({
    url: url,
    method: 'GET',
    responseType: 'stream'
  })
  response.data.pipe(writer);
  return new Promise((resolve, rejects) => {
    writer.on('finish', resolve);
    writer.on('error', rejects);
  });
}