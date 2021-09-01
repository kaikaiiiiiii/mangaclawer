const { chromium } = require('playwright');
const papa = require('papaparse');

const userDataDir = 'Profile';
var sheets = [
  'https://open.taobao.com/api.htm?docId=10527&docType=2', //直通车
  'https://open.taobao.com/api.htm?docId=43245&docType=2', //信息流（超级推荐）
  'https://open.taobao.com/api.htm?docId=27807&docType=2'  //钻展
]

var spider = async (list) => {
  var urls = list;
  const browser = await chromium.launchPersistentContext(userDataDir,{
    headless: false,
    //proxy: {server: 'localhost:1080'},
    timeout: 0,
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  })
  const page = await browser.newPage()
  for (let i = 0; i < urls.length; i++) {
    let url = urls[i];
    await page.goto(url);
    await page.waitForSelector('.leftMenuScrollDiv');
    await delay(1000);
    var contents = await page.$$eval('.leftMenuScrollDiv .node a', els => {
      return els.map(el => {
        var info = el.querySelector('span.text').innerText.split('\n');
        var title = info[1];
        var name = info[0];
        return { name, title }
      })
    });
    console.log(papa.unparse(contents, { 'header': false }));
  }
  await browser.close();
}

spider(sheets);

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
