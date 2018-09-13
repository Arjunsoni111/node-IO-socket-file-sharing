$(function () {
  var socket = io.connect('http://arjunsoniserver.com:5001');

  socket.on('connect', function () {
    var delivery = new Delivery(socket);

    delivery.on('delivery.connect', function (delivery) {
      
      $("#submit").click(function (evt) {
        var ext = $("#uploadFile").val().split('.').pop().toLowerCase();
        if (ext == "xlsx") {
          var file = $("#uploadFile")[0].files[0];
          delivery.send(file);
          evt.preventDefault();
        } else {
          $('.downloadLink').hide();
          $('.success').hide();
          $('.error').show();
          $('.error').html('file select xlsx file only.');
        }

      });
      delivery.on('send.success', function (fileUID) {
        $("#uploadFile").val('');
        console.log("file was successfully sent.");
      });
      delivery.on('send.msg', function (msg) {
        $("#uploadFile").val('');
        if (msg.success == true) {
          $('.error').hide();
          $('.success').show();
          $('.success').html(msg.message);
        } else {
          $('.downloadLink').hide();
          $('.success').hide();
          $('.error').show();
          $('.error').html(msg.message);
        }
      });
    });



    delivery.on('delivery.connect', function (delivery) {
      delivery.on('receive.start', function (fileUID) {
        console.log('receiving a file!');
      });
      delivery.on('receive.success', function (file) {
        var data = file.dataURL();
        console.log(file.name);
        $('.downloadLink').show();
        $('.downloadLink').attr('href', data);
      });
    });
  });
});