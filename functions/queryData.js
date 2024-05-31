const admin = require('firebase-admin');
admin.initializeApp();

let is_spring, solarTerm, time;
let yhs, yeb, mhs, meb, dhs, deb, ths, teb;

const queryData = async (date, selectedTime) => {
    const databaseReference = admin.database().ref(date);

    try {
        const snapshot = await databaseReference.once('value');
        if (snapshot.exists()) {
            is_spring = snapshot.child("is_spring").val();
            yhs = snapshot.child("yhs").val();
            yeb = snapshot.child("yeb").val();
            mhs = snapshot.child("mhs").val();
            meb = snapshot.child("meb").val();
            dhs = snapshot.child("dhs").val();
            deb = snapshot.child("deb").val();
            solarTerm = snapshot.child("solar_term").val();
            time = snapshot.child("time").val();

            // if selectedTime >= 11pm, then increment dhs and deb by 1
            if (selectedTime >= "23:00") {
                dhs = adjustValue(dhs, 1, 1, 10);
                deb = adjustValue(deb, 1, 11, 22);
            }

            // if its spring or solar term, then adjust the values
            if (is_spring != "no" || solarTerm != "NA"){
                let adjustedValues = adjust(selectedTime, is_spring, yhs, yeb, mhs, meb, solarTerm, time);
                yhs = adjustedValues.yhs;
                yeb = adjustedValues.yeb;
                mhs = adjustedValues.mhs;
                meb = adjustedValues.meb;
            }

            teb = calculateTeb(selectedTime);
            ths = calculateThs(dhs, teb);
            return { is_spring, yhs, yeb, mhs, meb, dhs, deb, ths, teb, solarTerm, time };
        } else {
            console.error("No data found for date: " + date);
            return null; // or handle as needed
        }
    } catch (error) {
        console.error("Error querying data: ", error);
        throw error; // or handle as needed
    }
};

const adjust = (selectedTime, is_spring, yhs, yeb, mhs, meb, solarTerm, time) => {
    try {
        let selectedDateTime = new Date('1970-01-01T' + selectedTime + 'Z');
        let databaseDateTime = new Date('1970-01-01T' + time + 'Z');

        if (is_spring !== "no" && selectedDateTime < databaseDateTime) {
            yhs = adjustValue(yhs, -1, 1, 10);
            yeb = adjustValue(yeb, -1, 11, 22);
            mhs = adjustValue(mhs, -1, 1, 10);
            meb = adjustValue(meb, -1, 11, 22);
        }

        if (solarTerm !== "NA" && selectedDateTime < databaseDateTime) {
            mhs = adjustValue(mhs, -1, 1, 10);
            meb = adjustValue(meb, -1, 11, 22);
        }

        // Return the adjusted values
        return { yhs, yeb, mhs, meb };
    } catch (e) {
        console.error(e);
        throw new Error('Error processing request');
    }
};

function adjustValue(value, increment, min, max) {
    value += increment;
    if (value < min) {
        value = max;
    } else if (value > max) {
        value = min;
    }
    return value; // Placeholder return
}

function calculateTeb(selectedTime){
    try {
        // Parse the time
        const timeParts = selectedTime.split(":");
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        // Create a date object
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        const hour = date.getHours();

        // Time-based logic
        if (hour >= 23 || hour < 1) {
            return 11;
        } else if (hour >= 1 && hour < 3) {
            return 12;
        } else if (hour >= 3 && hour < 5) {
            return 13;
        } else if (hour >= 5 && hour < 7) {
            return 14;
        } else if (hour >= 7 && hour < 9) {
            return 15;
        } else if (hour >= 9 && hour < 11) {
            return 16;
        } else if (hour >= 11 && hour < 13) {
            return 17;
        } else if (hour >= 13 && hour < 15) {
            return 18;
        } else if (hour >= 15 && hour < 17) {
            return 19;
        } else if (hour >= 17 && hour < 19) {
            return 20;
        } else if (hour >= 19 && hour < 21) {
            return 21;
        } else if (hour >= 21 && hour < 23) {
            return 22;
        } else {
            return -1;  // Error case
        }
    } catch (e) {
        console.error(e);
        return -1;  // Error case
    }
}

function calculateThs(dhs, teb){
    teb -= 10;
    switch (dhs) {
        case 1:
        case 6:
            if (teb <= 10) {
                return teb;
            } else {
                return teb - 10;
            }
        case 2:
        case 7:
            if (teb <= 8) {
                return teb + 2;
            } else {
                return teb - 8;
            }
        case 3:
        case 8:
            if (teb <= 6) {
                return teb + 4;
            } else {
                return teb - 6;
            }
        case 4:
        case 9:
            if (teb <= 4) {
                return teb + 6;
            } else {
                return teb - 4;
            }
        case 5:
        case 10:
            if (teb <= 2) {
                return teb + 8;
            } else {
                return teb - 2;
            }
        default:
            return -1;  // Error case
    }
}
// Export the function if needed
module.exports = queryData;
