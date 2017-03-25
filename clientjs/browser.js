var nodeCrypto = require('crypto');

var keypair0 = nodeCrypto.getDiffieHellman('modp14');

var keypair1 = nodeCrypto.getDiffieHellman('modp14');

keypair0.generateKeys();

keypair1.generateKeys();

var pub0 = keypair0.getPublicKey();
var pub1 = keypair1.getPublicKey();

var shared01 = keypair0.computeSecret(pub1).toString('hex');
var shared10 = keypair1.computeSecret(pub0).toString('hex');

console.log(shared01);
console.log(shared10);

var pwd = nodeCrypto.createHash('sha256').update(shared01).digest();

console.log('pwd: ' + pwd.toString('hex'));

var cip = nodeCrypto.createCipher('aes256', pwd);

var msg = 'hello';

var en_msg =  Buffer.concat([cip.update(msg), cip.final()]);

console.log(en_msg.toString('hex'));

var decip = nodeCrypto.createDecipher('aes256', pwd);

var res = Buffer.concat([decip.update(en_msg), decip.final()]);

console.log(res.toString());

// var decip = nodeCrypto.createDecipher('aes256', pwd);
// var decip = nodeCrypto.createDecipher('aes256', pwd);
// [decip.update(en_msg), decip.final()]
// join2Uint8Array();
// var nodeCrypto = require('crypto');
//
// var keypair0 = nodeCrypto.getDiffieHellman('modp14');
//
// var keypair1 = nodeCrypto.getDiffieHellman('modp14');
//
// keypair0.generateKeys();
//
// keypair1.generateKeys();
//
// var pub0 = keypair0.getPublicKey();
// var pub1 = keypair1.getPublicKey();
//
// var shared01 = keypair0.computeSecret(pub1).toString('hex');
// var shared10 = keypair1.computeSecret(pub0).toString('hex');
//
// var pwd = nodeCrypto.createHash('sha256').update(shared01).digest();
//
// var cip = nodeCrypto.createCipher('aes256', pwd);
//
// var msg = 'hello';
//
// var en_msg =  Buffer.concat([cip.update(msg), cip.final()]);
//
//
// var decip = nodeCrypto.createDecipher('aes256', pwd);
// var decip = nodeCrypto.createDecipher('aes256', pwd);
// [decip.update(en_msg), decip.final()]
// join2Uint8Array();
