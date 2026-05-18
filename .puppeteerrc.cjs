const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // റെൻഡറിലെ റാം ലാഭിക്കാൻ വേണ്ടി കാഷെ ഫോൾഡർ സെറ്റ് ചെയ്യുന്നു
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
