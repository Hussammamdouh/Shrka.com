const { Parser } = require('json2csv');

function exportToCsv(res, filename, data, fields) {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'CSV export failed', error: err.message });
  }
}

module.exports = { exportToCsv }; 