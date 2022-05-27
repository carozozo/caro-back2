// 初始化檔案
module.exports = async () => {
  const fs = require(`fs`)
  if (!fs.existsSync(TEMP_DIR_PATH)) fs.mkdirSync(TEMP_DIR_PATH)
}