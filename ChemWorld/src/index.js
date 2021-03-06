'use strict';

var questions = require('./questions');
var msds = require('./materialSafetyDataSheets');

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

    if (event.session.application.applicationId !== "amzn1.ask.skill.e6fe31df-132b-4622-bad2-1247c88c3df8") {
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
  if ("MSDSIntent" === intentName) {
    householdChemical(intent, session, callback);
  } else if ("HealthEffectsIntent" === intentName) {
    healthEffects(intent, session, callback);
  } else if ("ChemicalsListIntent" === intentName) {
    chemicalsList(intent, session, callback);
  } else if ("QuizIntent" === intentName) {
    handleQuiz(intent, session, callback);
  } else if ("AnswerIntent" === intentName) {
    handleAnswer(intent, session, callback);
  } else if ("AMAZON.RepeatIntent" === intentName) {
    handleRepeat(intent, session, callback);
  } else if ("AMAZON.HelpIntent" === intentName) {
    getHelp(intent, session, callback);
  } else if ("AMAZON.YesIntent" === intentName) {
    if (previousPlace === "Chemical Info") {
      anythingElse(intent, session, callback);
    } else if (previousPlace === "Answer") {
      handleQuiz(intent, session, callback);
    }
  } else if ("AMAZON.NoIntent" === intentName) {
    endSession(intent, session, callback);
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
var GAME_LENGTH = 5;
var ANSWER_COUNT = 3;

function getWelcomeResponse(callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Welcome To Chem World!";
  var speechOutput = "Welcome to Chem World, your one stop shop for chemistry information! You can say quiz me, to take a quick quiz on a variety of chemistry topics. Or you can get Material Safety Data Sheet information on a number of commonly used household chemicals. To hear a list of chemicals I can tell you about say, what chemicals can you tell me about. What would You like to do? ";
  var repromptText = "You can say quiz me, to take a quick quiz on a variety of chemistry topics. Or you can get Material Safety Data Sheet information on a number of commonly used household chemicals. To hear a list of chemicals I can tell you about say, what chemicals can you tell me about. What would You like to do? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function householdChemical(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE;
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var location = msds[chemical].location;
    var name = msds[chemical].common_name;
    var hazardous_ingredient = msds[chemical].hazardous_ingredient;

    CARD_TITLE = name;
    speechOutput = "The main hazardous ingredient in " + name + " is " + hazardous_ingredient + ". Would you like to hear more information about " + hazardous_ingredient + " that can be found in a Material Safety Data Sheet? ";
    repromptText = "Would you like to hear more information about " + hazardous_ingredient + " that can be found in a Material Safety Data Sheet? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Chemical Info"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function healthEffect(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE;
  var chemical = intent.slots.Chemical.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var location = msds[chemical].location;
    var name = msds[chemical].common_name;
    var hazardous_ingredient = msds[chemical].hazardous_ingredient;
    var acute = msds[chemical].acute_health;
    var chronic = msds[chemical].chronic_health;

    CARD_TITLE = name + " Health Hazards";
    speechOutput = "The hazardous ingredient in " + name + " is " + hazardous_ingredient + ", which can commonly be found " + location + ". The potential acute health effects include: " + acute
    + ". While the potential chronic health effects include: " + chronic + ". Would you like more information? ";
    repromptText = "Would you like more information? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Health Effects"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function contact(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE;
  var chemical = intent.slots.Chemical.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!msds[chemical]) {
    speechOutput = "I'm sorry, I don't know about that chemical. Please try asking about a different chemical I do know about. ";
    repromptText = "Please ask about a different chemical. ";
    CARD_TITLE = "I Didn't Catch That Answer";
  } else {
    var location = msds[chemical].location;
    var name = msds[chemical].common_name;
    var hazardous_ingredient = msds[chemical].hazardous_ingredient;
    var eye = msds[chemical].eye_contact;
    var skin = msds[chemical].skin_contact;
    var inhale = msds[chemical].inhalation;
    var ingest = msds[chemical].ingestion;

    CARD_TITLE = name + " Contact";
    speechOutput = ""
  }
}

function anythingElse(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What Else Can I Help You With?";
  var speechOutput = "To hear Material Safety Data Sheet Information about common household chemicals say, give me information about, and the chemical you wish to know about. "
  + "You can say, quiz me, to test your chemistry knowledge. Or you can simply say, stop or cancel to exit. What would you like to do? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Anything Else"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function chemicalsList(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Chemicals I Can Tell You About";
  var speechOutput = "At the moment I can tell you about the following common household chemicals: Antifreeze and Batteries. To here information on a chemical say, give me information about, and either Antifreeze or Batteries. Which chemical would you like to hear information on? ";
  var repromptText = "Which chemical would you like to hear information on Antifreeze or Batteries? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Chemicals List"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Quiz Started";
  var speechOutput = "I will ask you " + GAME_LENGTH.toString() + " questions. Just say the number of the answer you think is correct. Let's begin. ";
  var shouldEndSession = false;
  var gameQuestions = getQuestions();
  var correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
  var roundAnswers = getAnswers(gameQuestions, 0, correctAnswerIndex);
  var currentQuestionIndex = 0;
  var spokenQuestion = Object.keys(questions.CHEM_QUESTIONS[gameQuestions[currentQuestionIndex]])[0];
  var repromptText = "Question 1: " + spokenQuestion + " ";

  for (var i = 0; i < ANSWER_COUNT; i++) {
    repromptText += (i + 1).toString() + ": " + roundAnswers[i] + ". ";
  }

  speechOutput += repromptText;

  sessionAttributes = {
    "speechOutput": repromptText,
    "repromptText": repromptText,
    "currentQuestionIndex": currentQuestionIndex,
    "correctAnswerIndex": correctAnswerIndex + 1,
    "gameQuestions": gameQuestions,
    "score": 0,
    "correctAnswerText": questions.CHEM_QUESTIONS[gameQuestions[currentQuestionIndex]][Object.keys(questions.CHEM_QUESTIONS[gameQuestions[currentQuestionIndex]])[0]][0],
    "previousPlace": "Chem Quiz"
  },

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getQuestions() {
  var gameQuestions = [];
  var indexList = [];
  var index = questions.CHEM_QUESTIONS.length;

  if (GAME_LENGTH > index) {
    throw "Invalid Game Length";
  }

  for (var i = 0; i < questions.CHEM_QUESTIONS.length; i++) {
    indexList.push(i);
  }

  // Pick GAME_LENGTH random question from the list to ask the user, make sure there are no repeats.
  for (var j = 0; j < GAME_LENGTH; j++) {
    var rand = Math.floor(Math.random() * index);
    index -= 1;

    var temp = indexList[index];
    indexList[index] = indexList[rand];
    indexList[rand] = temp;
    gameQuestions.push(indexList[index]);
  }

  return gameQuestions;
}

function getAnswers(gameQuestionIndexes, correctAnswerIndex, correctAnswerTargetLocation) {
  /*
    Get the answer for a given question, and place the correct answer at the spot marked by the
    correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
    only ANSWER_COUNT will be selected.
  */
  var answers = [];
  var answersCopy = questions.CHEM_QUESTIONS[gameQuestionIndexes[correctAnswerIndex]][Object.keys(questions.CHEM_QUESTIONS[gameQuestionIndexes[correctAnswerIndex]])[0]];
  var index = answersCopy.length;
  var temp;

  if (index < ANSWER_COUNT) {
    throw "Not Enough Answers For Question";
  }

  // Shuffle the answers, excluding the first element.
  for (var j = 1; j < answersCopy.length; j++) {
    var rand = Math.floor(Math.random() * (index - 1)) + 1;
    index -= 1;

    temp = answersCopy[index];
    answersCopy[index] = answersCopy[rand];
    answersCopy[rand] = temp;
  }

  // Swap the correct answer into the target location.
  for (var i = 0; i < ANSWER_COUNT; i++) {
    answers[i] = answersCopy[i];
  }

  temp = answers[0];
  answers[0] = answers[correctAnswerTargetLocation];
  answers[correctAnswerTargetLocation] = temp;

  return answers;
}

function handleAnswer(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "That Answer Is...";
  var speechOutput = "";
  var answerSlotValid = isAnswerSlotValid(intent);
  var userGaveUp = intent.name === "DontKnowIntent";

  if (!answerSlotValid && !userGaveUp) {
    // If the user provided answer isn't a number > 0 and < ANSWER_COUNT,
    // return an error message to the user. Remember to guide the user into providing correct values.
    var reprompt = session.attributes.speechOutput;
    speechOutput = "I'm sorry, I didn't quite understand your answer. Remember your answer must be a number between 1 and " + ANSWER_COUNT.toString() + ". " + reprompt;
    callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
  } else {
    var gameQuestions = session.attributes.gameQuestions;
    var correctAnswerIndex = parseInt(session.attributes.correctAnswerIndex);
    var currentScore = parseInt(session.attributes.score);
    var currentQuestionIndex = parseInt(session.attributes.currentQuestionIndex);
    var correctAnswerText = session.attributes.correctAnswerText;
    var speechOutputAnalysis = "";

    if (answerSlotValid && parseInt(intent.slots.Number.value) === correctAnswerIndex) {
      currentScore++;
      speechOutputAnalysis = "correct! ";
    } else {
      if (!userGaveUp) {
        speechOutputAnalysis = "incorrect! ";
      }
      speechOutputAnalysis += "The correct answer is " + correctAnswerIndex + ": " + correctAnswerText + ". ";
    }

    // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can ask the user to keep going or stop.
    if (currentQuestionIndex === GAME_LENGTH - 1) {
      speechOutput = userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "You got " + currentScore.toString() + " out of " + GAME_LENGTH.toString() + " questions correct. Would you like to play another round? ";
      callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "Would you like to play another round? ", false));
    } else {
      currentQuestionIndex += 1;
      var spokenQuestion = Object.keys(questions.CHEM_QUESTIONS[gameQuestions[currentQuestionIndex]])[0];
      correctAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
      var roundAnswers = getAnswers(gameQuestions, currentQuestionIndex, correctAnswerIndex);
      var questionIndexForSpeech = currentQuestionIndex + 1;
      var repromptText = "Question " + questionIndexForSpeech.toString() + ": " + spokenQuestion + ". ";

      for (var i = 0; i < ANSWER_COUNT; i++) {
        repromptText += (i + 1).toString() + ": " + roundAnswers[i] + ". ";
      }

      speechOutput += userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "Your score is " + currentScore.toString() + ". " + repromptText;

      sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "currentQuestionIndex": currentQuestionIndex,
        "correctAnswerIndex": correctAnswerIndex + 1,
        "gameQuestions": gameQuestions,
        "score": currentScore,
        "correctAnswerText": questions.CHEM_QUESTIONS[gameQuestions[currentQuestionIndex]][Object.keys(questions.CHEM_QUESTIONS[gameQuestions[currentQuestionIndex]])[0]][0],
        "previousPlace": "Answer"
      };

      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
    }
  }
}

function handleRepeat(intent, session, callback) {
  /*
    Repeat the previous speechOutput and repromptText from the session attributes if available
    else start a new game session.
  */
  if (!session.attributes || !session.attributes.speechOutput) {
    getWelcomeResponse(callback);
  } else {
    callback(session.attributes, buildSpeechletResponse(session.attributes.CARD_TITLE, session.attributes.speechOutput, session.attributes.repromptText, false));
  }
}

function getHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Chem World Help";
  var speechOutput = "You can say quiz me, to take a quick quiz on a variety of chemistry topics. Or you can get Material Safety Data Sheet information on a number of commonly used household chemicals. To hear a list of chemicals I can tell you about say, what chemicals can you tell me about. What would You like to do? ";
  var repromptText = "You can say quiz me, to take a quick quiz on a variety of chemistry topics. Or you can get Material Safety Data Sheet information on a number of commonly used household chemicals. To hear a list of chemicals I can tell you about say, what chemicals can you tell me about. What would You like to do? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function endSession(intent, session, callback) {
  var CARD_TITLE = "Goodbye, Hope To See You Soon!";
  var speechOutput = "Thank you for using Chem World, have a wonderful day!";
  callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
}

function isAnswerSlotValid(intent) {
  var answerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return answerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
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
