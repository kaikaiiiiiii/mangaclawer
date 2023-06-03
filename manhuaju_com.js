const { chromium } = require('playwright');

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
  //await page.goto('https://www.baidu.com');
  //await page.goto('http://whatsmyuseragent.org/');
  await page.goto('http://www.manhuaju.com/gaoxiao/zongzhijiushifeichangkeai/');
  const books = await page.$$eval('#detail-list-select-1 li a', els => {
    return els.map(el => {
      var link = el.href;
      var title = el.innerText;
      return { link, title };
    });
  });
  console.log(books);
  // -> 页面数据。




  // for await (var chap of books) {
  //   console.log(chap);
  //    page.on('response', (res) => {
  //      if (res.status() != '302') {
  //        console.log('<<', res.status(), res.url(),res.body());
  //        res.body().then((b) => {
  //          console.log(b.toString('base64'));
  //          //这里可以想法怎么存下来。
  //         });
  //       }
  //      });
  //   await page.goto(chap.link);
  //   var sheet = await page.$eval('#qTcms_pic', img => { return img});
  //   break;
  // }
  //await browser.close();

})()
