// 註冊 stacker 項目
module.exports = async () => {
  const folderPath = `${PROJECT_PATH}/stacker`
  const groupMap = require(folderPath)

  _.forEach(groupMap, (group, groupName) => {
    const infos = []
    _.forEach(group, (parents, taskName) => {
      const entries = require(`${folderPath}/${groupName}/${taskName}.st.js`)
      infos.push({groupName, taskName, entries, parents})
    })
    groupMap[groupName] = infos
  })
  lib.Stacker.regTaskGroups(groupMap)
}