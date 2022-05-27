// 處理信義 FTP 操作
class Ftp {
  constructor (param = {}) {
    const {cfgIndex = 0} = param
    const JsFtp = require('jsftp')
    const {host, user, pass, workdir} = Ftp.#cfgList[cfgIndex]

    this.ftp = new JsFtp({host, user, pass})
    this.workdir = workdir || ''
  }

  // 設定列表
  static #cfgList = [
    {host: '123.123.123.123', user: 'xxx', pass: 'xxx', workdir: ''},
  ]

  // 上傳檔案
  uploadFile (filePath) {
    const fs = require('fs')
    const path = require('path')
    const {ftp, workdir} = this

    const filename = path.basename(filePath)
    const remoteFilePath = path.join(workdir, filename)
    const data = fs.readFileSync(filePath)

    return new Promise((res, rej) => {
      ftp.put(data, remoteFilePath, err => {
        if (err) return rej(err)
        res()
      })
    })
  }

  // 寫入資料並上傳檔案
  writeAndUploadFile (filename, data, opt = {}) {
    const fs = require('fs')
    const path = require('path')
    const {dirPath = TEMP_DIR_PATH} = opt
    const filePath = path.join(dirPath, filename)

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    if (!_.isString(data) && !_.isBuffer(data)) data = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, data)
    return this.uploadFile(filePath)
  }
}

module.exports = Ftp
