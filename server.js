var http = require('http'),
  express = require('express'),
  socketio = require('socket.io'),
  dl = require('./lib/delivery.server'),
  nano = require('./lib/nanp-script'),
  path = require('path'),
  Excel = require('exceljs'),
  config = require('./config'),
  constant = require('./constant'),
  fs = require('fs');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);
router.use(express.static(path.resolve(__dirname, 'html')));

io.sockets.on('connection', function (socket) {
  delivery = dl.listen(socket);
  delivery.on('receive.success', function (file) {
    var filepath = path.join(config.root_folder, config.received_xlsx);
    var number = Math.random().toString().split('.').join("");
    var dateTime = new Date().getTime();
    var filename = number + "_" + dateTime + ".xlsx";
    filepath = filepath + filename;
    fs.writeFile(filepath, file.buffer, function (err) {
      console.log("err");
      console.log(err);
      if (err) {
        delivery.sendMsg({ success: false, message: constant.ERROR_SAVE_FILE });
      } else {
        var workbook = new Excel.Workbook();
        workbook.xlsx.readFile(filepath)
          .then(function () {
            var numbers = [];
            workbook.eachSheet(function (worksheet, sheetId) {
              worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
                console.log(row.values[1]);
                if (rowNumber !== 1 && row.values[1]) {
                  numbers.push(row.values[1]);
                }
              });
            });

            if (numbers.length > 0) {
              delivery.sendMsg({ success: true, message: constant.SUCCESS_READ_FILE });
              var respo = nano.readFile();
              respo.then(function (result) {

                var workbook = new Excel.Workbook();
                var sheet = workbook.addWorksheet('region');
                var worksheet = workbook.getWorksheet('region');
                worksheet.columns = [
                  { header: 'Phone Number', key: 'phone', width: 10 },
                  { header: 'Region', key: 'region', width: 10 },
                ];
                var values = nano.compareNumber(numbers);
                values.unshift("Region");
                numbers.unshift("Phone Number");
                worksheet.getColumn('phone').values = numbers;
                worksheet.getColumn('region').values = values;
                var filepath = path.join(config.root_folder, config.sent_xlsx);
                var filename = Math.random().toString().split('.').join("") + "_" + new Date().getTime() + ".xlsx";
                filepath = filepath + filename;

                workbook.xlsx.writeFile(filepath).then(function () {
                  delivery.send({
                    name: filename,
                    path: filepath,
                    params: {}
                  });
                  delivery.on('send.success', function (file) {
                    delivery.sendMsg({ success: true, message: constant.SUCCESS_SENT_FILE });
                  });
                });
                
              }, function (err) {
                console.log('err');
                console.log(err);
                delivery.sendMsg({ success: false, message: constant.ERROR_READ_FILE });
              })
            } else {
              delivery.sendMsg({ success: false, message: constant.ERROR_EMPTY_FILE });
            }
          });
      }
    });
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
