// 處理此專案的用戶 in proj1-DB

class User {
  static $initCollectionInfo = {
    globalSet: 'db1',
    cb: async () => {
      // 初始化用戶
      const userList = _.map(_.times(120, Number), (n) => {
        return {name: `name${n}`, createdAt: new Date(), disabled: false}
      })
      await db1.User.insertMany(userList)
    },
  }
}

module.exports = User
