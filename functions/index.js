/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

const functions = require("firebase-functions");
//const cors = require('cors')({origin: true});
const cors = require('cors')({
    origin: ['https://fakelife.ai', 'http://localhost:3000']
});

const logger = require("firebase-functions/logger");
const queryData = require("./queryData");
//const findRelationship = require("./relationship");
//const findExcessive = require("./fetchOverview");
const fetchData = require("./fetchOverview");
const {ifClockwise, getLyhsLyeb, getDyhsDyeb} = require("./helper");
const dysd = require("./daYun");
const {getYearlyFortune} = require("./fetchYear");

const handler = require("./openai");

const run = require("./gemini");

// TODO: Add user authentication to restrict access to this function

exports.processLifeOverview = functions
    .region("australia-southeast1")
    .runWith({maxInstances: 10})
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            logger.info("Processing Life Overview", {structuredData: true});

            if (req.method !== "POST") {
                res.status(403).send('Forbidden!');
                return;
            }

            const { dob, time } = req.body;

            if (!dob || !time) {
                res.status(400).send('Missing required fields');
                return;
            }

            if (!isValidDateAndTime(dob, time)) {
                res.status(400).send('Invalid date or time format');
                return;
            }

            try {
                const result = await calculateLifeOverview(dob, time);
                console.log(dob, time);
                // const dataFinal =  await fetchResult(result);
                // const runnn = await runn(result);
                //console.log(result);
                res.status(200).send({ result });
            } catch (error) {
                logger.error("Error in calculateLifeOverview", error);
                res.status(500).send('Internal Server Error');
            }
        });
    });

    exports.processYearOverview = functions
    .region("australia-southeast1")
    .runWith({maxInstances: 10})
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            logger.info("Processing Year Overview", {structuredData: true});

            if (req.method !== "POST") {
                res.status(403).send('Forbidden!');
                return;
            }

            const { dob, time, gender } = req.body;

            if (!dob || !time) {
                res.status(400).send('Missing required fields');
                return;
            }

            if (!isValidDateAndTime(dob, time)) {
                res.status(400).send('Invalid date or time format');
                return;
            }

            try {
                const result = await calculateYearOverview(dob, time, gender);
                logger.info(`Result: ${result}`, {structuredData: true});
                res.status(200).send({ result });
            } catch (error) {
                logger.error("Error in calculateYearOverview", error);
                res.status(500).send('Internal Server Error');
            }
        });
    });

async function calculateLifeOverview(dob, time) {
    try {
        const result = await fetchData(dob, time);

        // Further process result if needed
        return result;
    } catch (error) {
        // Handle or throw the error
        throw error;
    }
}

async function calculateYearOverview(dob, tob, gender, year) {
    try {
        if (gender.toLowerCase() !== "female") {
            gender = "Male";
        } else {
            gender = "Female";
        }
        
        const { is_spring, yhs, yeb, mhs, meb, dhs, deb, ths, teb, solarTerm, time } = await queryData(dob, tob);
        const isClockwise = ifClockwise(gender, yhs);
        const dyStartDate = await dysd(dob, tob, isClockwise);

        // for (let year = 2000; year <= 2100; year++) {
        //     const { dyhs, dyeb } = getDyhsDyeb(mhs, meb, isClockwise, year, dyStartDate);
        //     const { lyhs, lyeb } = getLyhsLyeb(year);
        //     console.log(`Year: ${year}, dyhs: ${dyhs}, dyeb: ${dyeb}`);
        //     console.log(`Year: ${year}, lyhs: ${lyhs}, lyeb: ${lyeb}`);
        // }

        const year = 2023;
        const { dyhs, dyeb } = getDyhsDyeb(mhs, meb, isClockwise, year, dyStartDate);
        const { lyhs, lyeb } = getLyhsLyeb(year);
        console.log(`Year: ${year}, dyhs: ${dyhs}, dyeb: ${dyeb}`, ` lyhs: ${lyhs}, lyeb: ${lyeb}`);
        const yearlyFortune = getYearlyFortune(yhs, yeb, mhs, meb, dhs, deb, ths, teb, dyhs, dyeb, lyhs, lyeb);
        console.log('dyStartDate: ', dyStartDate);

        return yearlyFortune;
    } catch (error) {
        // Handle or throw the error
        throw error;
    }
}

// async function fetchResult(event) {
//     try {
//         const requestBody = await handler(event);
//         return requestBody;
        
//     } catch (error) {
//         throw error;
//     }
// }

async function runn(result) {
    try {
        const runnnn = await run(result);
        return runnnn;
    } catch (error) {
        throw error;
    }
}

// Function to validate date and time format
function isValidDateAndTime(dateStr, timeStr) {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
        return false;
    }

    // Split date into components
    const [year, month, day] = dateStr.split("-").map(num => parseInt(num, 10));

    // Validate year range
    if (year < 1901 || year > 2099) {
        return false;
    }

    // Validate month
    if (month < 1 || month > 12) {
        return false;
    }

    // Validate day based on month, considering leap years
    const isLeapYear = year => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (day < 1 || day > daysInMonth[month - 1]) {
        return false;
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeStr)) {
        return false;
    }

    // If all checks pass
    return true;
}

