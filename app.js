const http = require('http');
const https = require('https');
const url = require('url');
const { google } = require('googleapis');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const { Buffer } = require('buffer');




const cors = require('cors');

require('dotenv').config();
/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 */
const oauth2Client = new google.auth.OAuth2(
 process.env.CLIENTID,
 process.env.CLIENTSECRET,
 "https://testgoogleapi-production.up.railway.app/oauth2"
);

// Access scopes for read-only Drive activity.
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly \ https://www.googleapis.com/auth/drive.metadata.readonly'
];
/* Global variable that stores user credential in this code example.
 * ACTION ITEM for developers:
 *   Store user's refresh token in your data store if
 *   incorporating this code into your real app.
 *   For more information on handling refresh tokens,
 *   see https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
 */
let userCredential = null;

async function main() {
  const app = express();

  app.use(session({
    secret: 'your_secure_secret_key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
  }));

  app.use(cors());



  let credentialUserSaved;

  // Example on redirecting user to Google's OAuth 2.0 server.
  app.get('/', async (req, res) => {
    // Generate a secure random state value.
    const state = crypto.randomBytes(32).toString('hex');
    // Store state in the session
    req.session.state = state;

    // Generate a url that asks permissions for the Drive activity scope
    const authorizationUrl = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      /** Pass in the scopes array defined above.
        * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
      scope: scopes,
      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,
      // Include the state parameter to reduce the risk of CSRF attacks.
      state: state
    });

    res.redirect(authorizationUrl);
  });

  // Receive the callback from Google's OAuth 2.0 server.
  app.get('/oauth2', async (req, res) => {

    let mensajes = [];
    // Handle the OAuth 2.0 server response
    let q = url.parse(req.url, true).query;

    if (q.error) { // An error response e.g. error=access_denied
      console.log('Error:' + q.error);
    
    } else { // Get access and refresh tokens (if access_type is offline)
      let { tokens } = await oauth2Client.getToken(q.code);
      oauth2Client.setCredentials(tokens);

      /** Save credential to the global variable in case access token was refreshed.
        * ACTION ITEM: In a production app, you likely want to save the refresh token
        *              in a secure persistent database instead. */
      userCredential = tokens;
     console.log(tokens, "tokens")
     console.log(userCredential, "userCredential");
    credentialUserSaved = userCredential;
    // res.json({credential : userCredential})

         
      // Example of using Gmail API to list messages.
     const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    }, (err, response) => {
    
    if(err){

    console.log('The API returned an error: ' + err);

    }else{



    const messages = response.data.messages;
    if (messages.length) {
        console.log('Messages:');
        console.log(messages);
        for(let i = 0; i < 4; i++){
        console.log(`${messages[i].id} id del mensaje`);

        gmail.users.messages.get({
        userId: 'me',
        id: messages[i].id,
        format: 'full'
        },(err,finalRes)=>{

          if(err){
            console.log("any error has happend")
          }else{
           
            const headers = finalRes.data.payload.headers;
            const sender = headers.find(header => header.name === 'From').value;
            const subject = headers.find(header => header.name === 'Subject').value;
            const date = headers.find(header => header.name === 'Date').value;
            const body = finalRes.data.payload.body;
            const snippet = finalRes.data.snippet;
            let finalBody = "";
            console.log(body)

            if(body.data){
            const decodedBody = Buffer.from(body.data, 'base64').toString();
            console.log('Cuerpo:', decodedBody);
            finalBody = decodedBody;
            }
            console.log(finalRes, "el mensaje")

            let masterMessage = {
              remitente : sender,
              fecha : date,
              asunto : subject,
              descripcion : snippet,
              Cuerpo : finalBody
            }

            console.log(masterMessage,"real message")
            mensajes.push(masterMessage);
          }

        })


      }

    } else {
      console.log('No messages found.');
    }
 

 

  }
   
   setTimeout(()=>{
    
    console.log(mensajes, "los mensajes")
    res.json({mensajes : mensajes, tokens : credentialUserSaved});

   },9000);
   
});



      
      // res.json({tokens : tokens, userCredential : userCredential});

      // Example of using Google Drive API to list filenames in user's Drive.
      // const drive = google.drive('v3');
      // drive.files.list({
      //   auth: oauth2Client,
      //   pageSize: 10,
      //   fields: 'nextPageToken, files(id, name)',
      // }, (err1, res1) => {
      //   if (err1) return console.log('The API returned an error: ' + err1);
      //   const files = res1.data.files;
      //   if (files.length) {
      //     console.log('Files:');
      //     files.map((file) => {
      //       console.log(`${file.name} (${file.id})`);
      //     });
      //   } else {
      //     console.log('No files found.');
      //   }
      // });
    }

  });

  app.get('/messages', async (req,res)=>{
    

    let { tokens } = await oauth2Client.getToken({refresh_token: '1//06XHhL6ozkX_iCgYIARAAGAYSNwF-L9IriCWnwyequEU6kME_ZDxpgF8F1fhM9jFkv4U4hSkoGe-ctjkNZeqAMbf44VSdMFHpPtQ'});
    oauth2Client.setCredentials(tokens);

    let mensajes = [];

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    }, (err, response) => {
    
    if(err){

    console.log('The API returned an error: ' + err);

    }else{



    const messages = response.data.messages;
    if (messages.length) {
        console.log('Messages:');
        console.log(messages);
        for(let i = 0; i < 4; i++){
        console.log(`${messages[i].id} id del mensaje`);

        gmail.users.messages.get({
        userId: 'me',
        id: messages[i].id,
        format: 'full'
        },(err,finalRes)=>{

          if(err){
            console.log("any error has happend")
          }else{
           
            const headers = finalRes.data.payload.headers;
            const sender = headers.find(header => header.name === 'From').value;
            const subject = headers.find(header => header.name === 'Subject').value;
            const date = headers.find(header => header.name === 'Date').value;
            const body = finalRes.data.payload.body;
            const snippet = finalRes.data.snippet;
            let finalBody = "";
            console.log(body)

            if(body.data){
            const decodedBody = Buffer.from(body.data, 'base64').toString();
            console.log('Cuerpo:', decodedBody);
            finalBody = decodedBody;
            }
            console.log(finalRes, "el mensaje")

            let masterMessage = {
              remitente : sender,
              fecha : date,
              asunto : subject,
              descripcion : snippet,
              Cuerpo : finalBody
            }

            console.log(masterMessage,"real message")
            mensajes.push(masterMessage);
          }

        })


      }

    } else {
      console.log('No messages found.');
    }
 

 

  }
   
     setTimeout(()=>{
    
       console.log(mensajes, "los mensajes")
      res.json({mensajes : mensajes});

       },9000);
   
    });



  });

  // Example on revoking a token
  app.get('/revoke', async (req, res) => {
    // Build the string for the POST request
    let postData = "token=" + userCredential.access_token;

    // Options for POST request to Google's OAuth 2.0 server to revoke a token
    let postOptions = {
      host: 'oauth2.googleapis.com',
      port: '443',
      path: '/revoke',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // Set up the request
    const postReq = https.request(postOptions, function (res) {
      res.setEncoding('utf8');
      res.on('data', d => {
        console.log('Response: ' + d);
      });
    });

    postReq.on('error', error => {
      console.log(error)
    });

    // Post the request with data
    postReq.write(postData);
    postReq.end();
  });


  const server = http.createServer(app);
  server.listen(process.env.PORT || 80);
}
main().catch(console.error);