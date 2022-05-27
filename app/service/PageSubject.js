// 處理頁面主題資訊 for response
class PageSubject {
  // 內容頁排除名單 for 判斷是否要寫入 session
  static #excludingSessionContentPages = [`account_login`]

  // 管理選單群組
  static get #mainMenuGroups () {
    return [
      {
        category: `管理`,
        menus: {
          account: `帳號管理`,
        },
      },
      {
        category: `登入`,
        menus: {
          account_login: `登入或申請帳號`,
        },
      },
      {
        category: `訪客`,
        menus: {
          welcome: `歡迎使用`,
        },
      },
    ]
  }

  // 專案1選單群組
  static get #proj1MenuGroups () {
    return [
      {
        category: `示範選單群組`,
        menus: {
          user: `用戶列表`,
        },
      },
    ]
  }

  // 預設的選單組
  static get #pageSubject () {
    return {
      main: { // 主題
        title: `Caro-back2管理`, // 主題標題
        menuGroups: PageSubject.#mainMenuGroups, // 可使用的選單組
      },
      proj1: {
        title: `專案1`,
        menuGroups: PageSubject.#proj1MenuGroups,
      },
    }
  }

  static #setPageSubject (pageSubject, subject, menuMap) {
    const pageInfo = PageSubject.#pageSubject[subject]
    if (!pageInfo) throw Error(`Param 'subject' should be one of [${_.keys(PageSubject.#pageSubject)}]`)

    const {menuGroups} = pageInfo
    if (menuMap) {
      const newMenuGroups = []
      _.forEach(menuMap, (menus, category) => {
        const menuGroup = _.find(menuGroups, (g) => g.category === category)
        if (!menuGroup) throw Error(`category [${category}] does not exist in subject [${subject}]`)
        if (_.isArray(menus)) menuGroup.menus = _.pick(menuGroup.menus, menus)
        newMenuGroups.push(menuGroup)
      })
      pageInfo.menuGroups = newMenuGroups
    }
    if (!pageSubject[subject]) pageSubject[subject] = pageInfo
    else pageSubject[subject].menuGroups.push(...pageInfo.menuGroups)
  }

  // 設置登入選單
  static #setInfoForLogin (pageSubject) {
    PageSubject.#setPageSubject(pageSubject, `main`, {'登入': true})
  }

  // 設置訪客專用選單
  static #setInfoForGuest (pageSubject) {
    PageSubject.#setPageSubject(pageSubject, `main`, {'訪客': true})
  }

  // 設置一般選單
  static #setInfoForGeneral (pageSubject) {
    PageSubject.#setPageSubject(pageSubject, `proj1`)
  }

  // 設置管理者選單
  static #setInfoForAdmin (pageSubject) {
    PageSubject.#setPageSubject(pageSubject, `main`, {'管理': true})
  }

  // 依 reqUser 回傳可以使用的頁面主題資訊
  static async getPageSubjectByReqUser (reqUser) {
    const pageSubject = {}

    if (!global.IS_LOGIN_MODE) {
      PageSubject.#setInfoForGeneral(pageSubject)
      return pageSubject
    }

    if (!reqUser) {
      PageSubject.#setInfoForLogin(pageSubject)
      return pageSubject
    }

    if (reqUser.isGuest()) {
      PageSubject.#setInfoForGuest(pageSubject)
      return pageSubject
    }

    if (reqUser.isGeneralUser()) {
      PageSubject.#setInfoForGeneral(pageSubject)
      return pageSubject
    }

    if (reqUser.isAdmin()) {
      PageSubject.#setInfoForAdmin(pageSubject)
      PageSubject.#setInfoForGeneral(pageSubject)
      return pageSubject
    }
  }

  // 判斷內容頁是否在排除名單內
  static async isExcludedPageContent (pageContent) {
    return PageSubject.#excludingSessionContentPages.includes(pageContent)
  }
}

module.exports = PageSubject
