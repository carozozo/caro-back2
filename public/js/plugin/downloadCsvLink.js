// 下載 csv 連結
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
}