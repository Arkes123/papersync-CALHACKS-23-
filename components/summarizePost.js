"use strict";
exports.__esModule = true;
var axios_1 = require("axios");
var sentencesResponse = await axios_1["default"].post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4',
    messages: [
        {
            role: "system",
            content: "This is a chat that a user had with a chatbot. Describe the user in as many descriptive sentences as you can, but do so from the first-person point of view. For example, I am very interested in video games. could be one description. Every unique description should be a sentence, and every sentence should represent a unique aspect of the user. End every sentence with a newline."
        },
        {
            role: "user",
            content: "I love pancakes but I hate waffles!"
        }
    ],
    max_tokens: 200,
    n: 1,
    stop: null,
    temperature: 0
}, {
    headers: {
        'Content-Type': 'application/json',
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_API_KEY
    }
});
