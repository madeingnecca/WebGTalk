function Conversation( contact ){

    var dest = contact;
    var messages = new Array();
    var date = new Date();
    var currentMessageNotSent = "";
   
    var lastmsg = null;
       
    this.getDest = function() { return dest; };
    this.setDest = function(d) { dest = d; };
    
    this.getMessages = function() { return messages; };
    this.getLastMessage = function(){
        if (lastmsg != null){
            return messages[lastmsg - 1];
        }else{return null;}
    };
    this.addMessage = function(msg) { lastmsg = messages.push(msg);};
    
    this.getDataInizio = function() { return date; };
    this.setDataInizio = function(d) { date = d; };
    
    this.setCurrentMessageNotSent = function( s ) {
        currentMessageNotSent = s;
    };
    
     this.getCurrentMessageNotSent = function() {
        return currentMessageNotSent;
    };   
}