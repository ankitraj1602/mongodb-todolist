module.exports.getDate = formatDate; // export the function , so it binds the function to the calling object
module.exports.getDay = formatDay; //export the formatDay function
function formatDate(){
    var date = new Date();
    var today = date.getDay();

    var day = "what";
    var options = { weekday: 'long', day: 'numeric' ,month: 'long' };
    var today  = new Date();
    day = today.toLocaleString("en-US", options);
    return day;
}

function formatDay(){
    var date = new Date();
    var today = date.getDay();

    var day = "what";
    var options = { weekday: 'long'};
    var today  = new Date();
    day = today.toLocaleString("en-US", options);
    return day;
}