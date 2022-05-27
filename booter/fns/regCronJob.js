// 載入 cron 排程任務
module.exports = async () => {
  const folderPath = `${PROJECT_PATH}/cron`
  const setting = require(folderPath)
  for (const groupName in setting) {
    const groupSetting = setting[groupName]
    for (const jobName in groupSetting) {
      const syntax = groupSetting[jobName]
      const items = require(`${folderPath}/${groupName}/${jobName}.cr.js`)
      await lib.Cron.regJob({jobName, syntax, items})
    }
  }
}
