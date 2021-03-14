const { firefox } = require('playwright');
const { chromium } = require('playwright');


(async () => {
  const browser = await chromium.launch({headless:false})
  const page = await browser.newPage()
  await page.goto('http://www.90mh.com/manhua/zongzhijiushifeichangkeai/');
  const books = await page.$$eval('#chapter-list-10 li a', els => { 
    return els.map(el => { 
      var link = el.href;
      var title = el.children[0].innerText;
      return { link, title };
    });
  }); 
  for await (var chap of books) {
    //console.log(chap);
    // page.on('response', (res) => {
    //   if (res.status() != '302') {
    //     console.log('<<', res.status(), res.url(),res.body());
    //     res.body().then((b) => {
    //       console.log(b.toString('base64'));
    //       //这里可以想法怎么存下来。
    //      });
    //    }
    //   });
    await page.goto(chap.link);
    //var sheet = await page.$eval('#qTcms_pic', img => { return img});
    break;
  }
  await browser.close();

})()
