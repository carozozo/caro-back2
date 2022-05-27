// 設置 table 的 layout
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
}