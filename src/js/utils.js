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
    let difference = finalTimestamp - initialTimestamp;
    switch (unit) {
        case Unit.DAYS:
            return Math.floor(difference / Milliseconds.DAY); 
    
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

function sum(a,b) { return a + b; }
function sub(a,b) { return a - b; }

module.exports = {
    getDateString : getDateString,
    getUnit : getUnit,
    getNextTimeByUnit : getNextTimeByUnit,
    getPreviousTimeByUnit : getPreviousTimeByUnit,
    getNumberUnits : getNumberUnits
}