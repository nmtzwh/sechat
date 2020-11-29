# sechat

Demonstration of client-to-client instant message website. http://zengwh.com/chat/

## installation

```bash
npm install
node app.js
```

## techniques

+ [socket.io](https://socket.io/) for client-server io.
+ [express](https://expressjs.com/) for web server.
+ [Crypto Web API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto) for diffie-hellman key exchange and aes encryption.

## todo list

- [ ] multiple chat rooms
- [ ] connection fail problem (unstable network)
- [x] browser notifications
- [ ] mobile friendly design (font size & screen size)
- [ ] multi-line inputs
- [x] send/receive images (url) 
- [ ] send/receive files (security concerns)
- [ ] custom themes
