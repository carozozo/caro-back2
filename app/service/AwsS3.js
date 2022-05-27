// 客製化的 AWS S3 物件
const path = require('path')
const fs = require('fs')
const AwsSdk = require('aws-sdk')
const ProgressBar = require('progress')

AwsSdk.config = new AwsSdk.Config({
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
})

class AwsS3 {
  constructor (bucketName) {
    this.#bucketName = bucketName
    this.#s3 = new AwsSdk.S3({
      params: {Bucket: bucketName},
    })
  }

  #s3 = null
  #bucketName = ''

  getLastObject (Prefix = '') {
    const bucketName = this.#bucketName
    const getLast = (StartAfter = '') => {
      return new Promise((resolve, reject) => {
        this.#s3.listObjectsV2({Bucket: bucketName, Delimiter: '/', Prefix, StartAfter}, (err, data) => {
          if (err) return reject(err)
          const contents = data.Contents
          const contentsLength = contents.length
          const lastObj = _.last(contents)

          // Note. 每次列出來的 contentsLength 最大為 1000 => 嘗試繼續往後找
          if (contentsLength > 999) {
            // 從這次找到的倒數第二筆的開始往後搜尋, 避免總筆數剛好為 1000 的倍數會找不到資料
            const prevLastObj = contents[contentsLength - 2]
            return resolve(getLast(prevLastObj.Key))
          }
          resolve(lastObj)
        })
      })
    }
    return getLast()
  }

  downloadObj (bucketObj, distPath) {
    const bucketName = this.#bucketName
    const s3 = this.#s3
    const fileName = path.basename(bucketObj.Key)

    const bucketObjKey = bucketObj.Key
    const bucketObjSize = bucketObj.Size
    const bucketObjSizeInMb = (bucketObjSize / 1024 / 1024).toFixed(3)
    const filePath = path.join(distPath, fileName)

    if (fs.existsSync(filePath)) {
      log.print(`File ${filePath}exists, skip out`)
      return Promise.resolve(filePath)
    }

    log.print(`Start downloading ${filePath} ${bucketObjSizeInMb}MB`)

    const s3Req = s3.getObject({Bucket: bucketName, Key: bucketObjKey})
    const readStream = s3Req.createReadStream({emitClose: true})
    const writeStream = fs.createWriteStream(filePath)
    const bar = new ProgressBar('[:bar] :percent :elapseds', {
      complete: '=',
      incomplete: ' ',
      width: 50,
      total: bucketObj.Size,
    })

    return new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => {
        writeStream.write(chunk)
        bar.tick(chunk.length)
      })
      readStream.on('end', () => {
        writeStream.end()
        log.print('Download completed')
        resolve(filePath)
      })
      readStream.on('error', (err) => {
        reject(err)
      })
    })
  }
}

module.exports = AwsS3
