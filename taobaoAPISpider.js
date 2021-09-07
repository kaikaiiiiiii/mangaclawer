const { chromium } = require("playwright");
const papa = require("papaparse");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

/////////////////////////////////////////
// 页面抓取，依赖 playwright
// npm i -g playwright
/////////////////////////////////////////

const userDataDir = "Profile";
var sheets = [
    "https://open.taobao.com/api.htm?docId=10527&docType=2", //直通车
    "https://open.taobao.com/api.htm?docId=43245&docType=2", //信息流（超级推荐）
    "https://open.taobao.com/api.htm?docId=27807&docType=2" //钻展
];

var spider = async list => {
    var string = [];
    var urls = list;
    const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        //proxy: {server: 'localhost:1080'},
        timeout: 0,
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
    });
    const page = await browser.newPage();
    for (let i = 0; i < urls.length; i++) {
        let url = urls[i];
        await page.goto(url);
        await page.waitForSelector(".leftMenuScrollDiv");
        await page.waitForSelector(".node.sub-name.level-3");
        await delay(1000); //确保页面加载，减少抓取空返回
        var contents = await page.$$eval(".leftMenuScrollDiv .node a", els => {
            return els.map(el => {
                var info = el.querySelector("span.text").innerText.split("\n");
                var title = info[1];
                var name = info[0];
                return { name, title };
            });
        });
        string = string.concat(contents);
    }
    await browser.close();
    return string;
};

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// 读取旧版本数据，依赖 papaparse 做 csv 解析。

const readCSV = async csvpath => {
    return new Promise((resolve, reject) => {
        var csvcontent = fs.existsSync(path.join(__dirname, csvpath))
            ? fs.readFileSync(path.join(__dirname, csvpath), "utf-8")
            : "";
        papa.parse(csvcontent, {
            header: true,
            complete: function(result) {
                resolve(result.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
};

// Main 函数，函数定义后立刻执行

(async () => {
    var spider_old = await readCSV("spider_old.csv");
    var spider_new = await spider(sheets);
    //计算 diff，使用对象 key 的 hash map 属性避免两层 for 循环。
    var diff = {};
    var diffcount = { keep: 0, plus: 0, minus: 0 };

    spider_old.forEach(element => {
        diff[element.name] = element;
        diff[element.name].status = "-";
        diffcount.minus++;
    });
    spider_new.forEach(element => {
        if (diff[element.name]) {
            diff[element.name].status = "~";
            diffcount.minus--;
            diffcount.keep++;
        } else {
            diff[element.name] = element;
            diff[element.name].status = "+";
            diffcount.plus++;
        }
    });
    var diffdata = Object.values(diff);
    //转成 html。
    var row = "<tr>name</tr><tr>title</tr><tr>status</tr>";
    var tablehtml = diffdata
        .map(e => {
            if (e.status == "-") {
                row += `<tr style='color:red'>`;
            } else if (e.status == "+") {
                row += `<tr style='color:green'>`;
            } else {
                row += `<tr>`;
            }
            row += `<td>${e.name}</td>`;
            row += `<td>${e.title}</td>`;
            row += `<td>${e.status}</td>`;
            row += `</tr>`;
            return row;
        })
        .join("");

  var mailcontent = `<table><tr>name</tr><tr>title</tr><tr>status</tr>` + tablehtml + `</table>`;
  
  var mailtitle = `[+${diffcount.plus} ~${diffcount.keep} -${diffcount.minus}] 淘宝 API 监测每日报告`;

    // 发送邮件函数
    async function sendMail(title,text) {
        var user = "151493994@qq.com"; //自己的邮箱
        var pass = "gslbexwytehkcadh"; //qq邮箱授权码,如何获取授权码下面有讲
        var to = ["wukaiyu@mininglamp.com", "yaoyingjun@mininglamp.com"]; //对方的邮箱
        let transporter = nodemailer.createTransport({
            host: "smtp.qq.com",
            port: 587,
            secure: false,
            auth: {
                user: user,
                pass: pass 
            }
        });
        let info = await transporter.sendMail({
            from: `${user}`, 
            to: to, 
            subject: title, 
            html: text
        });
        console.log("发送成功");
    }

    // 执行
    var info = await sendMail(mailtitle,mailcontent);

  fs.appendFileSync('mail.log', info, 'utf-8');
  
    if (fs.existsSync("spider_old.csv")) {
        fs.unlinkSync("spider_old.csv");
    }
    fs.writeFileSync("spider_old.csv", papa.unparse(spider_new, { header: true, skipEmptyLines: true }));
})();
