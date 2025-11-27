const fs = require('fs');
const title =
  'Hung Hutech - H\u1ec7 th\u1ed1ng Qu\u1ea3n l\u00fd Nh\u00e2n s\u1ef1';
const body =
  'Xin \u1ed7i, \u1ee9ng d\u1ee5ng Hung Hutech y\u00eau c\u1ea7u JavaScript \u0111\u1ec3 ho\u1ea1t \u0111\u1ed9ng. Vui l\u00f2ng b\u1eadt JavaScript trong tr\u00ecnh duy\u1ec7t.';
const html = `<!DOCTYPE html>\n<html lang=\"vi\">\n  <head>\n    <meta charset=\"utf-8\">\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">\n    <link rel=\"icon\" href=\"/favicon.ico\">\n    <title>${title}</title>\n  </head>\n  <body>\n    <noscript>\n      <strong>${body}</strong>\n    </noscript>\n    <div id=\"app\"></div>\n    <!-- built files will be auto injected -->\n  </body>\n</html>\n`;
fs.writeFileSync('public/index.html', html, 'utf8');
