// 處理網路傳輸安全協定
class Tls {
  // 取得 https 憑證資訊
  static async getCertificateInfo ({host}) {
    const https = require('https')
    const options = {
      hostname: host,
      port: 443,
      path: '/',
      method: 'GET',
    }
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let {
          issuer: {O: issuer}, valid_from: validFrom, valid_to: validTo,
        } = res.socket.getPeerCertificate()


        validFrom = lib.Unit.toTwTimeStr(validFrom)
        validTo = lib.Unit.toTwTimeStr(validTo)

        resolve({issuer, validFrom, validTo})
      }).on('error', ({message}) => {
        resolve({description: message})
      })
      req.end()
    })
  }
}

module.exports = Tls
