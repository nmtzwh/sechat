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
+ [crypto-browserify](https://github.com/crypto-browserify/crypto-browserify) for diffie-hellman key exchange and aes encryption.

## todo list

- [ ] multiple chat rooms
- [ ] connection fail problem (unstable network)
- [x] browser notifications
- [x] mobile friendly design (font size & screen size)
- [ ] multi-line inputs
- [x] send/receive images (url)
- [ ] send/receive files (security concerns)
- [ ] custom themes
- [x] add emoji support ([emoji-parser](https://github.com/frissdiegurke/emoji-parser))
- [ ] simplify/minify js bundle (`browserify -t debowerify  clientjs/chat.js -o public/javascripts/chat_new.js`)
