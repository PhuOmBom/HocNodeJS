const path = require("path");
const nodemailer = require("nodemailer");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const htmlFile = path.join(__dirname, "gg.html");

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function sendMail() {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "random@gmail.com",
      subject: "Welcome",
      html: `
        <p>download it :)</p>
      `,
      attachments: [
        {
          filename: "gg.html",
          path: htmlFile
        }
      ]
    });

    console.log("Email sent");
    console.log(result.messageId);
  } catch (error) {
    console.error("Send email failed");
    console.error(error);
  }
}

sendMail();
