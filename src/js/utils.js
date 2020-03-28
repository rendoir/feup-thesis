function getDateString(date) {
    return String(date.getFullYear()) + "-" +
        String(date.getMonth()+1) + "-" +
        String(date.getDate()) + "\n" + 
        String(date.getHours()) + ":" +
        String(date.getMinutes()) + ":" +
        String(date.getSeconds()) + "." +
        String(date.getMilliseconds());
}

module.exports = {
    getDateString : getDateString
}