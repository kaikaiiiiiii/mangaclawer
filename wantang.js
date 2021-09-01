const { firefox } = require('playwright');
const { chromium } = require('playwright');
const papa = require('papaparse');

const userDataDir = 'Profile';


(async () => {
  const browser = await chromium.launchPersistentContext(userDataDir,{
    headless: true,
    //proxy: {server: 'localhost:1080'},
    timeout: 0,
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  })
  const page = await browser.newPage()
  await page.goto('https://shuyuan.taobao.com/#!/knowledge/index');
  await page.waitForSelector('div[mxa="eTwjpOgtaJ:d"]');
  const list = await page.$$eval('div[mxa="eTwjpOgtaJ:e"]', els => {
    return els.map(el => {
      var alink = el.querySelector('ul[mxv] li a')
      var title = alink.querySelector('span').innerText;
      var lnk = 'https://shuyuan.taobao.com/' + alink.getAttribute('href');
      var lnk = lnk.substr(0, lnk.indexOf('\&'));
      return {title ,lnk}
    })
  });
  console.log(papa.unparse(list));

  await browser.close();
})()
