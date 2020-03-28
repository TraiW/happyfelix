'use strict';
const db = require('./queries')
const queries = require('./dbqueries')
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const req  = require('request') ;
const request = require('request');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const PORT = process.env.APP_PORT;


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
const env = process.env.NODE_ENV || 'development';
console.log("=> Environement app : "+env)

// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => {
  if (env == 'development'){
    console.log(` => Server running at: http://localhost:${PORT}/`);

  }else{
    console.log(`Server running at: ${env}`);
  }
  console.log(' => webhook started and currently listening');
});
app.get('/', (req, res) => {
  res.send({ message: 'endpoint working' });
});

 //***************************************************/ 
//**************************DB methods****************/
app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.get('/users/psid_number/:id', db.getUserByPSID)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)
app.delete('/users/psid_number/:id', db.deleteUserByPSID)
 //***************************************************/

//  const API_AI_TOKEN = "1c2a980e0d8d4aea98f8ce9fc3202436";
//  const apiAiClient = require("apiai")(API_AI_TOKEN);

//  module.exports = event => {
//    const senderId = event.sender.id;
//    const message = event.message.text;
//    const apiaiSession = apiAiClient.textRequest(message, {
//      sessionId: "crowdbotics_bot"
//    });
//    apiaiSession.on("response", response => {
//      const result = response.result.fulfillment.speech;
//      callSendAPI(senderId, result);
//    });
//    apiaiSession.on("error", error => console.log(error));
//    apiaiSession.end();
//  };
//  //***************************************************/
 

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 // console.log("==> REQ : "+req.body)
  let body = req.body;
  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      // console.log("=> WEBHOOK_EVENT RECEIVED : "+webhook_event);
      // console.log("=> WEBHOOK_EVENT.MESSAGE RECEIVED : "+webhook_event.message);
      // console.log("=> WEBHOOK_EVENT.POSTBACK : "+webhook_event.postback);
      
  
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('webhook_event.sender: ' + webhook_event.sender);
      if(webhook_event.postback){
        queries.getUserByPSID(sender_psid, function(err, result_query){
          if(result_query == 0){
            console.log("Utilisateur pas en DB");
            //queries.createUser()
          } 
        });
      }else
      {
        // Check if the event is a message or postback and
              // pass the event to the appropriate handler function
              if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);        
              } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
              }
      }

      
      
      
    });
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});
function handleMessage(sender_psid, received_message) {

  let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
      // will be added to the body of our request to the Send API
      response = {
      "text": `Bijour j'ai bien reçu ton message ! : "${received_message.text}". Maintenant envoi moi une image!`
    }
  }else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "C'est la bonne photo?",
            "subtitle": "Clique sur un bouton.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Sends the response message
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Merci!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, Envoi moi une autre image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

//Call Facebook Graph API to send back message
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}