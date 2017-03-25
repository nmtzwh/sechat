// send encrypted msg
for (let i=0; i<clientId.length; i++){
    if (shareKeyList.length <= i){
        // generate new shared key
        let shared = keypair.computeSecret(keyList[i].getPublicKey('hex'), 'hex', 'hex');
        let pwd = crypto.createHash('sha256').update(shared).digest();
        // push into array
        shareKeyList.push(shared);
        passwordList.push(pwd);
        // log
        console.log('shared key btw ' + socket.id.toString() + ' and '  + clientId[i].toString() + ': ' + shareKeyList[i].toString());
    }
    let cip = crypto.createCipher('aes256', passwordList[i]);
    let cipher_text = Buffer.concat([cip.update(msg), cip.final()]);

    if (clientId[i] === socket.id){
        io.to(clientId[i]).emit('chat message', cipher_text.toString('hex'));
        continue;
    }
    console.log('send from: ' + socket.id.toString() + ' to :' + clientId[i].toString());
    // receive (decipher)
    let sharedRec = keyList[i].computeSecret(keypair.getPublicKey('hex'), 'hex', 'hex');
    let pwdRec = crypto.createHash('sha256').update(sharedRec).digest();
    let decip = crypto.createDecipher('aes256', pwdRec);
    let plain_text = Buffer.concat([decip.update(Buffer(cipher_text.toString('hex'), 'hex')), decip.final()]);

    io.to(clientId[i]).emit('chat message', plain_text.toString());








var nodeCrypto = require('crypto');

var keypair0 = nodeCrypto.getDiffieHellman('modp14');

var keypair1 = nodeCrypto.getDiffieHellman('modp14');

keypair0.generateKeys();

keypair1.generateKeys();

var pub0 = keypair0.getPublicKey('hex');
var pub1 = keypair1.getPublicKey('hex');

var shared01 = keypair0.computeSecret(Buffer(pub1, 'hex')).toString('hex');
var shared10 = keypair1.computeSecret(Buffer(pub0, 'hex')).toString('hex');

var pwd = nodeCrypto.createHash('sha256').update(shared01).digest();

var cip = nodeCrypto.createCipher('aes256', pwd);

var msg = 'hello';

var en_msg =  Buffer.concat([cip.update(msg), cip.final()]);


var decip = nodeCrypto.createDecipher('aes256', pwd);
var decip = nodeCrypto.createDecipher('aes256', pwd);
[decip.update(en_msg), decip.final()]
join2Uint8Array();

var len = 64;
var dh2 = nodeCrypto.createDiffieHellman(pp)
var prime2 = dh2.getPrime()
var p2 = prime2.toString('hex')
var dh1 = nodeCrypto.createDiffieHellman(prime2)
var p1 = dh1.getPrime().toString('hex')
dh1.generateKeys()
dh2.generateKeys()
// t.equals(p1, p2, 'equal primes')
var pubk1 = dh1.getPublicKey()
var pubk2 = dh2.getPublicKey()
// t.notEquals(pubk1, pubk2, 'diff public keys')
var pub1 = dh1.computeSecret(pubk2).toString('hex')
var pub2 = dh2.computeSecret(dh1.getPublicKey()).toString('hex')
// t.equals(pub1, pub2, 'equal secrets')


function join2Uint8Array(arr){
    var res = new Uint8Array(arr[0].length + arr[1].length);
    res.set(arr[0]);
    res.set(arr[1], arr[0].length);
    return res;
}
