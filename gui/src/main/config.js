const path = require('path');
const isProduction = process.env.NODE_ENV !== "development";

export default {
  isProduction: isProduction,
  iconPath: path.resolve(__dirname, 'icon.ico'),
  savePath: path.resolve(__dirname, 'jobs'),
  api_url_base_64: isProduction ?
    "https://api.cloudwaitress.com/printing/client/order-to-pdf" :
    "http://localhost:3010/printing/client/order-to-pdf",
  api_url_ably_auth: isProduction ?
    "https://api.cloudwaitress.com/printing/client/token-request" :
    "http://localhost:3010/printing/client/token-request",
}