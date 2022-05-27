$(() => {
  const $pageTitle = $('#pageTitle')
  const $container = $('#container')
  const $pageHeader = $('#pageHeader')
  const $pageMenu = $('#pageMenu')
  const $pageContent = $('#pageContent')

  let timeoutInstance

  // 由 $.global 控管的參數
  const PARAM = {
    ROUTE_ROOT: (() => { // Note. 指定目前 url 的根目錄, 請和 ecosystem.config.js 同步
      const ROUTE_ROOT = '/caro-back2'
      if (_.includes(window.location.href, ROUTE_ROOT)) return ROUTE_ROOT
      return ''
    })(),
    // 以下為 backend 回傳的資訊
    pageSubject: undefined, // 頁面主題資訊
    pageQueryParam: undefined, // 頁面搜尋參數
    // 以下為 client 自行使用的資訊
    $$accountUser: undefined, // 帳號操作者 instance
    prePageQueryParam: undefined, // 上次的頁面搜尋參數
    pageSubjectName: undefined, // 目前頁面主題名稱
    title: undefined, // 目前頁面主題標題
  }

  // 全局通用
  $.global = {
    // 建立 url
    generateUrl: (url) => {
      if (!_.startsWith(url, '/')) url = `/${url}`
      return `${$.global.getParamVal('ROUTE_ROOT')}${url}`
    },
    // 客製化 ajax 讀取
    aj: (opt) => {
      let {
        method = 'POST', data, suc, err, raw,
        useCache = true, // 是否使用之前的快取結果
        skipFail = false, // ajax 報錯是否處理
      } = opt

      const url = $.global.generateUrl(opt.url)

      // account 操作一律不使用 cache
      if (_.startsWith(url, '/main/account')) {
        useCache = false
      }

      _.assign(opt, {url, method})

      const cacheMap = $.global.aj._ajCacheMap = $.global.aj._ajCacheMap || {}
      const cacheKey = JSON.stringify({url, data, method})

      if (opt.beforeSend) opt.beforeSend()

      if (useCache && cacheMap[cacheKey]) {
        suc(cacheMap[cacheKey])
        if (opt.complete) opt.complete()
        return
      }

      return $.ajax(opt).done((resp) => {
        if (resp.suc !== undefined) {
          if (useCache) {
            cacheMap[cacheKey] = resp.suc
            setTimeout(() => { // 一定時間後移除 cache
              delete cacheMap[cacheKey]
            }, 3000)
          }
          return suc && suc(resp.suc)
        }
        if (resp.war !== undefined) {
          $container.showWar(resp.war, 10)
          if (resp.msgType === 'reqUserNotExists') return $.global.refreshPage()
          return err && err(resp.war)
        }
        if (resp.err !== undefined) {
          $container.showErr(resp.err, false)
          return err && err(resp.err)
        }
        raw && raw(resp)
      }).fail(() => {
        if (skipFail) return
        const errMsg = '呼叫 ajax 發生錯誤'
        err && err(errMsg)
        $container.showErr(errMsg, false)
      })
    },
    // 讀取頁面
    loadPage: ({pageQueryParam, pageSubject} = {}, {setUrlHistory = true, updateMenu = false} = {}) => {
      const _pageSubject = pageQueryParam._pageSubject
      const _pageName = pageQueryParam._pageName
      const queryStr = $.param(pageQueryParam)
      const url = `index/page?${queryStr}`

      $.global.hideAlert()

      timeoutInstance && clearTimeout(timeoutInstance)
      $pageContent.showPage(url, {
        befLoad: () => {
          if (setUrlHistory) { // 寫入網址狀態記錄
            const url = new URL(window.location.href)
            const newUrl = `${url.origin}${url.pathname}?${queryStr}`
            window.history.pushState({pageQueryParam, pageSubject, path: newUrl}, '', newUrl)
          }
        },
        aftLoad: () => {
          PARAM.prePageQueryParam = PARAM.pageQueryParam || pageQueryParam
          PARAM.pageQueryParam = pageQueryParam
        },
      })

      pageSubject = pageSubject || PARAM.pageSubject
      PARAM.pageSubject = pageSubject

      const groupCfg = pageSubject[_pageSubject]
      if (!groupCfg) return

      // 設置標題
      const title = groupCfg.title
      if (PARAM.title !== title) {
        PARAM.title = title
        $pageTitle.html(title)
        $pageHeader.setTitle(title) // 頁面標頭
      }

      // 選單初始化
      if (PARAM.pageSubjectName !== _pageSubject || updateMenu) {
        const menuGroups = groupCfg.menuGroups
        $pageMenu.pageMenu(_pageSubject, menuGroups)
      }

      $pageMenu.setActiveItem(_pageSubject, _pageName)
      PARAM.pageSubjectName = _pageSubject
    },
    // 讀取頁面(簡化參數)
    simpleLoadPage: (_pageSubject, _pageName, {query} = {}) => {
      $.global.loadPage({pageQueryParam: {_pageSubject, _pageName, ...query}})
    },
    // 讀取上次頁面
    loadPrevPage: () => {
      $.global.loadPage({pageQueryParam: PARAM.prePageQueryParam})
    },
    // 初始化操作者帳號
    initOperator: (account, pageSubject) => {
      const $$accountUser = account ? _.assign(account, {
        execMethod: (method, args) => { // 可讓 client 觸發 backend reqUser 的 method
          let ret = undefined
          $.global.aj({
            url: '/main/account/execMethod',
            method: 'POST',
            async: false,
            data: {method, args},
            suc: (res) => {
              ret = res
            },
          })
          return ret
        },
      }) : undefined

      PARAM.$$accountUser = $$accountUser
      pageSubject = pageSubject || PARAM.pageSubject

      $pageHeader.setAccountOperator($$accountUser, pageSubject)
    },
    // 初始化頁面內容
    initPage: ({account, pageSubject, pageQueryParam}) => {
      $.global.loadPage({pageQueryParam, pageSubject}, {updateMenu: true})
      $.global.initOperator(account, pageSubject)
    },
    // 重新整理頁面
    refreshPage: () => {
      const url = new URL(window.location.href)
      const urlForMyInfo = `/main/account/getMyInfo${url.search}`
      $.global.aj({
        url: urlForMyInfo,
        suc: (res) => {
          $.global.initPage(res)
        },
      })
    },
    // 取得 PARAM 參數值
    getParamVal: (key) => {
      return PARAM[key]
    },
    // 顯示頁面錯誤訊息
    showErr: (...args) => {$container.showErr.apply($container, args)},
    // 顯示頁面告訊息
    showWar: (...args) => {$container.showWar.apply($container, args)},
    // 顯示頁面提示訊息
    showInfo: (...args) => {$container.showInfo.apply($container, args)},
    // 取得後端系統資訊
    getSystemInfo: (cb) => {
      $.global.aj({
        url: '/system/getSystemInfo',
        method: 'POST',
        suc: (res) => {
          cb(res)
        },
        skipFail: true,
      })
    },
    // 檢查後端狀態
    cruiseSystemStatus: () => {
      const cruise = () => {
        $.global.getSystemInfo((res) => {
          const {SY_STAFF_SYNC_STATUS} = res
          let errMsg = ``

          if (SY_STAFF_SYNC_STATUS === 'unknown') errMsg = `尚未同步社區幫用戶是否為信義員工, 或同步發生錯誤`

          if (errMsg) $.global.showErr(`${errMsg}<br/><del>(如有疑問請撥打 0800-123456, 將不會有專人為您服務)</del>`, 0)
        })
      }

      cruise()
      setInterval(cruise, 1800000)
    },
    // 隱藏頁面提示訊息
    hideAlert: (...args) => {$container.hideAlert.apply($container, args)},
    // 顯示 loading
    showLoading: (...args) => {
      $container.showLoading.apply($container, args)
    },
    // 隱藏 loading
    hideLoading: (...args) => {
      $container.hideLoading.apply($container, args)
    },
    // 捲動畫面至最上層
    scrollToTop: () => {
      $pageContent.scrollToTop()
    },
  }

  $pageHeader.pageHeader() // 頁面標頭
  $container.alert() // 頁面系統通知
  $container.loading()
  $pageContent.pageContent().scrollTopBtn() // 頁面內容初始化

  $.global.refreshPage()

  // 定義全域變數 for IDE 不會顯示警告
  window.gsap = window.gsap || undefined

  // 監聽網址狀態改變
  window.addEventListener('popstate', function (event) {
    // event 即 window.history.pushState 中的第一個參數
    if (!event.state.pageQueryParam) return
    $.global.loadPage(event.state, {setUrlHistory: false})
  })

  // 執行巡查後端狀態
  $.global.cruiseSystemStatus()
})
