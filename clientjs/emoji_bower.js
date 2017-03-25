var emoji = require ? require('emoji-parser') : window.emojiParser;

function parseEmoji(str){
    return emoji(str);
}
