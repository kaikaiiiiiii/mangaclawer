const nodemailer = require("nodemailer"); // 发送邮件

// 发送邮件函数
async function sendMail(text) {
    var user = "151493994@qq.com"; //自己的邮箱
    var pass = "gslbexwytehkcadh"; //qq邮箱授权码,如何获取授权码下面有讲
    var to = ["wukaiyu@mininglamp.com", "yaoyingjun@mininglamp.com", "wky0729@163.com"]; //对方的邮箱
    let transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 587,
        secure: false,
        auth: {
            user: user, // 用户账号
            pass: pass //授权码,通过QQ获取
        }
    });
    let info = await transporter.sendMail({
        from: `${user}`, // sender address
        to: to, // list of receivers
        subject: "测试：淘宝 API 监测每日更新", // Subject line
        text: text // plain text body
    });
    console.log("发送成功");
}

// 执行
sendMail("no update");
