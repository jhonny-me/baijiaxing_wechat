const surnames = require('./surnames'); // 包含所有姓氏的数组

function getRandomThirtySurnames() {
    return surnames.sort(() => 0.5 - Math.random()).slice(0, 30);
}

module.exports = getRandomThirtySurnames;
