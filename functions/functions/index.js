// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
var sender = require('gmail-send')({
    user: 'devslabgt@gmail.com',
    pass: '********',
});
 
process.env.DEBUG = 'dialogflow:debug';
admin.initializeApp();
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function orderPizza(agent) {
    admin.database().ref().child('orders').push().set({
        comida: agent.parameters.comida,
        medida: agent.parameters.medida,
        cantidad: agent.parameters.cantidad,
        email: agent.parameters.email,
        ingredientes: agent.parameters.ingredientes
    });
    return agent.add("Hemos recibido tu orden y recibiras un correo con la confirmación.");
  }
  
  let intentMap = new Map();
  intentMap.set('OrdenarPizza', orderPizza);
  agent.handleRequest(intentMap);
});

exports.newOrder = functions.database.ref('/orders/{id}').onCreate((snapshot, context) => {
    var list = "";
    snapshot.val().ingredientes.forEach(element => {
        list = list + "<li>" + element + "</li>";
    });
    return sender({
        subject: "Hemos recibido tu orden",
        to: snapshot.val().email,
        html: "<h2>Tú orden es la [" + context.params.id + "]</h2>" 
        + "<p>Pediste <b>" + snapshot.val().cantidad + " " + snapshot.val().comida 
        + "</b> con los siguientes ingredientes: </p>" 
        + "<ul>" + list + "</ul>"
    }, (err, res) => {
        console.error("Notification error: ", err, res);
    });
});
