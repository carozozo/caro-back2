// 個人帳號操作
$.fn.accountOperator = function ($$accountUser, pageSubject) {
  const $self = this

  $self.html('')

  const listMap = {}
  const groupInfoSize = _.size(pageSubject)

  // 將 pageSubject 轉換為導頁的選單
  let groupInfoCount = 0
  _.forEach(pageSubject, (info, _pageSubject) => {
    const title = info.title
    const menuGroup = info.menuGroups[0]
    const {menus} = menuGroup
    const _pageName = _.keys(menus)[0] // 取出頁面主題的第一筆內容頁
    const obj = {
      title,
      fn: () => {
        $.global.simpleLoadPage(_pageSubject, _pageName)
      },
    }
    if (++groupInfoCount === groupInfoSize) obj.divider = true // 最後一筆導頁選單, 要加上分隔線
    listMap[_pageSubject] = obj
  })

  if ($$accountUser) {
    _.assign(listMap, {
      updateAccount: {
        title: '修改資料',
        fn: () => {
          $.global.simpleLoadPage('ybt', 'account_edit_self')
        },
      },
      logout: {
        title: '登出',
        fn: () => {
          $.global.aj({
            url: `/main/account/logout`,
            method: 'POST',
            data: {},
            suc: (res) => {
              $.global.initPage(res)
            },
          })
        },
      },
    })
  }

  const list = _.map(listMap, (obj, key) => {
    return {html: obj.title, val: key, divider: obj.divider}
  })

  const $infoBtn = $('<span>').dropDown(list, {
    defTitle: `Hi ${$$accountUser ? $$accountUser.name : '您好'}`,
    style: 'warning',
    size: 'sm',
    selectedCb: () => {
      const val = $infoBtn.val()
      listMap[val].fn()
    },
  })
  $self.append($infoBtn)

  // 透過網址找出目前所選取的頁面主題
  const _pageSubject = $.unit.getUrlParam('_pageSubject')
  _.forEach(list, (info, i) => {
    if (_pageSubject !== info.val) return
    $infoBtn.clickItem(i, false)
  })

  return $self
}
