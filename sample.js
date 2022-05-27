/*
 自動產生基本的開發檔案

 找出 .sample 檔案, 並複製成 .js 檔案, 放到指定的 $projectDir 底下
 `T=$filename npm run sample:$projectDir`

 移除指定的 $projectDir 底下對應的 .js 檔案
 `T=$filename npm run sample.delete:$projectDir`

 e.g. 建立檔案
 `T=demo npm run sample:proj1`
 會建立:
 app/route/proj1/demo.js
 app/public/html/proj1/demo.html

 e.g. 移除檔案
 `T=demo npm run sample.delete:proj1`
 會移除上列的檔案
*/
const _ = require(`lodash`)
const fs = require(`fs`)
const path = require(`path`)

const sampleDir = `sample`
const encodeType = `utf-8`
const targetName = _.lowerFirst(process.env.TARGET)
const isDelete = process.env.IS_DELETE
const projectName = process.env.PROJECT

if (!targetName) {
  console.error(`
  請輸入 'T={{想建立的檔名}} npm run sample:{{專案資料夾名稱}}' 建立目標相關檔案
  或 'T={{想移除的檔名}} npm run sample.delete:{{專案資料夾名稱}}' 移除目標相關檔案
  `)
  process.exit()
}

// 遞迴建立資料夾
const recursiveMkdir = (filePath) => {
  if (fs.existsSync(filePath)) return
  recursiveMkdir(path.dirname(filePath)) // 嘗試建立 parent dir
  fs.mkdirSync(filePath)
}
// 把 .sample 的檔案路徑轉換成對應的 .js/.html 路徑
const getFilePathFromSample = (samplePath) => {
  const dirPath = path.dirname(samplePath)
  let fileName = path.basename(samplePath)
  .replace(`__$`, _.upperFirst(targetName)) // e.g. __$Dat.js => UserDat.js
  .replace(`_$`, targetName) // e.g. _$Dat.js => userDat.js

  return path.join(dirPath, projectName, fileName).replace(sampleDir, `.`)
}
// 讀取 .sample 檔案內容並建立對應的 .js 檔案
const createFileFromSample = (samplePath) => {
  let globalSerName = 'ser0'
  let globalDbName = 'db0'
  if (projectName === 'proj1') {
    globalSerName = 'ser1'
    globalDbName = 'db1'
  }

  let data = fs.readFileSync(samplePath, encodeType)
  data = data.replace(/\$projectName\$/g, projectName)
  data = data.replace(/\$targetName\$/g, targetName)
  data = data.replace(/\$TargetName\$/g, _.upperFirst(targetName))
  data = data.replace(/\$serName\$/g, globalSerName)
  data = data.replace(/\$dbName\$/g, globalDbName)

  const filePath = getFilePathFromSample(samplePath)
  if (!fs.existsSync(filePath)) {
    recursiveMkdir(path.dirname(filePath))
    fs.writeFileSync(filePath, data)
    console.log(`已建立 ${filePath}`)
  } else {
    console.log(`已跳過 ${filePath}`)
  }
}
//  移除 .sample 檔案對應的 .js 檔案
const deleteFileFromSample = (samplePath) => {
  const filePath = getFilePathFromSample(samplePath)
  if (!fs.existsSync(filePath)) return
  fs.unlinkSync(filePath)
  console.log(`已移除 ${filePath}`)
}
// 取得所有的 .sample 檔案並建立 or 移除對應的 .js 檔案
const getSampleFilesAndCreateOrDelete = (fileOrDir) => {
  fileOrDir = path.relative(`./`, fileOrDir)
  if (!fs.existsSync(fileOrDir)) return

  const stat = fs.statSync(fileOrDir)
  if (stat.isFile()) {
    if (!isDelete) return createFileFromSample(fileOrDir)
    return deleteFileFromSample(fileOrDir)
  }
  if (stat.isDirectory()) {
    const fileArr = fs.readdirSync(fileOrDir)
    _.forEach(fileArr, (file) => {
      const filePath = path.join(fileOrDir, file)
      getSampleFilesAndCreateOrDelete(filePath)
    })
  }
}

getSampleFilesAndCreateOrDelete(sampleDir)
