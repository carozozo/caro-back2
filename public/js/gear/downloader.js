// 一些下載的基本功能
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
}