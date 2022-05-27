// 處理加解密
class Crypt {
  // 補齊位數
  static #padding (param) {
    let {str, blockSize = 32} = param
    if (blockSize % 16 !== 0) throw new Error('Only accept blockSize by a factor of 16 bytes')

    const len = encodeURI(str).split(/%..|./).length - 1
    const pad = blockSize - (len % blockSize)
    const charPad = String.fromCharCode(pad)
    str = str + charPad.repeat(pad)
    return str
  };

  // 取得 aes cbc hex 加密字串
  static getAesCbcEncodeHex (param) {
    const aes = require('aes-js')
    let {str, iv, key, blockSize} = param

    const textBytes = aes.utils.utf8.toBytes(Crypt.#padding({str, blockSize}))

    iv = aes.utils.utf8.toBytes(iv)
    key = aes.utils.utf8.toBytes(key)

    const aesCbc = new aes.ModeOfOperation.cbc(key, iv)
    const encryptedBytes = aesCbc.encrypt(textBytes)
    return Buffer.from(encryptedBytes).toString('hex')
  };

  // 取得 aes cbc hex 解密字串
  static getAesCbcDecodeHex (param) {
    const aes = require('aes-js')
    let {secretStr, iv, key} = param

    const encryptedBytes = aes.utils.hex.toBytes(secretStr)

    iv = aes.utils.utf8.toBytes(iv)
    key = aes.utils.utf8.toBytes(key)

    const aesCbc = new aes.ModeOfOperation.cbc(key, iv)
    const decryptBytes = aesCbc.decrypt(encryptedBytes)
    const str = aes.utils.utf8.fromBytes(decryptBytes)
    return str.replace(/[\x00-\x1f\x7f]+/g, '') // 移除無法正確印出來的字元
  }
}

module.exports = Crypt
