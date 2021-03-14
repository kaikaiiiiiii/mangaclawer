const { chromium } = require('playwright');


(async () => {
  const browser = await chromium.launch({headless:false})
  const page = await browser.newPage()
  await page.goto('http://www.manhuaju.com/gaoxiao/zongzhijiushifeichangkeai/');
  const books = await page.$$eval('#chapterlistload li a', els => { 
    return els.map(el => { 
      var link = el.href;
      var title = el.textContent;
      return { link, title };
    });
  }); 
  books.reverse();
  for await (var chap of books) {
    //console.log(chap);
    page.on('response', (res) => {
      if (res.status() != '302') {
        console.log('<<', res.status(), res.url(),res.body());
        res.body().then((b) => {
          console.log(b.toString('base64'));
          //这里可以想法怎么存下来。
         });
       }
      });
    await page.goto(chap.link);
    //var sheet = await page.$eval('#qTcms_pic', img => { return img});
    break;
  }
  await browser.close();

})()