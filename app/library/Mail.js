// 客製的 mail 函式庫
class Mail {
  static #nodemailer = require('nodemailer') // https://nodemailer.com/

  static #config = {
    transportOptions: {
      host: 'smtp.gmail.com',
      pool: true,
      port: 587,
      auth: {
        user: 'xxx',
        pass: 'yyy', // 此為應用程式密碼, 設定方式: google 帳戶 -> 安全性 -> 開啟二階段驗證 -> 應用程式密碼, 若有修改可能會影響到外送
      },
    },
    defaultMailOptions: {
      from: '"Caro科技"caro-teck@gmail.com',
    },
  }

  static #transport = Mail.#nodemailer.createTransport(Mail.#config.transportOptions)

  static sendMail (mailOptions) {
    return new Promise((resolve, reject) => {
      mailOptions = Object.assign(Mail.#config.defaultMailOptions, mailOptions)
      Mail.#transport.sendMail(mailOptions, (err, info) => {
        if (err) {
          log.error('Mail error:', err)
          return reject(err)
        }
        resolve(info)
      })
    })
  }
}

module.exports = Mail
