'use strict';

var msds = require('./msds');

/*
  Route the incoming request based on type (LaunchRequest, IntentRequest,
  etc.) The JSON body of the request is provided in the event parameter.
*/

exports.handler = function(event, context) {
  try {
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    /*
      Uncomment this IF STATEMENT and populate it with your skill's application ID
      To prevent someone else from configuring a skill that sends requests to this function.
    */

    if (event.session.application.applicationId !== "amzn1.ask.skill.8fdf2145-d902-4066-ba88-9a22549353f8") {
      context.fail("Invalid Application ID");
    }

    if (event.session.new) {
      onSessionStarted({requestId: event.request.requestId}, event.session);
    }

    if (event.request.type === "LaunchRequest") {
      onLaunch(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
    } else if (event.request.type === "IntentRequest") {
      onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
    } else if (event.request.type === "SessionEndedRequest") {
      onSessionEnded(event.request, event.session);
      context.succeed();
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

// Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
  console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
  // Add any session init logic here.
}

// Called when the user invokes the skill without specifying an intent.
function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
  getWelcomeResponse(callback);
}

// Called when the user specifies an intent for the skill.
function onIntent(intentRequest, session, callback) {
  console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

  var intent = intentRequest.intent;
  var intentName = intentRequest.intent.name;

  // Dispatch to custom intents here:
  if ("GeneralInfoIntent" === intentName) {
    generalInfo(intent, session, callback);
  } else if ("FormulaIntent" === intentName) {
    chemicalFormula(intent, session, callback);
  } else if ("NameIntent" === intentName) {
    commonName(intent, session, callback);
  } else if ("StateIntent" === intentName) {
    physicalState(intent, session, callback);
  } else if ("OdorIntent" === intentName) {
    smellOdor(intent, session, callback);
  } else if ("WeightIntent" === intentName) {
    molecularWeight(intent, session, callback);
  } else if ("ColorIntent" === intentName) {
    whatColor(intent, session, callback);
  } else if ("PHIntent" === intentName) {
    whatPH(intent, session, callback);
  } else if ("BoilingIntent" === intentName) {
    boilingPoint(intent, session, callback);
  } else if ("MeltingIntent" === intentName) {
    meltingPoint(intent, session, callback);
  } else if ("CriticalIntent" === intentName) {
    criticalTemp(intent, session, callback);
  } else if ("DOTIntent" === intentName) {
    dotClass(intent, session, callback);
  } else if ("HealthIntent" === intentName) {
    whatHealth(intent, session, callback);
  } else if ("AcuteIntent" === intentName) {
    acuteHazard(intent, session, callback);
  } else if ("ChronicIntent" === intentName) {
    chronicHazard(intent, session, callback);
  } else if ("EyeIntent" === intentName) {
    eyeContact(intent, session, callback);
  } else if ("SkinIntent" === intentName) {
    skinContact(intent, session, callback);
  } else if ("InhalationIntent" === intentName) {
    isInhaled(intent, session, callback);
  } else if ("IngestionIntent" === intentName) {
    isIngested(intent, session, callback);
  } else if ("FireIntent" === intentName) {
    fireFighting(intent, session, callback);
  } else if ("SpillIntent" === intentName) {
    whatSpill(intent, session, callback);
  } else if ("SmallSpillIntent" === intentName) {
    smallSpill(intent, session, callback);
  } else if ("LargeSpillIntent" === intentName) {
    largeSpill(intent, session, callback);
  } else if ("SolidSpillIntent" === intentName) {
    solidSpill(intent, session, callback);
  } else if ("LiquidSpillIntent" === intentName) {
    liquidSpill(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    getHelp(intent, session, callback);
  } else if ("AMAZON.YesIntent" === intentName) {
    if (session.attributes.previousPlace === "Welcome") {
      isFirstTime(intent, session, callback);
    } else if (session.attributes.previousPlace === "First Time") {
      isFirstTime(intent, session, callback);
    } else {
      whatChemical(intent, session, callback);
    }
  } else if ("AMAZON.NoIntent" === intentName) {
    if (session.attributes.previousPlace === "Welcome") {
      whatChemical(intent, session, callback);
    } else if (session.attributes.previousPlace === "First Time") {
      whatChemical(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else if ("AMAZON.StopIntent" === intentName) {
    endSession(intent, session, callback);
  } else if ("AMAZON.CancelIntent" === intentName) {
    endSession(intent, session, callback);
  } else {
    throw "Invalid Intent";
  }
}

// Called when the user ends the session. Is not called when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
  console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
  // Add any cleanup logic here.
}

// --------------------------------------- SKILL SPECIFIC BUSINESS LOGIC -------------------------------------------
function getWelcomeResponse(callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Welcome To MSDS";
  var speechOutput = "Welcome to MSDS! If you need information on Material Safety Data Sheets for chemicals, then you have come to the right place. "
  + "Is this your first time using MSDS? ";
  var repromptText = "Is this your first time using MSDS? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function isFirstTime(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "How To Use MSDS";
  var speechOutput = "Since this is your first time using MSDS, let me tell you what you can do! You can say, tell me about, and the chemical of your choice, to hear a general overview. "
  + "Or you can get more specific about what you want to hear. You can break down a chemical's MSDS form and ask for the following: "
  + "General information such as Chemical Formula and Common Name. Health hazards like Acute Health Hazards and Chronic Health Hazards. First aid measures for Eye Contact, Skin Contact, "
  + "Inhalation, and Ingestion. As well as Fire Fighting prevention measures and what to do if there is a spill. If you don't know the exact name of a chemical or which chemical you want, "
  + "you can say, list of chemicals. Do you need to hear this information again? ";
  var repromptText = "Do you need to hear this information again? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "First Time"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatChemical(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What Chemical?";
  var speechOutput = "What would you like to hear MSDS information on? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "What Chemical"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function generalInfo(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var formula = msds[chemical].chemical_formula;
    var common = msds[chemical].common_name;
    var state = msds[chemical].state;
    var odor = msds[chemical].odor;
    var weight = msds[chemical].weight;
    var color = msds[chemical].color;
    var pH = msds[chemical].pH;
    var boil = msds[chemical].boiling_point;
    var melt = msds[chemical].melting_point;
    var crit = msds[chemical].critical_temp;
    var dot = msds[chemical].dot_class;

    CARD_TITLE = "General Info on " + name;
    speechOutput = "The chemical formula of " + name + " is " + formula + ". It's physical state is as a " + state + ". It has a " + odor + " odor, and a molecular weight of " + weight
    + ". It is " + color + ", and has a PH of " + pH + ". Boiling point equals " + boil + ", melting point equals " + melt + ", and critical temperature equals " + crit + ". "
    + name + " also has the following D O T Classifications: " + dot + ". Would you like to hear about another chemical? ";
    repromptText = "Would you like to hear about another chemical? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "General Info"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function chemicalFormula(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var formula = msds[chemical].chemical_formula;
    CARD_TITLE = "Chemical Formula Of " + name;
    speechOutput = "The chemical formula of " + name + " is " + formula + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Formula"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function commonName(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var common = msds[chemical].common_name;
    CARD_TITLE = "Common Name Of " + name;
    speechOutput = name + " is also commonly known as " + common + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Common Name"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function physicalState(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var state = msds[chemical].state;
    CARD_TITLE = "Physical State Of " + name;
    speechOutput = name + " is found in the " + state + " state. Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "State"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function smellOdor(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var odor = msds[chemical].odor;
    CARD_TITLE = "Odor Of " + name;
    speechOutput = name + " has a " + odor + " odor to it. Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Odor"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function molecularWeight(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var weight = msds[chemical].weight;
    CARD_TITLE = "Molecular Weight Of " + name;
    speechOutput = name + " has a molecular weight of " + weight + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Weight"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatColor(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var color = msds[chemical].color;
    CARD_TITLE = "Color Of " + name;
    speechOutput = name + " is " + color + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Color"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatPH(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var pH = msds[chemical].pH;
    CARD_TITLE = "pH Of " + name;
    speechOutput = name + " has a P H of " + pH + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "PH"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function boilingPoint(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var bp = msds[chemical].boiling_point;
    CARD_TITLE = "Boiling Point Of " + name;
    speechOutput = "The boiling point of " + name + " is " + bp + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Boiling Point"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function meltingPoint(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var mp = msds[chemical].melting_point;
    CARD_TITLE = "Melting Point Of " + name;
    speechOutput = "The melting point of " + name + " is " + mp + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Melting Point"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function criticalTemp(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var temp = msds[chemical].critical_temp;
    CARD_TITLE = name + "'s Critical Temperature";
    speechOutput = "The critical temperature for " + name + " is " + temp + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Critical Temp"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function dotClass(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var dot = msds[chemical].dot_class;
    CARD_TITLE = "DOT Classifications Of " name;
    speechOutput = name + " is classified by the D O T as a " + dot + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DOT Class"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatHealth(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What Health Hazards";
  var speechOutput = "You can hear about acute or chronic health hazards, which would you like to hear about? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "What Health"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function acuteHazard(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var acute = msds[chemical].acute_hazard;
    CARD_TITLE = name + "'s Acute Health Hazards";
    speechOutput = "Here are the acute health hazards for " + name + ": " + acute + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Acute Hazard"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function chronicHazard(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var chronic = msds[chemical].chronic_hazard;
    CARD_TITLE = name + "'s Chronic Health Hazards";
    speechOutput = "Here are the chronic health hazards for " + name + ": " + chronic + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Chronic Hazard"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function eyeContact(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var eye = msds[chemical].eye_contact;
    CARD_TITLE = "Eye Contact With " + name;
    speechOutput = "If you come into eye contact with " + name + " please note the following: " + eye + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Eye Contact"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function skinContact(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var skin = msds[chemical].skin_contact;
    CARD_TITLE = "Skin Contact With " + name;
    speechOutput = "If you come into skin contact with " + name + " please note the following: " + skin + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Skin Contact"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function isInhaled(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var inhaled = msds[chemical].inhalation;
    CARD_TITLE = "Inhalation Of " + name;
    speechOutput = "If you inhale " + name + " please note the following: " + inhaled + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Inhalation"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function isIngested(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var ingested = msds[chemical].ingestion;
    CARD_TITLE = "Ibgestion Of " + name;
    speechOutput = "If you ingest " + name + " please note the following: " + ingested + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Ingestion"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function fireFighting(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var fire = msds[chemical].fire_fighting;
    CARD_TITLE = "Fire Fighting Measures For " + name;
    speechOutput = "If an " + name + " fire is started, please note the following: " + fire + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Fire Fighting"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatSpill(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "How Big Is The Spill?";
  var speechOutput = "Is it a small or large spill? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "What Spill"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function smallSpill(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var small = msds[chemical].small_spill;
    CARD_TITLE = "Small Spill Of " + name;
    speechOutput = "If the spill of " + name + " is small: " + small + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Small Spill"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function largeSpill(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var large = msds[chemical].large_spill;
    CARD_TITLE = "Large Spill Of " + name;
    speechOutput = "If the spill of " + name + " is large: " + large + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Large Spill"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function solidSpill(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var solid = msds[chemical].large_spill_solid;
    CARD_TITLE = "Large Spill Of Solid " + name;
    speechOutput = "If a large spill of " + name + " is in solid form " + solid + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Solid Spill"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function liquidSpill(intent, session, callback) {
  var sessionAttributes = {};
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var CARD_TITLE;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var name = msds[chemical].chemical_name;
    var liquid = msds[chemical].large_spill_liquid;
    CARD_TITLE = "Large Spill Of Liquid " + name;
    speechOutput = "If a large spill of " + name + " is in liquid form " + liquid + ". Would you like to hear about anything else? ";
    repromptText = "Would you like to hear about anything else? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Liquid Spill"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "How To Use MSDS";
  var speechOutput = "You can say, tell me about, and the chemical of your choice, to hear a general overview. "
  + "Or you can get more specific about what you want to hear. You can break down a chemical's MSDS form and ask for the following: "
  + "General information such as Chemical Formula and Common Name. Health hazards like Acute Health Hazards and Chronic Health Hazards. First aid measures for Eye Contact, Skin Contact, "
  + "Inhalation, and Ingestion. As well as Fire Fighting prevention measures and what to do if there is a spill. If you don't know the exact name of a chemical or which chemical you want, "
  + "you can say, list of chemicals. Do you need to hear this information again? ";
  var repromptText = "Do you need to hear this information again? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "First Time"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function endSession(intent, session, callback) {
  var CARD_TITLE = "Goodbye, Hope To See You Soon!";
  var speechOutput = "Thank you for using MSDS, have a wonderful day!";
  callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
}

// --------------------------------------- HELPER FUNCTIONS THAT BUILD ALL RESPONSES -------------------------------------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: title,
      content: output
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}
