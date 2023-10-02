


function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}


function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

function generateTableRow(
  doc,
  y,
  item,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateTableRowSales(
  doc,
  y,
  item,
  quantity,
  userid,
  date,
  lineTotal
) {
  doc
    .fontSize(6)
    .text(item, 50, y)
    .text(quantity, 150, y,{ width: 90, align: "right" })
    .text(userid, 225, y, { width: 90, align: "right" })
    .text(date, 325, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

module.exports = {
  formatDate,
  generateHr,
  generateTableRow,
  generateTableRowSales
}