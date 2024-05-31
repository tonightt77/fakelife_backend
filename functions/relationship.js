const queryData = require("./queryData");

async function findRelationship(dob, selectedTime) {
    try {
        const { yhs, yeb, mhs, meb, dhs, deb, ths, teb } = await queryData(dob, selectedTime);
        let relationships = {};
        relationships.yhs = evaluateRelationship("stem", yhs, dhs);
        relationships.yeb = evaluateRelationship("branch", yeb, dhs);
        relationships.mhs = evaluateRelationship("stem", mhs, dhs);
        relationships.meb = evaluateRelationship("branch", meb, dhs);
        relationships.dhs = "BiJian";
        relationships.deb = evaluateRelationship("branch", deb, dhs);
        relationships.ths = evaluateRelationship("stem", ths, dhs);
        relationships.teb = evaluateRelationship("branch", teb, dhs);

        return relationships;

    } catch (error) {
        console.error("Error find relationship: ", error);
        throw error;
    }
}

function evaluateRelationship(type, key1, key2) {
    if (type === "stem" && key1 == key2) return "BiJian"; // key2 = dhs

    let element1 = type === "stem" ? stem[key1] : branch[key1];
    let element2 = stem[key2]; // since dhs is definitely a heavenly stem

    if (!element1 || !element2) return "null";

    if (generating[element1] === element2) return "Yin";
    if (overcoming[element1] === element2) return "Guan";
    if (generating[element2] === element1) return "ShiShang";
    if (overcoming[element2] === element1) return "Cai";

    return "JieCai";
}

const stem = {
    1: "Wood",
    2: "Wood",
    3: "Fire",
    4: "Fire",
    5: "Earth",
    6: "Earth",
    7: "Metal",
    8: "Metal",
    9: "Water",
    10: "Water",
};

const branch = {
    11: "Water",
    12: "Earth",
    13: "Wood",
    14: "Wood",
    15: "Earth",
    16: "Fire",
    17: "Fire",
    18: "Earth",
    19: "Metal",
    20: "Metal",
    21: "Earth",
    22: "Water",
};

const generating = {
    "Wood": "Fire",
    "Fire": "Earth",
    "Earth": "Metal",
    "Metal": "Water",
    "Water": "Wood",

};

const overcoming = {
    "Wood": "Earth",
    "Earth": "Water",
    "Water": "Fire",
    "Fire": "Metal",
    "Metal": "Wood",
};

module.exports = {findRelationship, evaluateRelationship};