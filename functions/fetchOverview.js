const admin = require('firebase-admin');
const db = admin.firestore();

const { findRelationship } = require("./relationship");

function findExcessive(result) {
    //const result = await findRelationship(dob, time);

    let excessive = {};

    for (let key in result) {
        let value = result[key];

        // if frequency >= 3
        if (getFrequency(result, value) >= 3) {
            excessive[key] = value;
        }

        // if frequency >= 2 and value is JieCai
        if (value === "JieCai" && getFrequency(result, value) >= 2) {
            excessive[key] = value;
        }

        // if value is JieCai and BiJian >= 2
        if (value === "JieCai"){
            //if (Object.values(result).filter(v => v === "BiJian").length >= 2) {
            if (getFrequency(result, "BiJian") >= 2) {
                excessive[key] = value;
            }
        }

        // if value is BiJian && not dhs, and JieCai >= 1
        if (value === "BiJian" && key !== "dhs") {
            //if (Object.values(result).filter(v => v === "JieCai").length >= 1) {
            if (getFrequency(result, "JieCai") >= 1) {
                excessive[key] = value;
            }
        }
    }
    return excessive;
}

function getFrequency(obj, value) {
    return Object.values(obj).filter(v => v === value).length;
}

function extractExcessive(excessive) {
    let JiShen = [];

    for (let key in excessive) {
        let value = excessive[key];
        if (!JiShen.includes(value)) {
            JiShen.push(value);
        }
    }
    return JiShen;
}

async function fetchExcessiveData(JiShen) {
    //const db = admin.firestore();

    try {
        const documentSnapshot = await db.collection("Useless").doc("Overall-Excessive").get();
        
        if (documentSnapshot.exists) {
            let result = "";
            JiShen.forEach(sh => {
                let data = documentSnapshot.get(sh); // Fetching each field
                //result += data ? `${sh}: ${data}\n` : `${sh}: No data\n`;
                result += data ? `${data}` : `${sh}: No data\n`;
            });
            return result;
        } else {
            return "Document does not exist";
        }
    } catch (error) {
        throw new Error(`Error fetching document: ${error.message}`);
    }
}

function findUseful(excessive, relationship) {
    //let usefulKeys = [];
    let result = {};
    let allKeys = ["yhs", "yeb", "mhs", "meb", "deb", "ths", "teb"];


    for (let key of allKeys) {
        if (!excessive.hasOwnProperty(key)) {
            result[key] = relationship[key];
        }
    }
    return result;
}

function extractUseful(useful) {
    let result = [];

    for (let key in useful) {
        let value = useful[key];
        if (!result.includes(value)) {
            result.push(value);
        }
    }
    return result;
}

async function fetchUsefulData(useful) {
    //const db = admin.firestore();

    try {
        const documentSnapshot = await db.collection("Useful").doc("Overall-CHI").get();
        
        if (documentSnapshot.exists) {
            let result = "";
            useful.forEach(sh => {
                let data = documentSnapshot.get(sh); // Fetching each field
                result += data ? `${data}` : `${sh}: No data\n`;
            });
            return result;
        } else {
            return "Document does not exist";
        }
    } catch (error) {
        throw new Error(`Error fetching document: ${error.message}`);
    }
}

function findMissing(relationship) {
    const missing = [];
    const shiShen = ["Yin", "Guan", "ShiShang", "Cai", "BiJian", "JieCai"];

    // Check for missing elements
    shiShen.forEach(shen => {
        if (!Object.values(relationship).includes(shen)) {
            missing.push(shen);
        }
    });

    // Specific check for "B" and "J"
    const bCount = Object.values(relationship).filter(x => x === "BiJian").length;
    if (bCount < 2 && !Object.values(relationship).includes("JieCai")) {
        missing.push("BiJian");
    }

    return missing;
}

async function fetchMissingData(missing) {
    //const db = admin.firestore();

    try {
        const documentSnapshot = await db.collection("Useless").doc("Overall-Missing-CHI").get();
        
        if (documentSnapshot.exists) {
            let result = "";
            missing.forEach(sh => {
                let data = documentSnapshot.get(sh); // Fetching each field
                result += data ? `${data}` : `${sh}: No data\n`;

            });
            return result;
        } else {
            return "Document does not exist";
        }
    } catch (error) {
        throw new Error(`Error fetching document: ${error.message}`);
    }
}

async function fetchPositionData(relationship) {
    try {
        let result = [];

        for (let key in relationship) {
            if (relationship.hasOwnProperty(key)) {
                let documentName = relationship[key]; 
                let documentRef = db.collection('Position').doc(documentName);

                try {
                    let docSnapshot = await documentRef.get();

                    if (docSnapshot.exists) {
                        // result[key] = docSnapshot.data()[key];
                        // Add only the value, not the key
                        result.push(docSnapshot.data()[key]);
                    } else {
                        result.push(`No such document: ${documentName}`);
                    }
                } catch (error) {
                    result.push(`Error getting document ${documentName}:`, error);
                }
            }
        }

        return result;
    } catch (error) {
        result.push(`Error in fetchPositionData: ${error}`);
        throw new Error(`Error fetching data: ${error.message}`);
    }
}


async function fetchData(dob, time) {
    try {
        const relationship = await findRelationship(dob, time);

        const excessiveResult = await findExcessive(relationship);
        const excessive = extractExcessive(excessiveResult);
        const priority1 = await fetchExcessiveData(excessive);
        const usefulResult = findUseful(excessiveResult, relationship);
        //const useful = extractUseful(usefulResult);
        //const priority3 = await fetchUsefulData(useful);
        //const missing = findMissing(relationship);
        //const m = await fetchMissingData(missing);
        const priority2 = await fetchPositionData(usefulResult);
        const data = {priority1, priority2};
        return data;
    }
    catch (error) {
        throw new Error(`Error fetching data: ${error.message}`);
    }
}



module.exports = fetchData;