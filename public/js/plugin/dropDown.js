// 客製化下拉選單
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
