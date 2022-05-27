// 客製的解壓縮函式庫
const fs = require('fs')
const path = require('path')

const gunzip = require('gunzip-maybe') // 解壓 .gz 資訊
const tarStream = require('tar-stream') // 解析 .tar 資訊

class Unzip {
  static #recursiveMkdir (dirPath) {
    if (fs.existsSync(dirPath)) return
    Unzip.#recursiveMkdir(path.dirname(dirPath)) // 嘗試建立 parent dir
    fs.mkdirSync(dirPath)
  }

  // 解壓 .tar.gz 檔
  static expandTarGz (param) {
    const {filePath, distDirPath, cb} = param

    log.print(`Start expanding ${filePath} to ${distDirPath}`)

    return new Promise((resolve, reject) => {
      const extract = tarStream.extract()

      fs.createReadStream(filePath).pipe(gunzip()).pipe(extract)

      extract.on('entry', async function (header, stream, next) {
        const filepath = header.name
        const type = header.type
        const fullPath = path.join(distDirPath, filepath)

        try {
          if (cb && cb(header) === false) {
            log.print(`Skip file ${filepath}`)
          } else {
            if (type === 'directory') {
              Unzip.#recursiveMkdir(fullPath)
            } else if (path.extname(fullPath)) {
              log.print(`Write file ${filepath}`)
              const writeStream = fs.createWriteStream(fullPath)
              stream.pipe(writeStream)
            } else {
              log.print(`Skip file ${filepath}`)
            }
          }
        } catch (e) {
          reject(e)
        }

        stream.resume()
        stream.on('end', function () {
          next()
        })
      })

      extract.on('finish', function () {
        log.print('Finish expanding')
        resolve()
      })
    })
  }
}

module.exports = Unzip
