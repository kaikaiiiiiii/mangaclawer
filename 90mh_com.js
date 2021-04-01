const { firefox } = require('playwright');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const axios = require('axios').default;
const { resolve } = require('path');
const { rejects } = require('assert');

const userDataDir = 'Profile';


(async () => {
  const browser = await chromium.launchPersistentContext(userDataDir,{
    headless: false,
    devtools: true,
    //proxy: {server: 'localhost:1080'},
    timeout: 0,
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  })
  const page = await browser.newPage()
  //await page.goto('https://www.baidu.com');
  //await page.goto('http://whatsmyuseragent.org/');
  //await page.goto('http://www.90mh.com/manhua/zongzhijiushifeichangkeai/108068.html');
  await page.goto('http://www.90mh.com/manhua/zongzhijiushifeichangkeai/');
  const book = await page.$$eval('#chapter-list-10 li a', els => { 
    return els.map(el => { 
      var link = el.href;
      var title = el.children[0].innerText;
      return { link, title };
    });
  });
  for await (var [index,chap] of book.entries()) {
    console.log(index,chap);
    var volume = index.toString().padStart(3, '0');
    
    // 方法：通过监视 network 流量，只从服务器请求一次图片数据。
    // 通常的从 img.src 解析图片再下载，会从服务器获取两次图片数据。
    // 触发器要在实际访问前设置完成。
    
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
    var totalsheets = await page.$eval('#chapter-image div.main-btn select', select => select.options.length);
    var imgurl = await page.$eval('#images img', img => img.src);
    console.log(imgurl);
    downloadImage(imgurl,'test.jpg')
    break;
  }
  //await browser.close();

})()

async function downloadImage(url, name) {
  var writer = fs.createWriteStream(name);
  const response = await axios({
    url:url,
    method: 'GET',
    responseType:'stream'
  })
  response.data.pipe(writer);
  return new Promise((resolve, rejects) => {
    writer.on('finish', resolve);
    writer.on('error', rejects);
  });
}