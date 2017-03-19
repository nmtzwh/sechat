  // functions in communication
  $(function () {
    // connected and broadcast this client name and public key
    var firstConnected = true;

    // init values
    var Buffer = require('buffer').Buffer;
    var socket = io();
    var clientList = [];
    var myself;

    // generate key pair
    var nodeCrypto = require('crypto');
    var keypair = nodeCrypto.getDiffieHellman('modp14');
    keypair.generateKeys();
    // console.log(keypair.getPublicKey().toString('hex'));

    // form submit
    $('form').submit(function(){
      if (firstConnected){ // first initialization
          var nickname = $('#m').val();
          myself = {name: nickname, pubkey: keypair.getPublicKey('hex')};
          socket.emit('initialization', {name: nickname, pubkey: keypair.getPublicKey('hex')} );
      }else{  // sending messages
          var inputVal = $('#m').val();
          if (!inputVal){
              return false;
          }
          var message = {};
          switch (inputVal[0]) {
              case '?':
                  message['type'] = 'command';
                  promptHelpMessage();
                  $('#m').val('');
                  return false;
                  break;
              case '@':
                  if (inputVal.length === 1){
                      updateCurrentChatter();
                      return false;
                  }
                  message['type'] = 'private';
                  message['from'] = myself['name'];
                  var ispace = inputVal.indexOf(' ');
                  if (ispace > -1){
                    message['to'] = inputVal.slice(1, ispace);
                    var toMsg = inputVal.slice(ispace+1);
                  }else{
                    promptMessage('Please enter some message, seperated by white space. ');
                    return false;
                  }
                  // find user and encrypt
                  for (var c of clientList){
                      if (c.name === message['to']){
                        var en_msg = encryptMessage(c['pwd'], toMsg);
                        message['en_msg'] = en_msg;
                      }
                  }
                  // user not found
                  if (message.en_msg === undefined){
                      promptMessage('User offline! ');
                      $('#m').val('');
                      return false;
                  }
                  addMessage({from: myself.name, to: message['to'], msg: toMsg});
                  break;
              default:
                  message['type'] = 'public';
                  message['from'] = myself['name'];
                  message['data'] = [];
                  for (var c of clientList){
                      var d = {};
                      d['to'] = c['name'];
                      d['en_msg'] =encryptMessage(c['pwd'], inputVal);
                      message['data'].push(d);
                    //   console.log('message ' + d.to);
                  }
                  addMessage({from: myself.name, to: 'all', msg: inputVal});
          }
          socket.emit('chat message', message);
      }
      // reset input area
      $('#m').val('');
      return false;
    });

    // initialization returned
    socket.on('initialization', function(res){
        if (res['msg'] === 'sucess'){
            // confirm logged in
            firstConnected = false;
            // other online users and generate shared secret
            clientList = clientList.concat(res['clientList']);
            // console.log(clientList.length);
            for (var c of clientList){
                c['pwd'] = createSharedPwd(c['pubkey']);
            }
            // log my id in server
            // myself['id'] = res['id'];
            // console.log(myself['id']);
            // welcome message
            promptMessage('Welcome ' + myself['name'] + ' to the secure chat room! ');
            $('#input-wrap .msg-info span').text(myself['name'] + ' %');
            // show online users
            promptHelpMessage();
            updateCurrentChatter();
        }else{
            promptMessage(res['msg']);
        }
    });

    // user user presented
    socket.on('new user', function(client){
        client['pwd'] = createSharedPwd(client['pubkey']);
        clientList.push(client);
        // console.log(clientList.length);
        updateCurrentChatter(client.name, 'new');
    });

    // delete disconnected user
    socket.on('delete user', function(name){
        var index = findContactIndex(clientList, 'name', name);
        clientList.splice( index , 1);
        // console.log(clientList.length);
        updateCurrentChatter(name, 'del');
    });

    // chat message returned
    socket.on('chat message', function(data){
      var from = data['from'];
      var msg = decryptMeseage(from, data['en_msg']);
      // add message to pannel
      var data = {from: from, to: data['to'], msg: msg};
      addMessage(data);
    });

    // update online user list
    function updateCurrentChatter(user=undefined, type=undefined){
        var divPro = $('<div>').addClass('col-1-1 msg-prompt');
        // new user or deleted user 
        if (user != undefined){
            if (type === 'new'){
                divPro.append($('<span>').text(user + ' has joined the chat. '));
            }else{
                divPro.append($('<span>').text(user + ' has left the chat. '));
            }
        }
        // console.log('current user ' + 'user');
        var infoSpan = $('<span>').text('CURRENT ONLINE: ');
        divPro.append(infoSpan);
        // loop users
        for (var user of clientList){
            divPro.append($('<span>').text(user.name ).addClass('userspan'));
        }        
        $('#messages').append(divPro);
        updateMessageList();
    };

    // update message list when received
    function updateMessageList(){
        var elem = document.getElementById('messages');
        elem.scrollTop = elem.scrollHeight;
    };

    function addMessage(data){
      // generate list item
      var divInfo = $('<div>').append($('<span>').text(data.from.slice(0,8) + ' -> ' + data.to.slice(0,5) + ' % ')).addClass('col-3-12 msg-info');
      var divContent = $('<div>').append($('<span>').text(data.msg)).addClass('col-9-12 msg-content');
      $('#messages').append(divInfo);
      $('#messages').append(divContent);
      updateMessageList();
    }

    // encryption
    function createSharedPwd(pubkey){
        var shared = keypair.computeSecret(Buffer(pubkey,'hex')).toString('hex');
        return  nodeCrypto.createHash('sha256').update(shared).digest();
    }
    function encryptMessage(pwd, msg){
        var cip = nodeCrypto.createCipher('aes256', pwd);
        // console.log(cip.update(msg));
        return Buffer.concat([cip.update(msg), cip.final()]).toString('hex');
    }
    // decryption
    function decryptMeseage(from, en_msg){
        var cFrom = findContact(clientList, 'name', from);
        var decip = nodeCrypto.createDecipher('aes256', cFrom['pwd']);
        return  Buffer.concat([decip.update(Buffer(en_msg, 'hex')), decip.final()]).toString();
    }

    // find object in array by its values
    function findContact(objectList, property, value){
        var isContact = function(object){
            return object[property] === value;
        }
        return objectList.find(isContact);
    }
    // find object in array by its values
    function findContactIndex(objectList, property, value){
        var isContact = function(object){
            return object[property] === value;
        }
        return objectList.findIndex(isContact);
    }

    function promptMessage(msg){
        // generate list item
        var tempSpan = $('<span>').text(msg);
        var divPro = $('<div>').append(tempSpan).addClass('col-1-1 msg-prompt');
        $('#messages').append(divPro);
        updateMessageList();
    }

    function promptHelpMessage(msg){
        // generate list item
        promptMessage('+ Type \'?\' for help');
        promptMessage('+ Type \'@\' for current online users');
        promptMessage('+ Type \'@name <messages>\' for private message');
        promptMessage('+ Type anything for public message');
    }

    $('#message-wrap').on( "click", function() {
        $('#input-wrap form input').focus();
    });

  });
