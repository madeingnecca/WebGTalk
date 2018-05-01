function Message( body, from, to ){

    var date = new Date();
    var content = body;
    var sender = from;
    var receiver = to;
    
    
    this.getDate = function(d) { return date; };
    this.getBody = function(c) { return content; };
    this.getFrom = function () { return sender; };
    this.getTo = function () { return receiver; };
}



