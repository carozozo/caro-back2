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
;// 一些下載的基本功能
$.downloader = {
  // 把內容轉存下載
  save (file, fileName, fileType, encodeType = `utf-8`) {
    let content = ``
    if ([`csv`, `html`].includes(fileType)) {
      content = `data:text/${fileType};charset=${encodeType},`
    }
    content += encodeURIComponent(file)

    const $link = $(`<a>`)
    const $body = $(`body`)
    $link.attr('href', content)
    $link.attr('download', `${fileName}.${fileType}`)
    $body.append($link)
    $link[0].click()
    $link.remove()
  },
  // 另開網址下載
  download (url, queryObj = {}) {
    const $form = $(`<form>`).attr({
      method: 'post',
      action: $.global.generateUrl(url),
      target: '_blank',
    })

    for (const key in queryObj) {
      if (!queryObj.hasOwnProperty(key)) continue
      let val = queryObj[key]

      if (_.isArray(val)) {
        for (const v of val) {
          const $hiddenField = $(`<input>`).attr({
            type: 'hidden',
            name: `${key}[]`,
            value: v,
          })
          $form.append($hiddenField)
        }
      } else {
        if (val === null) val = 'null'
        const $hiddenField = $(`<input>`).attr({
          type: 'hidden',
          name: key,
          value: val,
        })
        $form.append($hiddenField)
      }
    }

    $('body').append($form)
    $form.submit()
    setTimeout(() => {
      $form.remove()
    })
  },
};// 一些未分類的函式
$.unit = {
  // 取得網址上的變數值
  getUrlParam: (key) => {
    const hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&')
    let param = [], i = 0, hash
    for (i; i < hashes.length; i++) {
      hash = hashes[i].split('=')
      param[hash[0]] = hash[1]
    }
    if (_.isString(key)) return param[key]
    return param
  },
  // 是否為數字格式的字串
  isNumeric: (str) => {
    if (typeof str != 'string') return false
    return !isNaN(str) && !isNaN(parseFloat(str))
  },
  // 判斷是否可下載的數據; e.g. "30 (0)" => 取出 "30" 判斷是否數字
  disciplineDownloadableFigure: (val) => {
    const valArr = String(val).split(' ')
    const firstStr = valArr.shift()
    const tailStr = valArr.join(' ')
    const num = Number(firstStr)

    const isDownloadable = !_.isNaN(num) && num !== 0
    return {isDownloadable, firstStr, tailStr}
  },
  // 字串轉陣列
  strToArr: (str) => {
    return str.split(/\r\n|[\s\r\n,;]/)
  },
};// 個人帳號操作
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
;// 通知功能
$.fn.alert = function () {
  const $self = this

  const $alert = $(`<div>`).css({
    'text-align': 'center',
    'position': 'absolute',
    'padding': '20px',
    'width': '100%',
    'cursor': 'pointer',
    'z-index': 200,
  }).addClass(`alert`).click(() => {
    $self.hideAlert()
  })

  _.assign($self, {
    showAlert: (type, msg, timeoutSec = 2) => {
      const className = `alert-${type}`
      $alert.removeClass((index, className) => {
        return (className.match(/(^|\s)alert-\S+/g) || []).join(' ')
      }).addClass(className)
      if (!msg) return
      $alert.html(msg).slideDown(200)

      if (!_.isNumber(timeoutSec) || !timeoutSec) return
      setTimeout(() => {
        $self.hideAlert()
      }, timeoutSec * 1000)
    },
    showInfo: (msg, timeoutSec) => {
      $self.showAlert(`info`, msg, timeoutSec)
      return $self
    },
    showWar: (msg, timeoutSec) => {
      $self.showAlert(`warning`, msg, timeoutSec)
      return $self
    },
    showErr: (msg, timeoutSec) => {
      $self.showAlert(`danger`, msg, timeoutSec)
      return $self
    },
    hideAlert: () => {
      $alert.slideUp(200)
      return $self
    },
  })

  $self.prepend($alert).hideAlert()

  return $self
};// 利用 data 裡的 key/value 自動設置到物件內
$.fn.autoSet = function (data, {cb} = {}) {
  const $self = this

  $self.find(`[auto-set]`).each(function (i) {
    const $self = $(this)
    const key = $self.attr(`auto-set`)
    let val = _.get(data, key)
    if (cb) {
      const newVal = cb({data, key, val, i})
      if (newVal) val = newVal
    }
    $self.html(!_.isUndefined(val) ? val : '')
  })

  return $self
};// boolean 下拉選單
$.fn.booleanOption = function (opt = {}) {
  let {
    asc = true,
    defTitle = '是否',
    trueHtml = '是',
    falseHtml = '否',
    dropDownOpt = {addEmpty: true},
  } = opt

  const $self = this

  const list = [
    {html: trueHtml, val: true},
    {html: falseHtml, val: false},
  ]
  if (!asc) _.reverse(list)

  dropDownOpt = _.assign({
    defTitle,
  }, dropDownOpt)

  $self.dropDown(list, dropDownOpt)

  return $self
};// 選擇 bootstrap theme 效果
$.fn.bootstrapTheme = function () {
  const $self = this

  const $head = $('head')
  const className = `bootstrapTheme`
  const defTheme = `-none-`
  const currentTheme = localStorage.getItem(className) || defTheme

  const getLink = (theme) => {
    if (!theme || theme === defTheme) return `https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css`
    return `https://stackpath.bootstrapcdn.com/bootswatch/4.4.1/${theme}/bootstrap.min.css`
  }
  const setHref = (theme) => {
    localStorage.setItem(className, theme)
    $link.attr(`href`, getLink(theme))
  }

  let $link = $self.find(className)
  if ($link.length === 0) $link = $(`<link class="${className}" rel="stylesheet">`)
  $head.append($link)

  const $group = $(`<div class="btn-group"></div>`).css({
    margin: 5,
  })
  const $btn = $(`<button type="button" class="btn btn-danger btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Theme</button>`)
  const $menu = $(`<div class="dropdown-menu dropdown-menu-right"></div>`).css({
    overflow: 'auto',
  })
  $group.append([$btn, $menu])
  $self.append($group)

  const themes = [
    `-none-`, `cerulean`, `cosmo`, `cyborg`, `darkly`, `flatly`, `journal`, `litera`, `lumen`,
    `lux`, `materia`, `minty`, `pulse`, `sandstone`, `simplex`, `sketchy`, `slate`, `solar`,
    `spacelab`, `superhero`, `united`, `yeti`,
  ]
  const itemList = []
  for (const theme of themes) {
    const $a = $(`<a class="dropdown-item" style="cursor:pointer;">${theme}</a>`).click(() => {
      setHref($a.html())
      for (const $item of itemList) {
        $item.removeClass(`active`)
      }
      $a.addClass(`active`)
    })
    if (currentTheme === theme) $a.addClass(`active`)
    $menu.append($a)
    itemList.push($a)
  }

  setHref(currentTheme)

  return $self
};// 簡化文字內容
$.fn.brief = function (content = ``, {
  linkTxt = ``, // 指定連結文字內容, 沒有設置的時候則是截取內文, 有設置時 usePop 強制為 true
  maxLength = 20, // 截取內文的長度
} = {}) {
  const $self = this

  if (!content) return $self

  let briefTxt = ``
  let usePop = true // 是否要用彈跳顯示

  if (linkTxt) {
    briefTxt = linkTxt
    usePop = true
  } else {
    briefTxt = content.substr(0, maxLength)
    if (briefTxt.length < content.length) {
      briefTxt += `...`
    } else {
      usePop = false // 文字長度沒超過截取長度, 不需要 pop
    }
  }

  const $text = $(`<span>`)
  $text.html(briefTxt)
  if (usePop) {
    const opt = {
      content,
    }
    $text.addClass(`text-info`).css({cursor: `pointer`}).popover(opt)
  }
  $text.mouseover(() => {
    $text.popover(`show`)
  })
  $text.mouseleave(() => {
    $text.popover(`hide`)
  })

  $self.append($text)

  return $self
};// 客製化 button
$.fn.btn = function ({type = 'primary', html = '送出', size} = {}) {
  const $self = this

  const $btn = $(`<button class="btn btn-${type}">${html}</button>`)
  let defType = type

  if (size) $btn.addClass(`btn-${size}`)

  $self.css({
    display: 'inline-block',
  }).append($btn)

  _.assign($self, {
    disableBtn: (disabled = true) => {
      $btn.prop('disabled', disabled)
    },
    changeType: (type = 'primary') => {
      $btn.removeClass(`btn-${defType}`).addClass(`btn-${type}`)
      defType = type
    },
  })

  return $self
};// 設置/取得 checked
$.fn.checked = function (checked) {
  const $self = this

  if (_.isNil(checked)) return $self.prop('checked')
  $self.prop('checked', checked)

  return $self
};// 客製化 content 頁面
$.fn.content = function (param = {}) {
  const $self = this
  const {allAjaxSuc} = param

  const $searchMain = $self.find(`#searchMain`)
  const $resultMain = $self.find(`#resultMain`)
  const $outlineBlock = $self.find(`#outlineBlock`)
  const ajaxQueue = [] // 計數 callAjax 執行數量
  let contentParam = {} // 存放 content 自用變數

  // ajax 呼叫時的頁面操作, 例如產生讀取效果, 自動 disable from 物件等等
  const initAjaxOperator = ($targets) => {
    if (!_.isArray($targets)) $targets = [$targets]

    const oriDisabledAttr = 'original-disabled'
    const $disableTargets = _.map([...$self.find(`input`), ...$self.find(`button`)], (dom) => $(dom))
    const info = {isSettled: false, isSuccessful: false}
    const $loadings = []

    for (const $target of $targets) {
      const $loading = $(`<h3>讀取中</h3>`).css({
        opacity: 0.5, position: 'absolute',
        transform: 'translate(-50%, 0)',
        left: '50%',
      })
      $loadings.push($loading)
      $target.before($loading)
      $target.css({opacity: 0.3})
    }

    if (ajaxQueue.length === 0) {
      $resultMain.show()
      _.forEach($disableTargets, ($disableTarget) => { // 記錄原本的 disabled 值
        if (!$disableTarget.attr(oriDisabledAttr)) $disableTarget.attr(oriDisabledAttr, $disableTarget.disabled())
        $disableTarget.disabled(true)
      })
    }

    ajaxQueue.push(info)

    return {
      settle: (isSuccessful = true) => {
        info.isSettled = true

        if (isSuccessful) info.isSuccessful = true
        else $resultMain.hide()

        for (const $target of $targets) {
          $target.animate({opacity: 1}, 400)
        }
        for (const $loading of $loadings) {
          $loading.remove()
        }

        const isAllSettled = _.every(ajaxQueue, (info) => info.isSettled)
        const isAllSuccessful = _.every(ajaxQueue, (info) => info.isSuccessful)
        if (isAllSettled) {
          _.forEach($disableTargets, ($disableTarget) => { // 回復原本的 disabled 值
            $disableTarget.disabled($disableTarget.attr(oriDisabledAttr) === 'true')
          })
          ajaxQueue.splice(0, ajaxQueue.length) // 清空 queue
        }
        if (isAllSuccessful) allAjaxSuc && allAjaxSuc()
      },
    }
  }

  // 一些初始化
  $searchMain.css({marginBottom: 30})
  $resultMain.css({marginBottom: 30, position: 'relative'}).hide()
  $outlineBlock.addClass(`text-center block1`)

  // 設置一個置頂區塊
  const $topDiv = $(`<div class="block1 topDiv"/>`)
  $self.prepend($topDiv)
  $self.$topDiv = $topDiv

  _.assign($self, {
    // 設置或取得 contentParam
    contentParam: (arg, isReplace = false) => {
      if (arg === true) return contentParam = {} // 清空
      if (_.isUndefined(arg)) return _.omitBy(contentParam, _.isUndefined) // 取得所有數值
      if (_.isString(arg)) return contentParam[arg] // 取得指定數值
      if (!_.isPlainObject(arg)) throw Error('請傳入物件')
      if (isReplace) return contentParam = arg // 覆蓋數值
      return _.assign(contentParam, arg) // 設置數值
    },
    // 配裝其他 plugins
    fitOut: (param) => {
      const {pageTipOpt, noticeAreaOpt, fnTextOpt} = param

      if (!_.isEmpty(pageTipOpt)) {
        const $tipsBtn = $(`<button id="tipsBtn"/>`)
        $topDiv.append($tipsBtn)
        $tipsBtn.pageTips(pageTipOpt)
      }

      if (!_.isEmpty(noticeAreaOpt)) {
        const $noticeArea = $(`<span id="noticeArea"/>`)
        $topDiv.append($noticeArea)
        $noticeArea.noticeArea(noticeAreaOpt)
      }

      if (!_.isEmpty(fnTextOpt)) {
        $self.find('input').functionText(fnTextOpt)
      }
    },
    // 包裝呼叫 ajax
    callAjax: (param, $targets = []) => {
      const {url, method, beforeSend, suc, err, complete, getQuery} = param
      const operator = initAjaxOperator($targets)

      const newBeforeSend = () => {
        beforeSend && beforeSend()
      }
      const newComplete = () => {
        complete && complete()
      }
      const newErr = () => {
        operator.settle(false)
        err && err()
      }
      const newSuc = (res) => {
        operator.settle()
        suc(res)
      }

      const data = (() => {
        if (!getQuery) return {}
        if (_.isFunction(getQuery)) return getQuery()
        return getQuery
      })()

      $.global.aj({
        url,
        method,
        data,
        beforeSend: newBeforeSend,
        suc: newSuc,
        err: newErr,
        complete: newComplete,
      })
    },
  })

  return $self
}
;// 客製化日期選擇
$.fn.datePicker = function (opt = {}) {
  const $self = this
  const lang = $.datepicker.regional[`zh-TW`]

  opt = _.assign({
    showOtherMonths: true,
    selectOtherMonths: true,
    maxDate: 0,
    changeMonth: true,
    changeYear: true,
    dateFormat: `yy-mm-dd`,
  }, opt)
  $self.datepicker(`option`, lang).datepicker(opt)
  $self.addClass('form-control').css({
    display: 'inline-block',
    width: 'auto',
  })

  if (opt.now) {
    $self.datepicker(`setDate`, moment().format(`YYYY-MM-DD`))
  }
  if (opt.subtractDay) {
    $self.datepicker(`setDate`, moment().subtract(opt.subtractDay, `d`).format(`YYYY-MM-DD`))
  }
  if (opt.date) {
    $self.datepicker(`setDate`, opt.date)
  }

  return $self
};// 取得底下所有的 children dom 並 disabled
$.fn.disableChildren = function ({selector, disabled = true}) {
  const $self = this

  $self.find(selector).prop('disabled', disabled)

  return $self
};// 設置/取得 disabled
$.fn.disabled = function (disabled) {
  const $self = this

  if (_.isNil(disabled)) return $self.prop('disabled')
  $self.prop('disabled', disabled)

  return $self
};// DOM 顯示切換
$.fn.displaySwitcher = function (domArrList = []) {
  const $self = this
  const indexList = []

  _.assign($self, {
    // 顯示指定階層
    displayLayer: (index = 0) => {
      if (!domArrList[index]) throw Error(`There is no layer for index ${index}`)

      // e.g. domArrList = [[$dom1, $dom2], [$dom3, $dom4], ...]
      let $dom, method
      _.forEach(domArrList, (domArr, i) => {
        if (!_.isArray(domArr)) domArr = [domArr]
        method = i === index ? 'fadeIn' : 'hide'
        for ($dom of domArr) {
          $dom[method]()
        }
      })

      // 寫入階層紀錄
      if (_.last(indexList) !== index) indexList.push(index)
      if (indexList.length > 12) indexList.shift() // 最多 12 階紀錄

      return $self
    },
    // 顯示上一個階層
    displayPrevLayer: () => {
      if (indexList.length < 2) return $self // 無上一次的階層紀錄, 不執行

      // e.g. indexList = [{上次顯示的階層}, {當下顯示的階層}]
      indexList.pop() // 先移除當下的階層紀錄
      const prevIndex = indexList.pop() // 取得上次的階層紀錄
      if (_.isNil(prevIndex)) return $self

      return $self.displayLayer(prevIndex)
    },
  })

  return $self
};// 下載 csv 連結
$.fn.downloadCsvLink = function (url, {query = {}, title = '下載csv'} = {}) {
  const $self = this

  // 將 $self 的容器設置為相對位置, 這樣才能讓 $downloadLink 正確定位
  // Note. 請確認 $self 本身已被 append 至 document 中
  $self.parent().css({position: 'relative'})

  $self.html(title).linkStyle()

  // 設置隱形的下載 csv 下拉選單
  const $downloadLink = $('<div>').downloadCsvOption(url, {
    query,
    title,
    defDisabled: false,
    size: 'sm',
  })
  $downloadLink.getBtn().hide() // 隱藏下拉選單按鈕
  $self.append($downloadLink).attr({'data-toggle': 'dropdown'}) // 設置 'data-toggle' 觸發點擊開啟下拉選單

  return $self
};// 下載 csv 下拉選單
$.fn.downloadCsvOption = function (url, {
  query = {}, defDisabled = true,
  // 以下為 dropDown 參數
  title = '下載csv', size = 'md',
} = {}) {
  const $self = this

  const arr = [
    {html: 'big5編碼', val: 'big5'},
    {html: 'utf-8編碼', val: 'utf-8'},
  ]
  const dropDownOpt = {
    defTitle: title,
    style: 'warning',
    size,
    selectedCb: () => {
      const newQuery = _.isFunction(query) ? query() : query
      newQuery.encode = $self.val()
      $.downloader.download(url, newQuery)
      unselectAllFn(true)
    },
  }
  $self.dropDown(arr, dropDownOpt)

  if (defDisabled) $self.disableBtn()

  const unselectAllFn = $self.unselectAll

  _.assign($self, {
    unselectAll: () => { // 取代 $.fn.dropDown 原本的 unselectAll function
      unselectAllFn(true)
    },
  })

  unselectAllFn(true)

  return $self
};// 客製化下拉選單
$.fn.dropDown = function (list = [], opt = {}) {
  let {
    addEmpty = false, // 是否新增預設空選項
    defTitle = '請選擇', // 選單初始要顯示的文字
    style = 'info', // btn 樣式
    size = 'md', // btn 大小
    multiple, // 複選模式, 0=沒有按鈕, 1=顯示全選, 2=選示取消選取, 3=顯示全選/取消選取
    maxRow = 12, // 最大選單行數
    column = 1, // 期望選單列數
    selectedCb, // 選單被選取時回呼的 function
    showArrow = true, // 是否顯示箭頭
    defIndex, // 預設選取項目, 從 0 開始, 支援數字及數字陣列
    defVal, // 預設選取值, 支援單筆及陣列
  } = opt

  const $self = this
  const $items = []
  const values = []
  const isMultiple = [0, 1, 2, 3].includes(multiple)
  const selectedClass = `dropdown-selected`
  const textClass = `text-${style}`

  if (addEmpty) list.unshift({html: '[清除]', _doCleanup: true})

  const listCount = _.size(list)
  const lastItemIndex = listCount - 1
  const tdArr = [] // 用來協助放置選單選項
  const valueArr = [] // 存儲要回傳的值

  // 當行數大於最大值時, 嘗試增加列數(直排), 並重新計算行數
  let row = Math.ceil(listCount / column)
  while (row > maxRow) {
    row = Math.ceil(listCount / ++column)
  }

  // 更新選單的選取狀態
  const setItemSelectStatus = ($item, isSelected) => {
    if (isMultiple) return $item.setSelectStatus(isSelected)

    // 單選模式 如果代入的 $item 是 boolean, 則強制轉換所有選單項目
    _.forEach($items, ($i) => {
      if (_.isBoolean($item)) return $i.setSelectStatus($item)
      $i.setSelectStatus($i === $item) // 符合的 $item 才會被設為選取
    })
  }
  // 結算選取值, 並更新選單文字
  const concludeVal = () => {
    const htmlArr = []
    valueArr.length = 0 // 清空選取值
    _.forEach($items, ($i) => {
      if (!$i.isSelected()) return
      if ($i._doCleanup) return
      valueArr.push($i.getVal())
      htmlArr.push($i.getHtml())
    })

    if (htmlArr.length) {
      let html = htmlArr[0]
      if (htmlArr.length > 1) html += `,...`
      $btn.html(`${defTitle} ${html}`)
    } else {
      $btn.html(defTitle)
    }
  }
  const buildUpItem = (data, i) => {
    const columnIndex = Math.floor(($items.length) / row)
    const $td = tdArr[columnIndex]

    const html = _.isPlainObject(data) ? data.html : data
    const val = _.isPlainObject(data) ? data.val : data
    const isSelected = _.isPlainObject(data) ? data.isSelected : false
    const divider = _.isPlainObject(data) ? data.divider : undefined
    const _doCleanup = _.isPlainObject(data) ? data._doCleanup : undefined

    const $item = $(`<a class="dropdown-item" style="cursor:pointer;"></a>`).click(() => {
      if ($item._doCleanup) {
        $self.unselectAll()
      } else {
        setItemSelectStatus($item)
        concludeVal()
      }

      if (!$item._doTrigger) {
        $item.setTrigger() // 下次再被 click 時預設可以觸發
        return
      }
      selectedCb && selectedCb()
    })
    const $checked = $(`<span style="padding-right: 5px;">√<span>`).hide()

    $item.setSelectStatus = (isChecked) => {
      if (isChecked === true) {
        $item.addClass(`${selectedClass} ${textClass}`)
        $checked.show()
      } else if (isChecked === false) {
        $item.removeClass(`${selectedClass} ${textClass}`)
        $checked.hide()
      } else {
        $item.toggleClass(`${selectedClass} ${textClass}`)
        $checked.toggle()
      }
    }
    $item.isSelected = () => {
      return $item.hasClass(selectedClass)
    }
    $item.getHtml = () => {
      return html
    }
    $item.getVal = () => {
      return val
    }
    $item.setTrigger = (doTrigger = true) => {
      $item._doTrigger = doTrigger
    }
    $item._doCleanup = _doCleanup
    $item._doTrigger = true

    values.push(val)
    $items.push($item)
    $item.append($checked).append(html).ready(() => {
      if (isSelected) $item.setSelectStatus(true)
      if (i === lastItemIndex) concludeVal()
    })

    $td.append($item)
    if (divider) $td.append('<div class="dropdown-divider"></div>')
  }

  const $btn = (() => {
    const $btn = $(`<button type="button" class="btn btn-outline-${style} btn-${size}" data-toggle="dropdown">`)
    if (showArrow) $btn.addClass('dropdown-toggle')
    if (listCount === 0) $btn.attr('disabled', true)
    return $btn
  })()
  const $dropdownMenu = (() => {
    const $dropdownMenu = $(`<div class="dropdown-menu">`).css({
      'min-width': '2rem',
    })

    // 用來放置選項
    const $dropdownContent = $(`<div class="dropdown-content">`).css({
      'max-height': 'calc(100vh - 300px)',
      'max-width': 'calc(100vh - 200px)',
      overflow: 'auto',
    })

    // 設置列數 table
    const $columnTable = (() => {
      const $t = $(`<table><tr></tr></table>`) // 用來讓選單可以呈現 n 列
      for (let i = 0; i < column; i++) {
        const $td = $(`<td></td>`)
        $t.append($td)
        tdArr.push($td)
      }
      return $t
    })()
    $dropdownMenu.append($dropdownContent.append($columnTable))

    // 設置選單
    // if (addEmpty) buildUpItem({html: '[清除]', _doCleanup: true})
    _.forEach(list, (data, i) => {
      if (!(_.isPlainObject(data) || _.isString(data))) return
      buildUpItem(data, i)
    })

    if (!isMultiple) return $dropdownMenu

    $dropdownMenu.prepend([
      `<div class="dropdown-item disabled text-center">複選</div>`,
      `<div class="dropdown-divider"></div>`,
    ])
    $dropdownMenu.append([
      `<div class="dropdown-divider"></div>`,
      (() => {
        const $footer = $(`<div class="dropdown-item btn-group"></div>`)
        if (multiple === 1 || multiple === 3) {
          const $selectAllBtn = $(`<button type="button" class="btn btn-primary" style="margin: 0 auto;">全選</button>`).click(() => {
            $self.selectAll()
            selectedCb && selectedCb()
          })
          $footer.append($selectAllBtn)
        }
        if (multiple === 2 || multiple === 3) {
          const $unselectAllBtn = $(`<button type="button" class="btn btn-danger" style="margin: 0 auto;">清除</button>`).click(() => {
            $self.unselectAll()
            selectedCb && selectedCb()
          })
          $footer.append($unselectAllBtn)
        }
        return $footer
      })(),
    ])
    $dropdownMenu.click((event) => {
      event.stopPropagation() // 複選模式, 防止點選時選單消失
    })
    return $dropdownMenu
  })()

  $self.html(``).css({
    display: 'inline-block',
    verticalAlign: 'middle',
  }).append((() => {
    const arr = [$btn]
    if (listCount > 0) arr.push($dropdownMenu)
    return arr
  })())

  _.assign($self, {
    // 設置或取得選單值
    val: (val) => {
      if (_.isUndefined(val)) return (isMultiple) ? valueArr : valueArr[0]
      const valArr = _.isArray(val) ? val : [val]
      _.forEach($items, ($item) => {
        const itemVal = $item.getVal()
        if (!valArr.includes(itemVal)) return
        $item.click()
      })
    },
    // 選取指定選項
    clickItem: (itemIndex = 0, doTrigger) => {
      const itemIndexes = _.isArray(itemIndex) ? itemIndex : [itemIndex]
      _.forEach(itemIndexes, (i) => {
        const $item = $items[i]
        $item && $item.setTrigger(doTrigger) || $item.click()
      })
      return $self
    },
    // 全選
    selectAll: (forceMode) => {
      if (!isMultiple) {
        if (forceMode) {
          setItemSelectStatus(true) // 強制全部取消
        } else {
          const $item = $items[$items.length - 1]
          $item && setItemSelectStatus($item) // 選取最後一個選項
        }
      } else {
        _.forEach($items, ($item) => {
          setItemSelectStatus($item, true)
        })
      }
      concludeVal()
      return $self
    },
    // 取消全選
    unselectAll: (forceMode) => {
      if (!isMultiple) {
        if (forceMode) {
          setItemSelectStatus(false) // 強制全部取消
        } else {
          const $item = $items[0]
          $item && setItemSelectStatus($item) // 選取第一個選項
        }
      } else {
        _.forEach($items, ($item) => {
          setItemSelectStatus($item, false)
        })
      }
      concludeVal()
      return $self
    },
    // 取得下拉選單按鈕
    getBtn: () => {
      return $btn
    },
    // 將下拉選單按鈕設為無/有效
    disableBtn: (disabled = true) => {
      $btn.prop('disabled', disabled)
    },
    // 重置預設選項
    resetDefault: () => {
      $self.unselectAll()
      if (_.isNumber(defIndex) || _.isArray(defIndex)) {
        if (_.isNumber(defIndex)) defIndex = [defIndex]
        _.forEach(defIndex, (i) => {
          $self.clickItem(i)
        })
        return
      }
      if (!_.isEmpty(defVal)) {
        if (!_.isArray(defVal)) defVal = [defVal]
        _.forEach(defVal, (v) => {
          $self.clickItem(_.indexOf(values, v))
        })
      }
    },
    // 設置預設標題
    setDefTitle: (title) => {
      defTitle = title ? `[${title}]` : title
    },
  })

  $self.setDefTitle(defTitle)
  $self.resetDefault()

  return $self
}
;// 縮短顯示 table 中的欄位內容
$.fn.foldColumn = function (settingArr, {
  foldWidth = 80, // 預設縮短後的寬度
  spread = 40, // 點擊展開的寬度
} = {}) {
  const $self = this

  if (!Array.isArray(settingArr)) settingArr = [settingArr]
  if (_.isEmpty(settingArr)) return $self

  $self.find('td').css({
    wordBreak: 'break-all',
  })

  for (let setting of settingArr) {
    const dur = 0.3
    const tdArr = []
    let isSpread = false
    // 每個欄位各別的設定
    const fWidth = setting.foldWidth || foldWidth
    const sp = setting.spread || spread
    const key = setting.key

    const spreadWidth = fWidth + sp
    const $th = $self.find(`th[data-key='${key}']`).css({
      cursor: 'pointer',
      width: fWidth,
    }).click(() => {
      isSpread = !isSpread
      const width = isSpread ? spreadWidth : fWidth
      const css = isSpread ? {
        wordBreak: 'break-all', whiteSpace: 'normal',
      } : {
        wordBreak: 'keep-all', whiteSpace: 'nowrap',
      }
      gsap.to($th, dur, {width})
      gsap.set(tdArr, css)
    })

    for (const ele of $self.find(`td[data-key='${key}']`)) {
      const $td = $(ele)
      tdArr.push($td)
      $td.css({
        wordBreak: 'keep-all',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
      })
    }
  }

  $self.css({
    tableLayout: 'fixed',
  })

  return $self
};// 提供一些方便客製化的 text 設定
$.fn.functionText = function ({enterCb}) {
  const $self = this

  $self.focus(function () {
    $(this).select()
  })
  $self.keyup(function (e) {
    if (e.keyCode !== 13) return
    enterCb && enterCb()
  })

  return $self
};// 回上層連結
$.fn.goBackLink = function ({
  title = '←回上層',
  style = 'primary',
  cb,
} = {}) {
  const $self = this

  $self.html(title).css({
    display: 'inline-block', float: 'right', fontSize: '1.1em', marginBottom: 12,
  }).linkStyle(style).click(() => {
    cb()
  })
  return $self
};// 客製化 input 輸入欄位
$.fn.input = function (param = {}) {
  const $self = this
  const {title = '', type = 'text', val = '', emptyVal = '', width = 'auto', placeholder, size} = param

  const $title = $(`<span>${title}</span>`)
  const $input = $(`<input type="${type}" class="form-control" value="${val}">`).css({
    width,
  }).on('blur', () => {
    const val = _.trim($input.val())
    if (val) return
    $input.val(emptyVal)
  })
  if (placeholder) $input.attr('placeholder', placeholder)
  if (size) $input.attr('size', size)

  $self.inputGroup([$input], {prependItems: [$title]})

  _.assign($self, {
    // 設置或取得值
    val: (...args) => {
      return $input.val.apply($input, args)
    },
    // 設置 disabled property
    disabled: (disabled) => {
      if (_.isNil(disabled)) return $input.prop('disabled')
      $input.prop('disabled', disabled)
    },
    // 回復預設值
    resetDefVal: () => {
      $input.val(val)
    },
  })

  return $self
};// 快速建構 bootstrap input-group
$.fn.inputGroup = function (items, {prependItems = [], appendItems = []} = {}) {
  const $self = this

  const $inputGroup = $('<div class="input-group">')
  const setClassToSpan = (items) => {
    for (const item of items) {
      if (item.prop('tagName') !== 'SPAN') continue
      item.addClass('input-group-text')
    }
  }

  if (!_.isEmpty(prependItems)) {
    const $prepend = $('<div class="input-group-prepend">')
    $prepend.append(prependItems)
    $inputGroup.append($prepend)
    setClassToSpan(prependItems)
  }

  $inputGroup.append(items)
  setClassToSpan(items)

  if (!_.isEmpty(appendItems)) {
    const $append = $('<div class="input-group-append">')
    $append.append(appendItems)
    $inputGroup.append($append)
    setClassToSpan(appendItems)
  }

  $self.css({
    display: 'inline-block',
    verticalAlign: 'middle',
  }).append($inputGroup)

  return $self
};// 是否已刪除下拉選單
$.fn.isDisabledOption = function (opt = {}) {
  const $self = this

  $self.booleanOption(_.assign({defTitle: '已刪除'}, opt))

  return $self
};// 客製化每頁筆數輸入格
$.fn.limitInput = function () {
  const $self = this
  const defVal = 50
  const min = 1
  const max = 200

  $self.input({title: `每頁筆數`, val: defVal, size: 2})
  $self.keyup(() => {
    let val = Number($self.val())

    if (_.isNaN(val)) {
      val = defVal
    } else if (val < min) {
      val = min
    } else if (val > max) {
      val = max
    }

    $self.val(val)
  })

  return $self
};// 將內容改為連結樣式
$.fn.linkStyle = function (style = 'info') {
  const $self = this

  $self.addClass(`text-${style}`).css({
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlinePosition: 'under',
  })

  return $self
};// Loading 畫面
$.fn.loading = function () {
  const $self = this
  const $loadingMsg = $(`<div><h1 class="loadingMsg">資料處理中...</h1></div>`).css({
    position: `absolute`,
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%)`,
  })
  const $loading = $(`<div>`).css({
    width: `100%`,
    height: `100%`,
    opacity: `0.5`,
    position: `absolute`,
    'background-color': `black`,
    'text-align': `center`,
  }).hide().append($loadingMsg)

  $self.prepend($loading)

  _.assign($self, {
    // 顯示 loading 狀態
    showLoading: () => {
      const zIndexList = _.map($self.find(`*`), (e) => {
        if ($(e).css(`position`) === `absolute`) {
          return parseInt($(e).css(`z-index`)) || 1
        }
        return 0
      })
      const maxIndexZ = _.max(zIndexList)
      $loading.css({
        'z-index': maxIndexZ + 1,
      })

      $loading.show()
    },
    // 結束 loading 狀態
    hideLoading: () => {
      setTimeout(() => {
        $loading.fadeOut()
      }, 200)
    },
  })

  return $self
};// Tab 顯示功能
$.fn.navTab = function (itemSettings = []) {
  const $self = this

  const $nav = $(`<ul class="nav nav-tabs">`)
  const targets = []
  const tabLinks = []

  for (const itemSetting of itemSettings) {
    const title = !_.isEmpty(itemSetting.title) ? itemSetting.title : `-`
    const isDef = itemSetting.isDef
    const onClick = itemSetting.onClick
    let $target = itemSetting.$target

    if (_.isString($target)) $target = $($target)
    if (!$target) throw new Error(`請設定 $target`)
    if ($target.length === 0) throw new Error(`找不到 $target`)

    targets.push($target)

    const $tabLink = $(`<a class="nav-link" style="cursor: pointer;">${title}</a>`)
    tabLinks.push($tabLink)

    const $tab = $(`<li class="nav-item"></li>`).click(() => {
      _.forEach(tabLinks, ($link) => {
        $link.removeClass(`active`).addClass(`text-primary`)
      })
      $tabLink.removeClass(`text-primary`).addClass(`active`)

      _.forEach(targets, ($t) => {
        $t.hide()
      })
      $target.fadeIn()
      onClick && onClick()
    })

    $nav.append($tab)
    $tab.append($tabLink)

    if (isDef) {
      $tabLink.addClass(`active`)
    } else {
      $tabLink.addClass(`text-primary`)
      $target.hide()
    }
  }

  $self.append($nav)

  return $self
};// 提醒區塊
$.fn.noticeArea = function (param) {
  const $self = this
  const {noticeArr = [], type = 'warning'} = param
  const pointerMsg1 = '&nbsp;&nbsp;←點擊展開'
  const pointerMsg2 = '&nbsp;←&nbsp;點擊展開'
  const msgSize = _.size(noticeArr)
  let toggle = false
  let pointerToggle = false

  if (_.isEmpty(noticeArr)) return $self

  const firstMsg = noticeArr.shift()

  const $title = $('<div/>').addClass(`bg-${type}`).css({padding: 3})
  const $sign = $('<span>△</span>')
  const $pointer = $('<span/>').html(pointerMsg1)
  const $firstMsg = $('<div/>').html(firstMsg).css({padding: 3, paddingBottom: 0})
  const $content = $('<div/>').css({display: 'none', padding: 3, paddingTop: 0})
  const setMsg = (msg, paddingTimes = 0) => {
    if (_.isArray(msg)) {
      paddingTimes += 2
      _.forEach(msg, (m) => {
        setMsg(m, paddingTimes)
      })
      return
    }

    const $msg = $('<div/>')
    if (!msg) $msg.css({height: 6})

    for (let i = 0; i < paddingTimes; i++) {
      msg = `&nbsp;${msg}`
    }
    $msg.html(msg)
    $content.append($msg)
  }

  const $frame = $('<div/>').css({
    border: '2px solid',
    marginBottom: 24,
  })
  $title.append([$sign, ' 貼心體醒'])
  $frame.append([$title, $firstMsg, $content])

  _.forEach(noticeArr, (m) => {
    setMsg(m)
  })

  $self.append($frame)

  if (msgSize > 1) {
    $title.append($pointer).css({cursor: 'pointer'}).click(() => {
      if (!toggle) $sign.html('▽')
      else $sign.html('△')
      $pointer.hide()
      toggle = !toggle
      $content.slideToggle(200)
    })
    setInterval(() => {
      $pointer.html(pointerToggle ? pointerMsg1 : pointerMsg2)
      pointerToggle = !pointerToggle
    }, 900)
  }

  return $self
}
;// 頁面內容
$.fn.pageContent = function () {
  const $self = this
  const tl = gsap.timeline()
  const error = () => {
    $self.html(`<h1 class="text-center">無法讀取頁面</h1>`)
  }

  $self.html(`<h1 class="text-center">請選擇左邊選單</h1>`)

  $self.showPage = (url, {befLoad, aftLoad} = {}) => {
    befLoad && befLoad()
    $.global.aj({
      url,
      method: 'GET',
      err: error,
      raw: (result) => {
        tl.to($self, 0.2, {
          y: -30, opacity: 0, onComplete: () => {
            $self.html(result)
            aftLoad && aftLoad()
          },
        }).to($self, 0.2, {ease: gsap.parseEase('Back').easeOut.config(3), y: 0, opacity: 1, delay: 0.2})
      },
    })
    return $self
  }

  return $self
};// 頁面標頭
$.fn.pageHeader = function () {
  const $self = this

  $self.html('').css({
    position: 'relative',
  }).addClass('bg-primary')

  const indexZ = 1

  const $headerRightFrame = (() => {
    const $rightFrame = $('<span>').css({
      'z-index': indexZ + 1,
      position: 'absolute',
      top: 25,
      right: 10,
    })
    const $accountOperator = $('<span>') // 放置帳號資訊及操作
    const $bootstrapTheme = $('<span>').bootstrapTheme() // theme 下拉選單
    $rightFrame.append([$accountOperator, $bootstrapTheme])
    $rightFrame.$accountOperator = $accountOperator
    return $rightFrame
  })()
  $self.append($headerRightFrame)

  _.assign($self, {
    // 設置頁面標題
    setTitle: (title) => {
      const tl = gsap.timeline({repeat: -1})
      const $titles = _.map(title.split(''), (t) => $(`<div>${t}</div>`).css({
        display: 'inline-block',
      }))

      const $h1 = $(`<h1 class="text-white" id="h1"></h1>`).css({
        'z-index': indexZ,
        'margin': 'auto',
        'text-align': 'center',
      }).append($titles)

      $self.find('#h1').remove()
      $self.append($h1)

      const duration = 0.5
      const stagger = duration * 0.5
      tl.from($titles, {
        duration, ease: gsap.parseEase('Back').easeOut.config(1), opacity: 0, scale: 2, x: 300,
      }).to($titles, {duration, opacity: 0, x: -300, delay: 6, stagger})
    },
    // 設置帳號控制項
    setAccountOperator: ($$accountUser, pageSubject) => {
      $headerRightFrame.$accountOperator.accountOperator($$accountUser, pageSubject)
    },
  })

  return $self
}
;// 頁面左邊選單
$.fn.pageMenu = function (_pageSubject, menuGroups) {
  const $self = this
  const allMenuTitles = []
  const allMenuCategories = []
  const allMenuItems = []

  $self.hide().html('')

  // 建立 header 裡面的按鈕
  const createHeaderBtn = (html, type = 'primary') => {
    return $(`<div class="btn-outline-${type}">`).css({
      display: 'inline-block',
      width: '50%',
      padding: 5,
      textAlign: 'center',
      cursor: 'pointer',
      filter: 'drop-shadow(5px 5px 2px rgba(0, 0, 0, 0.2))',
    }).html(html)
  }
  // 建立選單的 header
  const createMenuHeader = () => {
    const $menuHeader = $('<div class="menu-header"></div>').css({padding: 0})
    const $extendBtn = createHeaderBtn('展開').click(() => {
      $self.extendCategory()
    })
    const $collapseBtn = createHeaderBtn('縮合', 'secondary').click(() => {
      $self.collapseCategory()
    })
    $menuHeader.append([$extendBtn, $collapseBtn])
    return $menuHeader
  }
  // 建立選單容器
  const createMenuReceptacle = () => {
    return $('<div class="menu-receptacle"/>').css({
      height: '100%',
      overflow: 'scroll',
      'flex-grow': 1,
    })
  }
  // 建立選單群組的標題按鈕
  const createMenuCategoryTitle = (category) => {
    const $menuCategoryTitle = $(`<a class="list-group-item list-group-item-dark">${category} -</a>`).css({
      'font-weight': 'bolder',
      padding: '0.3rem 1.25rem',
      cursor: 'context-menu',
      'border-top-width': 2,
      'border-top-color': '#adb5bd',
    }).click(() => {
      $menuCategoryTitle.$_$menuCategory.toggleCategory()
    })

    _.assign($menuCategoryTitle, {
      // 高亮群組標題
      highlight: () => {
        _.forEach(allMenuTitles, ($title) => {
          const isSameTitle = $title === $menuCategoryTitle
          if (isSameTitle) {
            $title.removeClass('list-group-item-dark')
            $title.addClass('list-group-item-secondary')
          } else {
            $title.removeClass('list-group-item-secondary')
            $title.addClass('list-group-item-dark')
          }
        })
      },
      // 顯示標題為 +
      showPlus: () => {
        $menuCategoryTitle.html(`${category} +`)
      },
      // 顯示標題為 -
      showMinus: () => {
        $menuCategoryTitle.html(`${category} -`)
      },
    })

    allMenuTitles.push($menuCategoryTitle)
    return $menuCategoryTitle
  }
  // 建立選單分類群組
  const createMenuCategory = (category) => {
    const $menuCategory = $('<div class="list-group"/>').css({
      overflow: 'hidden',
    })
    const tl = gsap.timeline({paused: true})

    tl.to($menuCategory, 0.2, {height: 0})

    _.assign($menuCategory, {
      // 展開群組
      extendCategory: () => {
        if ($menuCategory.$_isOpen) return
        tl.reverse()
        $menuCategory.$_isOpen = true
        $menuCategory.$_$menuCategoryTitle.showMinus()
      },
      // 縮合群組
      collapseCategory: () => {
        if (!$menuCategory.$_isOpen) return
        tl.play()
        $menuCategory.$_isOpen = false
        $menuCategory.$_$menuCategoryTitle.showPlus()
      },
      // 切換群組展開狀態
      toggleCategory: () => {
        if ($menuCategory.$_isOpen) return $menuCategory.collapseCategory()
        $menuCategory.extendCategory()
      },
      $_isOpen: true,
    })

    allMenuCategories.push($menuCategory)
    return $menuCategory
  }
  // 建立選單按鈕
  const createMenuItem = (title, _pageName, opt = {}) => {
    const {abandon} = opt
    const $menuItem = $(`<div class="list-group-item">${title}</div>`).click(() => {
      $self.setActiveItem(_pageSubject, _pageName)
      $.global.simpleLoadPage(_pageSubject, _pageName)
    }).mouseover(() => {
      tl.play()
    }).mouseleave(() => {
      tl.reverse()
    }).css({
      cursor: 'pointer',
    })

    if (abandon) {
      $menuItem.css({'text-decoration': 'line-through'})
    }

    const tl = gsap.timeline({paused: true})

    tl.to($menuItem, 0.2, {
      boxShadow: `0px 5px 2px 1px rgba(0, 0, 0, 0.3) inset`,
      transformPerspective: 500,
      transformOrigin: 'left',
      rotationY: 6,
    })

    _.assign($menuItem, {
      // 設置為選取狀態
      setActive: () => {
        $menuItem.addClass('active')
        $menuItem.$_$menuCategoryTitle.highlight()
      },
      // 設置為未選取狀態
      unsetActive: () => {
        $menuItem.removeClass('active')
      },
    })

    allMenuItems.push($menuItem)
    return $menuItem
  }

  const $menuHeader = createMenuHeader()
  const $menuReceptacle = createMenuReceptacle()

  $self.append([$menuHeader, $menuReceptacle])

  _.forEach(menuGroups, (menuGroup) => {
    const {category, menus} = menuGroup
    const $menuCategory = createMenuCategory(category)
    const $menuCategoryTitle = createMenuCategoryTitle(category)

    _.assign($menuCategory, {
      $_category: category,
      $_$menuCategoryTitle: $menuCategoryTitle,
    })
    _.assign($menuCategoryTitle, {
      $_category: category,
      $_$menuCategory: $menuCategory,
    })

    $menuReceptacle.append([$menuCategoryTitle, $menuCategory])

    _.forEach(menus, (titleOption, _pageName) => {
      // Note. titleOption 可能為字串或 {title: 'xxx', abandon: true} 或 {title: 'xxx', abandon: '訊息 for 廢棄說明'}
      let title = titleOption
      let abandon = false
      if (_.isPlainObject(titleOption)) {
        title = titleOption.title
        abandon = titleOption.abandon
      }
      if (abandon) title = `${title}(${_.isString(abandon) ? abandon : '待移除'})`
      const $menuItem = createMenuItem(title, _pageName, {abandon})
      _.assign($menuItem, {
        $_category: category,
        $_title: title,
        $_pageSubject: _pageSubject,
        $_pageName: _pageName,
        $_$menuCategoryTitle: $menuCategoryTitle,
        $_$menuCategory: $menuCategory,
      })
      $menuCategory.append($menuItem)
    })
  })

  const width = 180
  const left = -10

  $self.css({
    width,
    display: 'flex',
    position: 'fixed',
    overflow: 'hidden',
    height: '85%',
    filter: 'drop-shadow(5px 5px 2px rgba(0, 0, 0, 0.2))',
    'z-index': 100,
    'flex-flow': 'column',
    left,
  }).mouseenter(() => {
    gsap.to($self, 0.3, {x: -left})
  }).mouseleave(() => {
    gsap.to($self, 0.1, {x: 0})
  }).fadeIn()

  _.assign($self, {
    // 設置已選取選單
    setActiveItem: (_pageSubject, _pageName) => {
      $self.collapseCategory() // 先縮合所有群組

      _.forEach(allMenuItems, ($item) => {
        $item.unsetActive()
        if ($item.$_pageSubject !== _pageSubject || $item.$_pageName !== _pageName) return
        $item.setActive()
        $item.$_$menuCategory.extendCategory()
      })
    },
    // 展開選單群組, 無指定時為全部
    extendCategory: (category) => {
      _.forEach(allMenuCategories, ($category) => {
        if (category && $category.$_category !== category) return
        $category.extendCategory()
      })
    },
    // 縮合指定選單群組, 無指定時為全部
    collapseCategory: (category) => {
      _.forEach(allMenuCategories, ($category) => {
        if (category && $category.$_category !== category) return
        $category.collapseCategory()
      })
    },
  })

  return $self
};// 客製化 plugin.popWindow, 用在頁面的說明
$.fn.pageTips = function (param) {
  const $self = this
  const {title = 'Tips', modalSubId = '', btnType = 'warning', tipArr = []} = param
  let rowNum = 0

  if (_.isEmpty(tipArr)) return $self.hide()

  const $targetBody = $(`<div class="tipsContent">`)
  const recursiveSetItems = (content, shiftCount = -1) => {
    if (_.isArray(content)) {
      shiftCount += 1
      for (const sub of content) {
        recursiveSetItems(sub, shiftCount)
      }
      return
    }

    for (let category of ['primary', 'secondary', 'success', 'danger', 'warning', 'info']) {
      content = content.replace(new RegExp(`<\/${category}>`, 'g'), '</span>')
      content = content.replace(new RegExp(`<${category}>`, 'g'), `<span class="text-${category}">`)
    }

    content = _.trim(content)
    if (shiftCount === 0 && content) rowNum++ // 在第0層, 且有內容時才累計行號

    const prefix = shiftCount === 0 ? `${rowNum}.` : '-'

    $targetBody.append($(`<div>${prefix} ${content || '&nbsp;'}</div>`).css({
      'margin-left': `${shiftCount}em`,
    }))
  }

  // 設置一般項目
  recursiveSetItems(tipArr)

  $self.html(title).addClass(`btn btn-sm btn-${btnType}`).css({
    'margin-left': 3, 'margin-right': 3, 'margin-bottom': 3,
  })

  $self.popWindow({
    modalId: `pageTipsModal-${modalSubId}`,
    $targetBody,
  })

  return $self
}
;// 分頁功能
$.fn.pagination = function ({total = 0, limit = 50, currentPage = 1, cb}) {
  const $self = this

  $self.html(``)

  const toInt = (num, def = 0) => {
    num = parseInt(num, 10)
    if (_.isNaN(num) || num < 1) num = def
    return num
  }
  const init = () => {
    $total.html(total)

    currentPage = $currentPage.val() || currentPage
    limit = $limit.html() || limit

    total = toInt(total)
    limit = toInt(limit, 50)
    currentPage = toInt(currentPage, 1)

    if (originLimit !== limit) {
      originLimit = limit
      currentPage = 1 // 有改過 limit, 強制改為第一頁
    }

    const totalPage = Math.ceil(total / limit)
    $totalPage.html(totalPage)

    if (currentPage > totalPage) currentPage = totalPage
    if (currentPage < 1) currentPage = 1

    $limit.html(limit)

    const currentPageSize = _.size(String(currentPage)) + 1
    $currentPage.prop(`size`, currentPageSize).val(currentPage)

    if (totalPage > 0 && currentPage > 1) {
      $prePage.addClass(`text-primary`).css({cursor: `pointer`}).off(`click`).click(() => {
        $prePage.__clickFn()
        init()
        emitCb()
      })
    } else {
      $prePage.removeClass(`text-primary`).css({cursor: `auto`}).off(`click`)
    }

    if (totalPage > 0 && currentPage !== totalPage) {
      $nextPage.addClass(`text-primary`).css({cursor: `pointer`}).off(`click`).click(() => {
        $nextPage.__clickFn()
        init()
        emitCb()
      })
    } else {
      $nextPage.removeClass(`text-primary`).css({cursor: `auto`}).off(`click`)
    }
  }
  const getPreAndSuf = ({pre, suf}) => {
    const $pre = $(`<span>`).html(pre).css({
      'padding-left': 10,
      'padding-right': 5,
    })
    const $suf = $(`<span>`).html(suf).css({
      'padding-left': 5,
      'padding-right': 10,
    }).addClass(`border-right border-info`)
    return {$pre, $suf}
  }
  const createText = ({pre, suf}) => {
    const {$pre, $suf} = getPreAndSuf({pre, suf})
    const $obj = $(`<span>`)

    $self.append([$pre, $obj, $suf])
    return $obj
  }
  const createInput = ({pre, suf}) => {
    const {$pre, $suf} = getPreAndSuf({pre, suf})
    const $obj = $(`<input type="text">`).focus(function () {
      $(this).select()
    }).keyup(function (e) {
      if (e.keyCode !== 13) return
      init()
      emitCb()
    })

    $self.append([$pre, $obj, $suf])
    return $obj
  }
  const createLink = (txt, clickFn) => {
    const $obj = $(`<a>`).html(txt).css({
      'padding-left': 10,
      'padding-right': 10,
    }).addClass(`border-right border-info`)
    $obj.__clickFn = clickFn
    $self.append($obj)
    return $obj
  }
  const emitCb = () => {
    const skip = (currentPage - 1) * limit
    cb({total, limit, currentPage, skip})
  }

  const $total = createText({pre: `總共`, suf: `筆`})
  const $totalPage = createText({pre: `共`, suf: `頁`})
  const $limit = createText({pre: `每頁`, suf: `筆`})
  const $currentPage = createInput({pre: `目前在第`, suf: `頁`})
  const $prePage = createLink(`上一頁`, () => {
    $currentPage.val(toInt($currentPage.val()) - 1)
  })
  const $nextPage = createLink(`下一頁`, () => {
    $currentPage.val(toInt($currentPage.val()) + 1)
  })

  $self.append($nextPage).css({'margin-bottom': 5})

  let originLimit = toInt(limit) // 用來比對 limit 是否有被更新

  _.assign($self, {
    // 取得目前頁數
    setCurrentPage: (num = 1) => {
      $currentPage.val(toInt(num))
    },
  })

  init()
  return $self
};// bootstrap Modal 互動式窗
$.fn.popWindow = function ({modalId, $targetBody, $targetHeader, $targetFooter}) {
  const $self = this

  $(`#${modalId}`).remove()

  const $modal = $(`<div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">`)
  const $dialog = $(`<div class="modal-dialog" role="document">`)
  const $content = $(`<div class="modal-content">`)
  const $header = $(`<div class="modal-header">`)
  const $body = $(`<div class="modal-body">`)
  const $footer = $(`<div class="modal-footer">`)
  const $closeBtn = $(`<button type="button" class="close" data-dismiss="modal" aria-label="Close"> <span aria-hidden="true">&times;</span></button>`)

  if (_.isString($targetBody)) $targetBody = $($targetBody)
  if (_.isString($targetHeader)) $targetHeader = $($targetHeader)
  if (_.isString($targetFooter)) $targetFooter = $($targetFooter)

  $self.attr(`data-toggle`, `modal`).attr(`data-target`, `#${modalId}`)

  $modal.append($dialog)
  $dialog.append($content)
  $content.append([$header, $body, $footer])
  $body.append($targetBody)
  if ($targetHeader) $header.append($targetHeader)
  if ($targetFooter) $footer.append($targetFooter)
  $header.append($closeBtn)

  $('body').append($modal)

  _.assign({
    // 隱藏視窗
    hideModal: () => {
      $closeBtn.click()
    },
  })

  return $self
};// 取得底下所有包含 id/class 的 $dom, 並寫到 domMap 中
$.fn.receptacle = function () {
  const $self = this
  const domMap = {}

  // e.g. $self 底下包含了 <div class="block"><input id="a"><input id="b">
  // domMap = {blockClass: $('.block'), a: $('#a'), b: $('#b')}

  $self.find(`[id]`).each(function () {
    const attrVal = $(this).attr('id')
    domMap[`${attrVal}`] = $(`#${attrVal}`)
  })

  $self.find(`[class]`).each(function () {
    const attrVal = $(this).attr('class')
    domMap[`${attrVal}Class`] = $(`.${attrVal}`)
  })

  _.assign($self, {
    // 取得底下所有的 $dom.val()
    getMapVal: (data = {}) => {
      _.forEach(domMap, ($d, eleName) => {
        if (!_.isFunction($d.val)) return
        const val = $d.val()
        if (val === undefined || val === '') return
        data[eleName] = val
      })
      return data
    },
    domMap: domMap,
  })

  return $self
};// 物件 top 位置被捲動到畫面外時, 產生 scroll top 按鈕
$.fn.scrollTopBtn = function ({$container = $('body')} = {}) {
  const $self = this

  const $showTopBtnOuter = $(`<div/>`).css({
    opacity: 0.8,
    position: 'fixed',
    bottom: 20,
    right: 40,
    display: 'inline-flex',
  }).hide()

  const hideBtnLength = 20
  const hideBtnRadius = hideBtnLength / 2
  const $cross = $('<div>x</div>').css({
    display: 'table-cell',
    'text-align': 'center',
    'vertical-align': 'middle',
    'line-height': 0,
    'padding-bottom': 4,
  })
  const $hideBtn = $(`<div id="hideBtnScrollTopBtn"><div>`).css({
    position: 'relative',
    display: 'table',
    width: hideBtnLength,
    height: hideBtnLength,
    bottom: hideBtnRadius,
    left: -hideBtnRadius,
    cursor: 'pointer',
    'border-radius': hideBtnRadius,
    'background-color': 'red',
  }).append($cross).click(() => {
    $showTopBtnOuter.fadeOut()
  })

  const $showTopBtn = $(`<button class="btn btn-secondary align-middle"><h3>- Scroll Top -</h3></button>`).css({
    position: 'relative',
    'box-shadow': '5px 5px 5px rgba(0, 0, 0, 0.2)',
  }).click(() => {
    const $target = ($self[0] === window) ? $('html, body') : $self
    $target.animate({scrollTop: 0})
  })

  $showTopBtnOuter.append([$showTopBtn, $hideBtn])
  $container.append($showTopBtnOuter)

  $self.scroll(() => {
    const height = $self.height()
    const top = $self.scrollTop()
    if (top > height) return $showTopBtnOuter.fadeIn()
    return $showTopBtnOuter.fadeOut()
  })

  _.assign($self, {
    scrollToTop: () => {
      $showTopBtn.click()
    },
  })

  return $self
}
;// 設置 table 的 header 排序顯示
$.fn.tableHeaderSorter = function ({
  keys = [], // 指定可以點選排序的 header 項目; e.g. ['name', 'createdAt']
  fn = {}, // 點選排序時的 cb
  sortKey = '', // 指定預設顯示升降冪的 header 項目; e.g. 'createdAt', '-createdAt'
} = {}) {
  const $self = this

  const $header = $self.find(`tr:first`)
  const statusArr = [undefined, false, true] // 升冪狀態列表
  const maxStatusIndex = statusArr.length - 1
  const info = (() => {
    let key
    let asc
    if (sortKey.indexOf('-') === 0) {
      asc = false
      key = sortKey.slice(1)
    } else if (sortKey) {
      asc = true
      key = sortKey
    }
    return {
      key,
      asc,
    }
  })()
  const getHeaderElement = (key) => {
    return $header.find(`[data-key='${key}']`)
  }

  _.forEach(keys, (key) => {
    const $title = getHeaderElement(key)
    const originalHtml = $title.html()
    let asc = (key === info.key) ? info.asc : undefined
    let statusIndex = statusArr.indexOf(asc) // 升冪狀態的 index

    const setTrHtml = () => { // 更新 header 的顯示文字
      const symbol = asc ? '↑' : (asc === false ? '↓' : '')
      const html = `${originalHtml}${symbol}`
      $title.html(html)
    }

    $title.css({cursor: 'pointer', 'text-decoration': 'underline'})
    $title.click(() => {
      // 轉換升冪狀態
      if (++statusIndex > maxStatusIndex) statusIndex = 0
      asc = statusArr[statusIndex]

      info.key = (asc !== undefined) ? $title.attr(`data-key`) : undefined
      info.asc = asc
      setTrHtml()
      fn()
    })
    setTrHtml()
  })

  _.assign($self, {
    // 取得排序值
    getSortKey: () => {
      return `${(info.asc === false) ? '-' : ''}${info.key || ''}`
    },
  })

  return $self
};// 設置 table 的 layout
$.fn.tableLayout = function (titleMap) {
  const $self = this

  const $thead = $(`<thead>`)
  const $tbody = $(`<tbody>`)
  const $headTr = $(`<tr>`)
  const $bodyTr = $(`<tr>`)

  _.forEach(titleMap, (dataKey, title) => {
    if (!dataKey) return
    $headTr.append(`<th data-key="${dataKey}">${title}</th>`)
    $bodyTr.append(`<td data-key="${dataKey}">${title}</td>`)
  })

  $self.html('').append([$thead, $tbody]).addClass(`table table-striped table-hover`)
  $thead.append($headTr).addClass(`thead-dark`)
  $tbody.append($bodyTr)

  return $self
};// 設置 table 資料列表
$.fn.tableList = function (list, cb, {addIndex = true} = {}) {
  const $self = this
  const indexSearchStr = `[data-index='true']`
  const $thead = $self.find('thead')
  const $tbody = $self.find('tbody')
  const $headTr = $thead.find(`tr:first`)
  const $bodyTr = $tbody.find(`tr:first`)

  if (addIndex) {
    $headTr.prepend($(`<th>#</th>`).css({
      width: 50,
    }))
    $bodyTr.prepend($(`<td data-index="true"></td>`))
  }
  $thead.find('th').css({
    position: 'sticky',
    top: -1,
  })
  $tbody.html(``)

  const $trList = _.map(list, (data, index) => {
    const $tr = $bodyTr.clone()
    $tr.find(indexSearchStr).html(index + 1)
    $tr.find(`[data-key]`).each((i, target) => {
      const $ele = $(target)
      const key = $ele.attr(`data-key`)

      $ele.html(``)

      let val = _.get(data, key)
      val = !_.isNil(val) ? val : ``
      if (cb) {
        const gotVal = cb({val, key, data, $tr, $ele, index})
        if (gotVal === undefined) return
        val = gotVal
      }
      $ele.html(val)
    })
    return $tr
  })

  $tbody.append($trList)

  const tl = gsap.timeline()

  tl.from($trList, {
    duration: 0.2, ease: 'back.inOut(1)', x: 100, opacity: 0, stagger: 0.04,
    clearProps: 'transform',
  })

  _.assign($self, {
    // 取得標題欄位
    getHeaderElement: (key) => {
      return $self.find('tr:first').find(`[data-key='${key}']`)
    },
  })

  return $self
}
;// 客製化 textarea 輸入欄位
$.fn.textarea = function ({title = '', width = 'auto'} = {}) {
  const $self = this

  const $title = $(`<span>${title}</span>`)
  const $textarea = $(`<textarea class="form-control" aria-label="${$title}"></textarea>`).css({})

  $self.inputGroup([$textarea], {prependItems: [$title]}).css({
    width,
  })

  _.assign($self, {
    // 取得輸入欄位
    getTextarea: () => {
      return $textarea
    },
  })

  return $self
};// 客製化時間範圍選擇
$.fn.timeRangePickers = function ({
  title = '時間區間',
  startOpt = {}, // 起始日期下拉選單的 options
  endOpt = {}, // 結束日期下拉選單的 options
  showStart = true, // 顯示起結日
  showEnd = true, // 顯示結束日
  showHour = false,
  showMinute = false,
  showSecond = false,
  defStartGetVal = '', // 如果取得開始時間值為空, 預設的值
  defEndGetVal = '', // 如果取得結束時間值為空, 預設的值
} = {}) {
  const $self = this

  const getTimeDropDown = (title, maxCount, column = 2) => {
    const dropdown = $(`<div>`)
    const timeArr = []
    for (let i = 0; i < maxCount; i++) {
      timeArr.push(_.padStart(String(i), 2, '0'))
    }
    dropdown.dropDown(timeArr, {defTitle: title, style: 'secondary', showArrow: false, column}).clickItem()
    dropdown.getBtn().css({
      'border-radius': 0,
    }).addClass('form-control')
    return dropdown
  }
  const createHourDropDown = () => {
    return getTimeDropDown('時', 24)
  }
  const createMinuteDropDown = () => {
    return getTimeDropDown('分', 60, 6)
  }
  const createSecondDropDown = () => {
    return getTimeDropDown('秒', 60, 6)
  }

  const inputStr = `<input type="text" size="10">`
  const $startDate = $(inputStr).datePicker(startOpt)
  const $startHour = createHourDropDown()
  const $startMinute = createMinuteDropDown()
  const $startSecond = createSecondDropDown()

  const $to = $(`<span>-</span>`).css({
    padding: 2,
    'background-color': 'rgba(0,0,0,0)',
    'border-color': 'rgba(0,0,0,0)',
    'border-radius': 0,
  })

  const $endDate = $(inputStr).datePicker(endOpt)
  const $endHour = createHourDropDown()
  const $endMinute = createMinuteDropDown()
  const $endSecond = createSecondDropDown()

  // 初始的開始結束日期值
  const startDateVal = $startDate.val()
  const endDateVal = $endDate.val()

  if (!showStart) {
    $startDate.hide()
    $to.hide()
  }
  if (!showEnd) {
    $endDate.hide()
    $to.hide()
  }
  if (!showHour) {
    $startHour.hide()
    $endHour.hide()
  }
  if (!showMinute) {
    $startMinute.hide()
    $endMinute.hide()
  }
  if (!showSecond) {
    $startSecond.hide()
    $endSecond.hide()
  }

  const $title = $(`<span>${title}</span>`)
  const itemArr = [$startDate, $startHour, $startMinute, $startSecond, $to, $endDate, $endHour, $endMinute, $endSecond]
  $self.inputGroup(itemArr, {prependItems: [$title]})

  _.assign($self, {
    // 取得或設置起始時間
    startDateTimeVal: (val) => {
      if (_.isNil(val)) {
        const defStartDate = defStartGetVal ? moment(defStartGetVal).format('YYYY-MM-DD') : ''
        let date = $startDate.val() || defStartDate

        if (date) { // 修正日期輸入格式
          const isValid = moment(date, 'YYYY-MM-DD', true).isValid()
          if (!isValid) date = defStartDate
        }

        $startDate.val(date)
        if (!date) return date

        let str = date + ' ' + $startHour.val() + ':' + $startMinute.val() + ':' + $startSecond.val()
        str = moment(str).toISOString()
        return str
      }
      const time = moment(val)
      $startDate.val(time.format('YYYY-MM-DD'))
      $startHour.val(time.format('HH'))
      $startMinute.val(time.format('mm'))
      $startSecond.val(time.format('ss'))
    },
    // 取得或設置結束時間
    endDateTimeVal: (val) => {
      if (_.isNil(val)) {
        let date = $endDate.val()

        if (date) { // 修正日期輸入格式
          const isValid = moment(date, 'YYYY-MM-DD', true).isValid()
          if (!isValid) date = defEndGetVal ? moment(defEndGetVal).format('YYYY-MM-DD') : ''
        }

        $endDate.val(date)
        if (!date) return defEndGetVal

        let str = date + ' ' + $endHour.val() + ':' + $endMinute.val() + ':' + $endSecond.val()
        str = moment(str).toISOString()
        return str
      }
      const time = moment(val)
      $endDate.val(time.format('YYYY-MM-DD'))
      $endHour.val(time.format('HH'))
      $endMinute.val(time.format('mm'))
      $endSecond.val(time.format('ss'))
    },
    // 清空日期時間
    resetDef: ({resetStart = true, resetEnd = true} = {}) => {
      if (resetStart) {
        $startDate.val(startDateVal)
        _.forEach([$startHour, $startMinute, $startSecond], ($dom) => {
          $dom.val('00')
        })
      }
      if (resetEnd) {
        $endDate.val(endDateVal)
        _.forEach([$endHour, $endMinute, $endSecond], ($dom) => {
          $dom.val('00')
        })
      }
    },
    getStartInput: () => {
      return $startDate
    },
    getEndInput: () => {
      return $endDate
    },
  })

  return $self
}
;// 客製浮動提示訊息
$.fn.toolTip = function (title, opt = {}) {
  const $self = this

  $self.attr({title: title}).tooltip(opt)

  return $self
};// 客製化上傳檔案功能
let index = 0
$.fn.uploadFile = function (url, {title = `選擇檔案`, btnTxt = `上傳`} = {}) {
  const $self = this

  const txt = `點擊選擇檔案`
  const fileId = `uploadFile${index++}`

  const getFile = () => {
    return $inputFile[0].files[0]
  }
  const getFilename = () => {
    const file = getFile()
    return file ? file.name : ''
  }
  const setInputFileDisplay = () => {
    const filename = getFilename()
    const newTxt = filename || txt
    $label.html(newTxt)
  }

  const $fileDiv = $(`<div class="custom-file">`)
  const $inputFile = $(`<input type="file" class="" id="${fileId}">`).css({
    width: '9rem',
  }).change(() => {
    setInputFileDisplay()
  })
  const $label = $(`<label class="custom-file-label" for="${fileId}">${txt}</label>`).css({
    overflow: 'hidden',
    height: '100%',
  })
  $fileDiv.append([$inputFile, $label])

  const $title = $(`<span>${title}</span>`)
  const $uploadBtn = $(`<button class="btn btn-primary">${btnTxt}</button>`).click(() => {
    $uploadBtn.disabled(true)

    const formData = new FormData()
    const file = getFile()
    formData.append('fileFieldName', file) // Note. 欄位名稱可以隨便取

    const suc = (res) => {
      $.global.showInfo(res)
    }
    const always = () => {
      $uploadBtn.disabled(false)
      $inputFile.val(``)
      $label.html(txt)
    }

    $.global.aj({
      method: `POST`,
      url,
      data: formData,
      processData: false,
      contentType: false,
      suc,
    }).always(always)
  })
  $self.inputGroup([$fileDiv], {prependItems: [$title], appendItems: [$uploadBtn]})

  setInputFileDisplay()

  return $self
};// 下拉選單 + input 輸入欄位
$.fn.variableInput = function (dropDownArr, {dropDownOpt} = {}) {
  const $self = this

  const $dropDown = $('<div>').dropDown(dropDownArr, {...dropDownOpt, defTitle: ''}).clickItem()
  $dropDown.find('button').css({
    'border-top-right-radius': 0,
    'border-bottom-right-radius': 0,
  })
  const $input = $('<input type="text" class="form-control">')
  $self.inputGroup([$input], {prependItems: [$dropDown]})

  _.assign($self, {
    // 取得或設置下拉選單的值
    dropDownVal: (val) => {
      return $dropDown.val(val)
    },
    // 取得或設置輸入欄位值
    inputVal: (val) => {
      if (_.isUndefined(val)) return $input.val()
      $input.val(val)
    },
    // 清除選項及填寫的值
    clean: () => {
      $dropDown.unselectAll()
      $input.val('')
    },
  })

  return $self
};// YBT 帳號身份下拉選單
$.fn.accountRoleOption = function () {
  const $self = this

  $.global.aj({
    url: `/main/account/getRoleMap`,
    data: {},
    suc: (res) => {
      const roleMap = res.roleMap
      const roles = _.map(roleMap, (chineseName, role) => {
        return {
          val: role,
          html: chineseName,
        }
      })
      const fnDropDownOpt = {
        addEmpty: true,
        defTitle: `身份`,
        style: `success`,
      }
      $self.dropDown(roles, fnDropDownOpt)
    },
  })

  return $self
}
