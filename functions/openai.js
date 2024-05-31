// openaiFunction.js
const e = require('cors');
const { OpenAI } = require('openai');

// Define the function that processes the OpenAI request
async function handler(event) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    // Parse the data received from your event
    console.log('Event Body:', event);
    //const requestBody = JSON.parse(event);
    //const { priority1, priority2, priority3 } = requestBody.result;
    priority1 = event.priority1;
    priority2 = event.priority2;
    priority3 = event.priority3;

    // const prompt = 'say hello world'
    const prompt = `Process and restructure the following information to be user-friendly and insightful, if there are any conflicts, process based on its priority, the lower number the higher priority: priority1:${priority1}, priority2:${priority2}, priority3:${priority3}`;

    // Prepare conversation array with system message and user prompt
    const conversationArr = [
        { role: 'system', content: 'You are a fortune teller.' },
        { role: 'user', content: prompt }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-1106',
            messages: conversationArr,
            stream: false, // Disable streaming
        });

        // Process the response
        const content = response.choices[0].message.content;
        console.log('Reply:', content);
        console.log('Response being sent:', JSON.stringify({ reply: content }));
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Adjust accordingly for security
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reply: content })
        };
    } catch (error) {
        console.error('OpenAI Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error processing your request', details: error.message })
        };
    }
};

// Export the function
module.exports = handler;
