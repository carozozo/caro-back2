// 縮短顯示 table 中的欄位內容
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
}