const nodemailer = require("nodemailer"); // 发送邮件
const axios = require("axios"); // 获取文案
const schedule = require("node-schedule"); // 定时任务

// 发送邮件函数
async function sendMail(text) {
  var user = "xxx@qq.com"; //自己的邮箱
  var pass = "xxx"; //qq邮箱授权码,如何获取授权码下面有讲
  var to = "waitfor_1153@qq.com"; //对方的邮箱
  let transporter = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 587,
    secure: false,
    auth: {
      user: user, // 用户账号
      pass: pass, //授权码,通过QQ获取
    },
  });
  let info = await transporter.sendMail({
    from: `亲爱的老公<${user}>`, // sender address
    to: `亲爱的老婆<${to}>`, // list of receivers
    subject: "亲爱的老婆", // Subject line
    text: text, // plain text body
  });
  console.log("发送成功");
}

// 获取情话函数
function getHoneyeWords() {
  var url = "https://chp.shadiao.app/api.php";
  //获取这个接口的信息
  return Axios.get(url);
}

// 执行
schedule.scheduleJob({ hour: 17, minute: 21 }, function () {
  console.log("启动任务:" + new Date());
  getHoneyedWords().then((res) => {
    console.log(res.data);
    sendMail(res.data);
  });
});