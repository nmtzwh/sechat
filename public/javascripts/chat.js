window.addEventListener('load', function () {
    // At first, let's check if we have permission for notification
    // If not, let's ask for it
    if (window.Notification && Notification.permission !== "granted") {
        Notification.requestPermission(function (status) {
            if (Notification.permission !== status) {
                Notification.permission = status;
            }
        });
    }
});

function createNotification(msg, tag = 'sechat notification') {
    // If the user agreed to get notified
    // Let's try to send ten notifications
    if (window.Notification && Notification.permission === "granted") {
        var n = new Notification(msg, { tag: tag });
    }

    // If the user hasn't told if he wants to be notified or not
    // Note: because of Chrome, we are not sure the permission property
    // is set, therefore it's unsafe to check for the "default" value.
    else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (status) {
            // If the user said okay
            if (status === "granted") {
                var n = new Notification(msg, { tag: tag });
            }
        });
    }

    // auto dismiss
    if (n !== undefined) {
        setTimeout(n.close.bind(n), 5000);
    }
}




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
    var keypair;
    var publicJson;
    crypto.subtle.generateKey({
        name: "ECDH",
        namedCurve: "P-384"
    },
        false,
        ["deriveKey"]
    ).then(value => {
        keypair = value;
        crypto.subtle.exportKey("jwk", keypair.publicKey).then(value => { publicJson = value; });
    });

    // form submit
    $('form').submit(function () {
        if (firstConnected) { // first initialization
            var nickname = $('#m').val();
            myself = { name: nickname, pubkey: publicJson };
            socket.emit('initialization', { name: nickname, pubkey: publicJson });
        } else {  // sending messages
            var inputVal = $('#m').val();
            if (!inputVal) {
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
                //   case ':':
                //       var inputCommand = inputVal.slice(1);
                //       switch (inputCommand){
                //           case 'exit':
                //             window.open('','_self').close();
                //             break;
                //           default:
                //             break;
                //       }
                //       $('#m').val('');
                //       return false;
                //       break;
                case '@':
                    if (inputVal.length === 1) {
                        updateCurrentChatter();
                        return false;
                    }
                    message['type'] = 'private';
                    message['from'] = myself['name'];
                    var ispace = inputVal.indexOf(' ');
                    if (ispace > -1) {
                        message['to'] = inputVal.slice(1, ispace);
                        var toMsg = inputVal.slice(ispace + 1);
                    } else {
                        promptMessage('Please enter some message, seperated by white space. ');
                        return false;
                    }
                    if (toMsg === '') {
                        promptMessage('Please enter some message, seperated by white space. ');
                        return false;
                    }
                    // find user and encrypt
                    for (var c of clientList) {
                        if (c.name === message['to']) {
                            encryptMessage(c['pwd'], toMsg).then(en_msg => { message['en_msg'] = en_msg; });
                        }
                    }
                    // user not found
                    if (message.en_msg === undefined) {
                        promptMessage('User offline! ');
                        $('#m').val('');
                        return false;
                    }
                    addMessage({ from: myself.name, to: message['to'], msg: toMsg });
                    break;
                default:
                    message['type'] = 'public';
                    message['from'] = myself['name'];
                    message['data'] = [];
                    for (let c of clientList) {
                        encryptMessage(c['pwd'], inputVal).then(encrypted => {
                            var d = {};
                            d['to'] = c['name'];
                            d['en_msg'] = encrypted;
                            message['data'].push(d);
                        });
                        //   console.log('message ' + d.to);
                    }
                    addMessage({ from: myself.name, to: 'all', msg: inputVal });
            }
            sleep(200).then(()  => { socket.emit('chat message', message); });
        }
        // reset input area
        $('#m').val('');
        return false;
    });

    // initialization returned
    socket.on('initialization', async function (res) {
        if (res['msg'] === 'sucess') {
            // confirm logged in
            firstConnected = false;
            // other online users and generate shared secret
            clientList = clientList.concat(res['clientList']);
            for (let c of clientList) {
                c['pwd'] = await createSharedPwd(c['pubkey']);
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

        } else {
            promptMessage(res['msg']);
        }
    });

    // new user presented
    socket.on('new user', async function (client) {
        createSharedPwd(client['pubkey']).then(shared => {
            client['pwd'] = shared;
            clientList.push(client);
        });
        updateCurrentChatter(client.name, 'new');
    });

    // delete disconnected user
    socket.on('delete user', function (name) {
        var index = findContactIndex(clientList, 'name', name);
        clientList.splice(index, 1);
        // console.log(clientList.length);
        updateCurrentChatter(name, 'del');
    });

    // chat message returned
    socket.on('chat message', async function (data) {
        var from = data['from'];
        decryptMeseage(from, data['en_msg']).then(msg => {
            // add message to pannel
            var response = { from: from, to: data['to'], msg: msg };
            createNotification('New message from ' + from + ': ' + msg.slice(0, 20));
            addMessage(response);
        });
    });

    // update online user list
    function updateCurrentChatter(user = undefined, type = undefined) {
        var divPro = $('<div>').addClass('col-1-1 msg-prompt');
        // new user or deleted user 
        if (user !== undefined) {
            if (type === 'new') {
                divPro.append($('<span>').text(user + ' has joined the chat. '));
            } else {
                divPro.append($('<span>').text(user + ' has left the chat. '));
            }
        }
        // console.log('current user ' + 'user');
        var infoSpan = $('<span>').text('CURRENT ONLINE: ');
        divPro.append(infoSpan);
        // loop users
        for (var user of clientList) {
            divPro.append($('<span>').text(user.name).addClass('userspan'));
        }
        $('#messages').append(divPro);
        updateMessageList();
    };

    // update message list when received
    function updateMessageList() {
        var elem = document.getElementById('messages');
        elem.scrollTop = elem.scrollHeight;
    };

    function addMessage(data) {
        // from who to who information
        var divInfo = $('<div>').append($('<span>').text(data.from.slice(0, 8) + ' -> ' + data.to.slice(0, 5) + ' % ')).addClass('col-3-12 msg-info');
        // message plain text or markdown image
        var str = data.msg;
        if (str.slice(0, 2) === '![') {
            var imgurl = str.match(/((http[s]?):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.\%]+)/)[0];
            var divContent = $('<div>').append($('<img>').attr('src', imgurl)).addClass('col-9-12 msg-content');
        } else {
            var divContent = $('<div>').append($('<span>').text(data.msg)).addClass('col-9-12 msg-content');
        }
        $('#messages').append(divInfo);
        $('#messages').append(divContent);
        updateMessageList();
    }

    async function sleep(ms) {
        await new Promise(r => setTimeout(r, ms));
    }

    // encryption
    async function createSharedPwd(pubkey) {
        let pub = await crypto.subtle.importKey("jwk",
            pubkey,
            {
                name: "ECDH",
                namedCurve: "P-384"
            },
            true, []);
        return await crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: pub
            },
            keypair.privateKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async function encryptMessage(pwd, msg) {
        let enc = new TextEncoder();
        let encoded = enc.encode(msg);
        let iv = crypto.getRandomValues(new Uint8Array(12));

        let ciphertext = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            pwd,
            encoded
        );
        // console.log(cip.update(msg));
        return { 'iv': Array.from(iv), 'content': ciphertext };
    }

    // decryption
    async function decryptMeseage(from, en_msg) {
        let cFrom = findContact(clientList, 'name', from);
        let deciphertext = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: Uint8Array.from(en_msg['iv'])
            },
            cFrom['pwd'],
            en_msg['content']
        );

        let dec = new TextDecoder();
        return dec.decode(deciphertext);
    }

    // find object in array by its values
    function findContact(objectList, property, value) {
        var isContact = function (object) {
            return object[property] === value;
        }
        return objectList.find(isContact);
    }
    // find object in array by its values
    function findContactIndex(objectList, property, value) {
        var isContact = function (object) {
            return object[property] === value;
        }
        return objectList.findIndex(isContact);
    }

    function promptMessage(msg) {
        // generate list item
        var tempSpan = $('<span>').text(msg);
        var divPro = $('<div>').append(tempSpan).addClass('col-1-1 msg-prompt');
        $('#messages').append(divPro);
        updateMessageList();
    }

    function promptHelpMessage(msg) {
        // generate list item
        promptMessage('+ Type \'?\' for help');
        promptMessage('+ Type \'@\' for current online users');
        promptMessage('+ Type \'@name <messages>\' for private message');
        promptMessage('+ Type anything for public message');
        promptMessage('+ Message \'![image_name](image_url)\' for sending images');
    }

    $('#message-wrap').on("click", function () {
        $('#input-wrap form input').focus();
    });

});
