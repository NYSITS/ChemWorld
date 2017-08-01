'use strict';

var colleges = require('./colleges');
var searches = require('./searches');

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

    if (event.session.application.applicationId !== "") {
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
  var previousPlace = session.attributes.previousPlace;

  // Dispatch to custom intents here:
  if ("SchoolInfoIntent" === intentName) {
    getSchoolInfo(intent, session, callback);
  } else if ("AnotherSchoolIntent" === intentName) {
    anotherSchool(intent, session, callback);
  } else if ("SearchIntent" === intentName) {
    getSearchResults(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    getHelp(intent, session, callback);
  } else if ("AMAZON.YesIntent" === intentName) {
    if (previousPlace === "School Info") {
      anotherSchool(intent, session, callback);
    } else if (previousPlace === "Another School") {
      moreSchoolInfo(intent, session, callback);
    }
  } else if ("AMAZON.NoIntent" === intentName) {
    if (previousPlace === "Another School") {
      getHelp(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else if ("AMAZON.StopIntent" === intentName) {
    if (previousPlace === "Search") {
      moreSchoolInfo(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
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
  var CARD_TITLE = "Welcome to New York College";
  var speechOutput = "Trying to decide which public New York university is the best fit for you? If you have a university in mind simply say, tell me about, and the university of your choice. If not you can say, search for schools, to hear a list of schools by certain criteria. What would you like to do? ";
  var repromptText = "Say, tell me about, and a university to hear information about it. Or say, search for schools, to hear a list of schools by certain criteria. What would you like to do? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getSchoolInfo(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE;
  var school = intent.slots.School.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!college[school]) {
    speechOutput = "I'm sorry, I didn't quite understand what you University you wanted. Please try again, or ask about a different university.  ";
    repromptText = "Try asking again or, about a different university.  ";
    CARD_TITLE = "Please Try Again";
  } else {
    var campus = colleges[school].campus;
    var level = colleges[school].institution_level;
    var type = colleges[school].institution_type;
    var pro1 = colleges[school].program_1;
    var pro2 = colleges[school].program_2;
    var pro3 = colleges[school].program_3;
    var pro4 = colleges[school].program_4;
    var pro5 = colleges[school].program_5;
    var undergrad = colleges[school].undergrad_enrollment;
    var website = colleges[school].campus_website;
    var address = colleges[school].address;
    var city = colleges[school].city;
    var state = colleges[school].state;
    var zip = colleges[school].zip;

    CARD_TITLE = campus;
    speechOutput = campus + " is a " + level + " university that is classified in the " + type + " category of public schools. "
    + "There was an undergraduate enrollment of " + undergrad + " in 2015. With some of the most popular areas of study including: "
    + pro1 + ", " + pro2 + ", " + pro3 + ", " + pro4 + ", and " + pro5 + ". The university is located at " + address + ", " + city + ", " + state + ", " + zip
    + ". If you would like more in depth information about this university, please visit their website, " + website + ". Would you like to hear about another university? ";
    repromptText = "If you would like to hear about another university say, I would like to hear about another university. If not simply say, no, stop, or cancel to exit. ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "School Info"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function anotherSchool(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Do You Know What You're Looking For?";
  var speechOutput = "Do you know which university you would like to hear about? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Another School"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function moreSchoolInfo(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What University";
  var speechOutput = "Which university would you like to hear information about? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "More School Info"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getSearchResults(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Search Results";
  var criteria = intent.slots.Criteria.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!searches[criteria]) {
    speechOutput = "I'm sorry, I didn't quite understand what you said. Please try again.  ";
    repromptText = speechOutput;
  } else {
    var list = searches[criteria].name;
    speechOutput = "You can say stop when you have heard the name of the university you wish to hear about. Here is a list of " + criteria + " universities: " + name
    + ". What would you like to do? ";
    repromptText = "You can search again or, say tell me about, and the university you wish to hear about. What would you like to do? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Search"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getHelp(intent, session, callback) {
  if (!session.attributes) {
    session.attributes = {};
  }

  var CARD_TITLE = "Help Page";
  var speechOutput = "To hear information on a particular university say, tell me about, and the university you wish to hear about. "
  + "If you don't know what university you wish to hear about you can get a list of universities. "
  + "You can ask for 2-year or 4-year universities. Or for universities by type, such as, community colleges, fashion colleges, comprehensive colleges, doctoral degree granting colleges, or technology colleges. "
  + "To get a list of universities you can say, give me a list of 4-year colleges. Or what are some community colleges. Would you like to search for a university? ";
  var repromptText = "To get a list of universities you can say, give me a list of 4-year colleges. Or what are some community colleges. Would you like to search for a university? ";
  var shouldEndSession = false;

  callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function endSession(intent, session, callback) {
  var CARD_TITLE = "Goodbye, have a wonderful day!";
  callback(session.attributes, buildSpeechletResponse(CARD_TITLE, "Goodbye, thank you for using NY College, have a wonderful day!", "", true));
}

// --------------------------------------- FUNCTIONS THAT BUILD ALL OF THE RESPONSES -------------------------------------------
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
