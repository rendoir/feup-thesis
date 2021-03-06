/* TIME UTILS */
const Milliseconds = Object.freeze({
    MILLISECOND: 1,
    CENTISECOND: 10,
    DECISECOND:  100,
    SECOND:      1000,
    MINUTE:      1000 * 60,
    HOUR:        1000 * 60 * 60,
    DAY:         1000 * 60 * 60 * 24,
    MONTH:       1000 * 60 * 60 * 24 * 31,
    YEAR:        1000 * 60 * 60 * 24 * 366
});

const Unit = Object.freeze({
    MILLISECOND: 1,
    CENTISECOND: 2,
    DECISECOND:  3,
    SECOND:      4,
    MINUTE:      5,
    HOUR:        6,
    DAYS:        7,
    MONTH:       8,
    YEAR:        9
});

const MonthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getUnit(initialTimestamp, finalTimestamp) {
    let difference = finalTimestamp - initialTimestamp;

    // Less than 2 centiseconds
    if ( difference < 2 * Milliseconds.CENTISECOND )
        return Unit.MILLISECOND;

    // Less than 2 deciseconds
    if ( difference < 2 * Milliseconds.DECISECOND )
        return Unit.CENTISECOND;

    // Less than 2 seconds
    if ( difference < 2 * Milliseconds.SECOND )
        return Unit.DECISECOND;

    // Less than 2 minutes
    if ( difference < 2 * Milliseconds.MINUTE )
        return Unit.SECOND;

    // Less than 2 hours
    if ( difference < 2 * Milliseconds.HOUR )
        return Unit.MINUTE;

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
        case Unit.MILLISECOND:
            return Math.round(difference / Milliseconds.MILLISECOND);

        case Unit.DECISECOND:
            return Math.round(difference / Milliseconds.DECISECOND);

        case Unit.CENTISECOND:
            return Math.round(difference / Milliseconds.CENTISECOND);

        case Unit.SECOND:
            return Math.round(difference / Milliseconds.SECOND);

        case Unit.MINUTE:
            return Math.round(difference / Milliseconds.MINUTE);

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
        case Unit.MILLISECOND:
            time.timestamp = op(timestamp, Milliseconds.MILLISECOND);
            time.value = new Date(time.timestamp).getMilliseconds() + "ms";
            break;

        case Unit.CENTISECOND:
            time.timestamp = op(timestamp, Milliseconds.CENTISECOND);
            time.value = new Date(time.timestamp).getMilliseconds() + "ms";
            break;

        case Unit.DECISECOND:
            time.timestamp = op(timestamp, Milliseconds.DECISECOND);
            time.value = new Date(time.timestamp).getMilliseconds() + "ms";
            break;

        case Unit.SECOND:
            time.timestamp = op(timestamp, Milliseconds.SECOND);
            time.value = new Date(time.timestamp).getSeconds() + "s";
            break;

        case Unit.MINUTE:
            time.timestamp = op(timestamp, Milliseconds.MINUTE);
            time.value = new Date(time.timestamp).getMinutes() + "m";
            break;

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
        case Unit.MILLISECOND:
            break;

        case Unit.CENTISECOND:
            date.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), Math.floor(date.getMilliseconds() / 10) * 10);
            break;

        case Unit.DECISECOND:
            date.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), Math.floor(date.getMilliseconds() / 100) * 100);
            break;

        case Unit.SECOND:
            date.setHours(date.getHours(), date.getMinutes(), date.getSeconds(),0);
            break;

        case Unit.MINUTE:
            date.setHours(date.getHours(), date.getMinutes(),0,0);
            break;

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


/* POLYGON SIMPLIFICATION UTILS */
/* Adapted from the work of Vladimir Agafonkin (https://github.com/mourner/simplify-js) */
// Square distance between 2 points
function getSqDist(p1, p2) {

    var dx = p1.x - p2.x,
        dy = p1.y - p2.y;

    return dx * dx + dy * dy;
}

// Square distance from a point to a segment
function getSqSegDist(p, p1, p2) {

    var x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2.x;
            y = p2.y;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
}

// Basic distance-based simplification
function simplifyRadialDist(points, sqTolerance) {

    var prevPoint = points[0],
        newPoints = [prevPoint],
        point;

    for (var i = 1, len = points.length; i < len; i++) {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance) {
            newPoints.push(point);
            prevPoint = point;
        }
    }

    if (prevPoint !== point) newPoints.push(point);

    return newPoints;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        points[index].shouldBeVisible = true;
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

// Simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(points, sqTolerance) {
    var last = points.length - 1;

    var simplified = [points[0]];
    points[0].shouldBeVisible = true;
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
}

// Both algorithms combined for increased performance
function simplify(points, tolerance, highestQuality) {

    if (points.length <= 2) return points;

    var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);

    return points;
}


module.exports = {
    getDateString : getDateString,
    getUnit : getUnit,
    getNextTimeByUnit : getNextTimeByUnit,
    getPreviousTimeByUnit : getPreviousTimeByUnit,
    getCurrentTimeByUnit : getCurrentTimeByUnit,
    getNumberUnits : getNumberUnits,
    getFloorTimeByUnit : getFloorTimeByUnit,
    Unit : Unit,
    Milliseconds : Milliseconds,
    simplify : simplify
}