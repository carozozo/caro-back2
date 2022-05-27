// 客製化上傳檔案功能
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
}