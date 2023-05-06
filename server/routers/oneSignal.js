
const OneSignal = require('onesignal-node');
const request = require('request');
//one signal config

const client = new OneSignal.Client('2473e98f-2db7-4273-b12d-e8475c34fa6e', 'OWJkY2I0NDgtMWMyZC00ZDdlLWFhMmMtMTMxNTYzZWM5ODNi');
//one signal client

function imageUrlToBase64(url) {
  return new Promise((resolve, reject) => {
      request({ url, encoding: null }, (error, response, body) => {
          if (error || response.statusCode !== 200) {
              reject(error || new Error(`Failed to download image from ${url}`));
          } else {
              const base64Image = Buffer.from(body, 'binary').toString('base64');
              resolve(base64Image);
          }
      });
  });
}


async function sendNotification(params) {

  //lorem piksum 256x256
  const notification = {
      contents: {
          en: params.message
      },
      headings: {
          'en': params.title
        },
      include_player_ids: [params.ftoken]
  };

  //console.log(notification);
  client.createNotification(notification).then(response => {
      //console.log(response);
  }).catch(e => {
      console.log(e);
  });
}

function sendNotificationToAll(params) {
    //one signal notification
    
    const notification = {
        contents: {
            'en': params.desc
          },
          headings: {
            'en': params.title
          },
          included_segments: [
            "Subscribed Users"
          ],
    }

    client.createNotification(notification).then(response => {
      //  console.log(response);
    }
    ).catch(e => {
        console.log(e);
    });
}


module.exports = {sendNotification , sendNotificationToAll}