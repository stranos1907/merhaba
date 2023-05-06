// const {google} = require('googleapis');
// const config = require('../../config');


// const auth = new google.auth.GoogleAuth({
//   keyFile: './credentials.json',
//   scopes: ['https://www.googleapis.com/auth/androidpublisher'],
// });
// const androidpublisher = google.androidpublisher('v3');
const packageName = 'com.flortin.app';

function validatePurchase(productId, purchaseToken) {
  return new Promise(async (resolve, reject) => {
    resolve(true)
    // try {
    //   const client = await auth.getClient();
    //   const res = await androidpublisher.purchases.products.get({
    //     packageName,
    //     productId,
    //     token: purchaseToken,
    //     auth: client,
    //   });
    //   console.log(res.data);
    //   resolve(res.data);
    // } catch (err) {
    //     console.log(err);
    //   resolve(null);
    // }
  });
}

module.exports = validatePurchase;
