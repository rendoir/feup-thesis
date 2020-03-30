const Milliseconds = Object.freeze({
    DAY: 1000 * 60 * 60 * 24,
});

const Unit = Object.freeze({
    DAYS: 1,
});

function getUnit(initialTimestamp, finalTimestamp) {
    // TODO
    return Unit.DAYS;
}

function getNumberUnits(unit, initialTimestamp, finalTimestamp) {
    let difference = getFloorTimeByUnit(unit, finalTimestamp) - getFloorTimeByUnit(unit, initialTimestamp);
    switch (unit) {
        case Unit.DAYS:
            return Math.round(difference / Milliseconds.DAY);
    
        default:
            return null;
    }
}

function getDateString(date) {
    return String(date.getFullYear()) + "-" +
        String(date.getMonth()+1) + "-" +
        String(date.getDate()) + "\n" + 
        String(date.getHours()) + ":" +
        String(date.getMinutes()) + ":" +
        String(date.getSeconds()) + "." +
        String(date.getMilliseconds());
}


function getTimeByUnit(unit, timestamp, op) {
    let time = {};
    switch (unit) {
        case Unit.DAYS:
            time.timestamp = op(timestamp, Milliseconds.DAY);
            time.value = new Date(time.timestamp).getDate();
            break;
    
        default:
            return null;
    }
    return time;
}

function getNextTimeByUnit(unit, timestamp) {
    return getTimeByUnit(unit, timestamp, sum);
}

function getPreviousTimeByUnit(unit, timestamp) {
    return getTimeByUnit(unit, timestamp, sub);
}

function getCurrentTimeByUnit(unit, timestamp) {
    return getTimeByUnit(unit, timestamp, noOp);
}

function getFloorTimeByUnit(unit, timestamp) {
    let date = new Date(timestamp);
    switch (unit) {
        case Unit.DAYS:
            date.setHours(0,0,0,0);
            break;
    
        default:
            break;
    }
    return date.getTime();
}

function sum(a,b) { return a + b; }
function sub(a,b) { return a - b; }
function noOp(a,b) { return a; }

module.exports = {
    getDateString : getDateString,
    getUnit : getUnit,
    getNextTimeByUnit : getNextTimeByUnit,
    getPreviousTimeByUnit : getPreviousTimeByUnit,
    getCurrentTimeByUnit : getCurrentTimeByUnit,
    getNumberUnits : getNumberUnits,
    getFloorTimeByUnit : getFloorTimeByUnit
}