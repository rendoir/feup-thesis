const Milliseconds = Object.freeze({
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24,
    MONTH: 1000 * 60 * 60 * 24 * 31,
    YEAR: 1000 * 60 * 60 * 24 * 366
});

const Unit = Object.freeze({
    HOUR:  1,
    DAYS:  2,
    MONTH: 3,
    YEAR:  4
});

const MonthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getUnit(initialTimestamp, finalTimestamp) {
    let difference = finalTimestamp - initialTimestamp;

    // Less than 2 days
    if ( difference < 2 * Milliseconds.DAY )
        return Unit.HOUR;

    // Less than 2 months
    if ( difference < 2 * Milliseconds.MONTH )
        return Unit.DAYS;

    // Less than 2 years
    if ( difference < 2 * Milliseconds.YEAR )
        return Unit.MONTH;

    // Default to years
    return Unit.YEAR;
}

function getNumberUnits(unit, initialTimestamp, finalTimestamp) {
    let difference = getFloorTimeByUnit(unit, finalTimestamp) - getFloorTimeByUnit(unit, initialTimestamp);
    
    switch (unit) {
        case Unit.HOUR:
            return Math.round(difference / Milliseconds.HOUR);

        case Unit.DAYS:
            return Math.round(difference / Milliseconds.DAY);

        case Unit.MONTH:
            return Math.round(difference / Milliseconds.MONTH);

        case Unit.YEAR:
            return Math.round(difference / Milliseconds.YEAR);
    
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
        case Unit.HOUR:
            time.timestamp = op(timestamp, Milliseconds.HOUR);
            time.value = new Date(time.timestamp).getHours() + "h";
            break;
        
        case Unit.DAYS:
            time.timestamp = op(timestamp, Milliseconds.DAY);
            time.value = new Date(time.timestamp).getDate();
            break;

        case Unit.MONTH:
            time.timestamp = op(timestamp, Milliseconds.MONTH);
            time.value = MonthNamesShort[new Date(time.timestamp).getMonth()];
            break;

        case Unit.YEAR:
            time.timestamp = op(timestamp, Milliseconds.YEAR);
            time.value = new Date(time.timestamp).getFullYear();
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
        case Unit.HOUR:
            date.setHours(date.getHours(),0,0,0);
            break;

        case Unit.DAYS:
            date.setHours(0,0,0,0);
            break;

        case Unit.MONTH:
            date.setDate(1);
            date.setHours(0,0,0,0);
            break;

        case Unit.YEAR:
            date.setMonth(0);
            date.setDate(1);
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
    getFloorTimeByUnit : getFloorTimeByUnit,
    Unit : Unit,
    Milliseconds : Milliseconds
}