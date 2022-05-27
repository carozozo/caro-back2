// 下載 csv 下拉選單
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
}