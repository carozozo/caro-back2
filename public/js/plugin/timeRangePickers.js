// 客製化時間範圍選擇
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
