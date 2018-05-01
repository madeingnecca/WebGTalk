var WINDOW_HEIGHT = 550;
var WINDOW_WIDTH = 310;
var TOOLBAR = "yes";
var LOCATION = "no";
var STATUS = "no";
var MENUBAR = "no";
var SCROLLBARS = "no";
var RESIZABLE = "no";

var LAUNCH_BTN = "launchBtn";
var PROFILE_FORM = "ProfileEdit";
var LOG_DIV = "log";
var FORM_DIV = "form";
var ENV_DIV = "environment";
var MENU_DIV = "Menu";
var MAIL_DIV = "mailViewer";
var CONVERSATION_DIV = "conversation";
var WRITEMESSAGE_DIV = "writeMessage";
var ADDCONTACT_DIV ="addContact";
var CONTACTS_DIV = "Contacts";
var SELECTSTATUS = "selectStatusID";
var SELECTDESC = "statusDesc";
var MESSAGE_DEST ="destContact";
var ADDCONTACT_INPUT = "addInput";
var ADDCONTACT_DEFAULT = "<Inserisci un indirizzo email>";
var ADDPROFILE_DEFAULT = "<Stato personale>"
var ENTER = 13;

var SMILES = new Array();
SMILES[":-\\)\\)"] = "Images/smiles/3.png";
SMILES[":-\\)"] = "Images/smiles/1.png";
SMILES[";-\\)"] = "Images/smiles/2.png";
SMILES[":-P"] = "Images/smiles/4.png";
SMILES[":-p"] = "Images/smiles/4.png";
SMILES[";-P"] = "Images/smiles/5.png";
SMILES[";-p"] = "Images/smiles/5.png";
SMILES[":-D"] = "Images/smiles/6.png";
SMILES[":-d"] = "Images/smiles/6.png";
SMILES[":-\\*"] = "Images/smiles/7.png";
SMILES[":-\\("] = "Images/smiles/8.png";
SMILES[":-'\\("] = "Images/smiles/9.png";
SMILES["B-\\)"] = "Images/smiles/10.png";
SMILES["b-\\)"] = "Images/smiles/10.png";


var connection = null;
var currentTab = "contatti";

function switchTab( to ) {
    var currentDiv = document.getElementById( currentTab );
    
    if ( currentDiv )  {
        doUnselect( currentDiv );
        
        if ( currentTab != "mail"  && currentTab != "contatti" ) {
            var mns = document.getElementById("messageText").value;
            connection.getConversationByEmail( currentTab ).setCurrentMessageNotSent( mns );
        }
    }
    
    doSelect( document.getElementById( to ) );
    currentTab = to;
}

function showContacts(){
    document.getElementById(MAIL_DIV).style.display = "none";
    document.getElementById(CONVERSATION_DIV).style.display = "none";
    document.getElementById(WRITEMESSAGE_DIV).style.display = "none";
    document.getElementById(ADDCONTACT_DIV).style.display = "block";
    document.getElementById(CONTACTS_DIV).style.display = "block";
        
    // non sto chattando con nessuno
    document.getElementById(MESSAGE_DEST).value = "";
        
    switchTab( "contatti" );
}

function showMails(){
    document.getElementById(CONTACTS_DIV).style.display = "none";
    document.getElementById(CONVERSATION_DIV).style.display = "none";
    document.getElementById(WRITEMESSAGE_DIV).style.display = "none";
    document.getElementById(ADDCONTACT_DIV).style.display = "block";
    document.getElementById(MAIL_DIV).style.display = "block";
    
    switchTab( "mail" );
}

function showConversation( contactMail ){
    
    var d = document.getElementById(contactMail);
    stopBlink( d );
    switchTab( contactMail );
    
    document.getElementById(CONTACTS_DIV).style.display = "none";
    document.getElementById(MAIL_DIV).style.display = "none";
    document.getElementById(ADDCONTACT_DIV).style.display = "none";
    var form = document.getElementById(WRITEMESSAGE_DIV);
    form.style.display = "block";
    var input = document.getElementById(MESSAGE_DEST);
    input.value = contactMail;
    var textarea = document.getElementById("messageText");
    textarea.value = connection.getConversationByEmail( contactMail ).getCurrentMessageNotSent();
    document.getElementById(CONVERSATION_DIV).style.display = "block";

}

function cutContactDescription( desc ){
    var s = desc;
    if(s.length > 25)
        s = s.substring(0,25) + "...";
    return s;
}

function refreshContacts(){
    var body = document.getElementById(CONTACTS_DIV);
    var html = "";
    contacts = connection.getContacts();
    for(var c in contacts){
        if(contacts[c] != undefined){
            
            if ( connection.getProfile().getViewOfflines() == 0  && contacts[c].getType() == TYPE_UNAVAILABLE )
                continue;
            
            html += "<div class='contact'>";
            html += "<a href='javascript:createConversation(\"" + c + "\",true)'>";
            if( contacts[c].getType() == TYPE_UNAVAILABLE ) { 
                html += "<img class='statusImage' alt='Offline' src='Images/status_offline.png'/>";
            }
            else{
                switch(contacts[c].getStatusID()){
                    case MODE_AVAILABLE:  html += "<img class='statusImage' alt='Online' src='Images/status_avail.png'/>";
                        break;
                    case MODE_XA:      html += "<img class='statusImage' alt='Extended Away' src='Images/status_xa.png'/>";
                        break;
                    case MODE_AWAY:    html += "<img class='statusImage' alt='Away' src='Images/status_idle.png'/>";
                        break;
                    case MODE_DND:    html += "<img class='statusImage' alt='Busy' src='Images/status_busy.png'/>";
                        break;
                }
            }
            html += contacts[c].getName();
            var desc = cutContactDescription(contacts[c].getStatusDesc());
            if (desc == "") desc = "&nbsp;";
            html += "<span>"+ desc + "</span>";
            html += "</a><div class='closeImage' onclick='deleteContact(\""+ c +"\")'></div></div>";
        }
    }
    body.innerHTML = html;
}   

function refreshMails(){
    var body = document.getElementById(MAIL_DIV);
    var html ="";
    var mails = connection.readMails();
    for(var i=0; i<mails.length; i++){
        html += "<div class='mail'>";
        html += "<span class='From'>From:";
        html += "<span class='FromContent'>"+ mails[i].getFrom() + "</span></span>";
        html += "<span class='Object'>Object:";
        html += "<span class='ObjectContent'>"+ mails[i].getSubject() + "</span></span>";
        html += "<span class='Content'>" + mails[i].getBody() + "</span>";
    }
    body.innerHTML = html;
    stopBlink( document.getElementById("mail") );
}

function refreshConversation( contactMail ){
    var body = document.getElementById(CONVERSATION_DIV);
    var conversation = connection.getConversationByEmail(contactMail);
    if (conversation != undefined){
        var html = "";
        var messages = conversation.getMessages();
        for ( var i=0; i < messages.length; i++){
            html += "<span class='sender'>" + messages[i].getFrom();
            var date = messages[i].getDate();

            html += "</span>";
            html += "<span class='text'>" + messages[i].getBody() + "</span>";
        }
        if ( connection.getProfile().getViewSmiles() == 1 ) {
            for ( var smile in SMILES ) {
                var re = new RegExp( smile, "g");
                html = html.replace( re, "<img src='" + SMILES[ smile ] + "'>" );
            }
        }
        body.innerHTML = html;
    }
    var div = document.getElementById("body"); 
    div.scrollTop = div.scrollHeight;
}

function refreshMenu(){
    var sMenu = "<div class='tabConversation' id='contatti'><a "+
        " href='javascript: refreshContacts(); showContacts();'>Contatti</a></div>" +
        "<div class='tabConversation' id='mail'><a  href='javascript: refreshMails(); "+
        "showMails();'>Mail</a></div>";
    var conv = connection.getConversations();
    for(var c in conv){
        if (conv[c] != undefined){
            sMenu +=  "<div class='tabConversation' id='" + c + "'><div style='float: left;'><a  class='conversation' "+ 
                "href='javascript:showConversation(\"" + c + 
                "\");refreshConversation(\"" + c + "\");'>";
            var contact = connection.getContactByEmail(c);    
            sMenu += contact.getName() + "</a></div><div class='tabImage'"+
                "onclick='closeConversation(\"" + c + "\")'></div></div>";  
        }
    }  
    var div = document.getElementById(MENU_DIV);
    div.innerHTML = sMenu;
}

function createConversation( contactMail, view ){
    if(connection.getConversationByEmail(contactMail) == null)
        connection.addConversation(contactMail);
    refreshMenu();
    if(view){
        showConversation(contactMail);
        refreshConversation(contactMail);
            
    } 
}

function changeStatus(){
    var d = document.getElementById(SELECTSTATUS);
    connection.getProfile().setStatusID(d.options[d.selectedIndex].value);
    d = document.getElementById(SELECTDESC);
    d.className = "notClicked";
    var tosend;
    
    if (d.value == "")
        d.value = ADDPROFILE_DEFAULT;
    
    if ( d.value != ADDPROFILE_DEFAULT ) 
        tosend = d.value;
    else 
        tosend = "";
    
    connection.getProfile().setStatusDesc( tosend );
    connection.sendProfileUpdate();
}

function cleanAddInput(){
    var x = document.getElementById(ADDCONTACT_INPUT);
    x.className = "clicked";
    x.value="";
}

function restoreAddInput(){
    var x = document.getElementById(ADDCONTACT_INPUT);
    x.className = "notClicked";
    if (x.value == "")
        x.value=ADDCONTACT_DEFAULT;
}

function fixChangeStatusInput() {
    var x = document.getElementById(SELECTDESC);
    x.className = "clicked";
    if ( x.value == ADDPROFILE_DEFAULT )
        x.value = "";
        
}

function addContact(){
    var x = document.getElementById(ADDCONTACT_INPUT);
    if (x.value.indexOf("@") == -1){
        alert("Indirizzo mail non valido!");
    }else{
        connection.sendContactRequest(x.value);
    }        
    x.value = ADDCONTACT_DEFAULT;
    return false;
}

function onEnterPressedSendMessage( key ) {
    var keyPressed = key.charCode || key.keyCode;
    if ( keyPressed == ENTER )
        return sendMessage();
}

function sendMessage(){
    var input = document.getElementById(MESSAGE_DEST);
    var destcontact = input.value;
    var textarea = document.getElementById("messageText");
    if(textarea.value == "") return false;
    connection.sendMessage(destcontact, textarea.value);
    connection.getConversationByEmail( destcontact ).setCurrentMessageNotSent( "" );
    textarea.value="";
    refreshConversation(destcontact);
    return false;
}

function deleteContact(contact_email){
    connection.deleteContact(contact_email);
    if(connection.getConversationByEmail(contact_email) != null)
        connection.removeConversation(contact_email);
    refreshMenu();
    refreshContacts();
}

function closeConversation(contact_email){
    connection.removeConversation(contact_email);
    refreshMenu();
    showContacts(); 
}

// lancia applicazione alla pressione del tasto "lancia applicazione" in index.jsp
function launchApp() {

    var btn = document.getElementById( LAUNCH_BTN );
    btn.disabled = true;
    btn.className = "disabled";

    var features = "width=" +WINDOW_WIDTH;
    features += ", height="+WINDOW_HEIGHT;
    features += ", toolbar"+TOOLBAR;
    features += ", location"+LOCATION;
    features += ", status="+STATUS;
    features += ", menubar="+MENUBAR;
    features += ", scrollbars="+SCROLLBARS;
    features += ", resizable="+RESIZABLE;

    window.open( "webgtalk.html", "webgtalk", features );
       
}

// riabilita il tasto "lancia applicazione" alla chiusura dell'app
function closeApp() {
    var btn = window.opener.document.getElementById( LAUNCH_BTN );
    btn.disabled = false;
    btn.className = "enabled";
    if ( connection != null ) {
        connection.disconnect();
    }
}

function hideDiv( el ) {
    el.style.display = "none";
    //el.style.position = "absolute";
}

function showDiv( el, restoreScroll ) {
    el.style.display = "block";
    //el.style.position = "relative";
    if ( restoreScroll ) 
        window.scroll(0,0);
}

function repaintLog() {
    var log = connection.getLog();
    var html = "";
    for ( var i = 0; i < log.length; i++ ) 
        html += log[ i ] + "<br />";
    
    document.getElementById( LOG_DIV ).innerHTML = html;
}

function appendError() {
    hideDiv( document.getElementById( FORM_DIV ) );
    hideDiv( document.getElementById( ENV_DIV ) ); 
    showDiv( document.getElementById( LOG_DIV ), true );
    var html = "<br><br><button onclick='mainPage();'>Riavvia WebGtalk</button>";
    document.getElementById( LOG_DIV ).innerHTML += html;
}

function mainPage() {
    showDiv( document.getElementById( FORM_DIV ), true );
    hideDiv( document.getElementById( LOG_DIV ) );
    hideDiv( document.getElementById( ENV_DIV ) );  
    connection = null;
}

function sessionStart(){
    hideDiv( document.getElementById( LOG_DIV ) );
    showDiv( document.getElementById( ENV_DIV ),true);
    var nameDiv = document.getElementById("usernamefix");
    nameDiv.value = connection.getProfile().getName();
    document.getElementById(SELECTDESC).value = ADDPROFILE_DEFAULT;
    showContacts();
    refreshContacts();
    updateStatus();
    document.getElementById("messageText").onkeydown=onEnterPressedSendMessage;
    document.getElementById("statusDesc").value = ADDPROFILE_DEFAULT;
}

function updateConversation(conv){
    var input = document.getElementById(MESSAGE_DEST);
    var dest = conv.getDest().getEmail();
    var conversations = connection.getConversations();
    if(input.value == dest){
        refreshConversation(dest);
        switchTab(dest);
    }else {
        doBlink( document.getElementById( dest ) );
    }
}

function doBlink( div ) {
    div.className = "tabConversationBlink";
}

function stopBlink( div ) {
    div.className = "tabConversation";
}

function doSelect( div ) {
    div.className = "tabConversationSelected";
}

function doUnselect( div ) {
    div.className = "tabConversation";
}
function updateMail(){
    var d = document.getElementById(MAIL_DIV);
    if (d.style.display == "block")
        refreshMails();
    else{
        var d = document.getElementById("mail");
        doBlink( d );
    }
}

function requestContact(contact){
    if(confirm("Hai ricevuto una richiesta di amicizia da "+ contact.getEmail() +"\n" +
        "Vuoi accettare?")) {
        connection.acceptContact(contact.getEmail(),contact.getName(),contact.getStatusID(),contact.getStatusDesc(),contact.getType());
        refreshContacts();
    }
    else
        connection.denyContact(contact.getEmail());
}

function updateStatus(){
    var d = document.getElementById(SELECTSTATUS);
    d.selectedIndex = connection.getProfile().getStatusID();
    d = document.getElementById(SELECTDESC);
    var newstatusdesc = connection.getProfile().getStatusDesc();
    if ( newstatusdesc != ""){ 
        d.value = newstatusdesc;
    }
}

function submitProfile() {

    var form = document.getElementById( PROFILE_FORM );

    // todo: fare trim dei value
    var host = form.host.value;
    var port = form.port.value;
    var user = form.user.value;
    var password = form.pass.value;

    var statusID = form.statusID.options[ form.statusID.selectedIndex ].value;
    var statusDesc = form.statusDesc.value;
    
    var useSSL = form.useSSL[0].checked ? form.useSSL[0].value : form.useSSL[1].value;
    var isGoogle = form.isGoogle[0].checked ? form.isGoogle[0].value : form.isGoogle[1].value;
    var viewOfflines = form.viewOfflines[0].checked ? form.viewOfflines[0].value : form.viewOfflines[1].value;
    var viewSmiles = form.viewSmiles[0].checked ? form.viewSmiles[0].value : form.viewSmiles[1].value;
    useSSL = parseInt( useSSL );
    isGoogle = parseInt( isGoogle );
    viewOfflines = parseInt( viewOfflines );
    viewSmiles = parseInt( viewSmiles );

    connection = new Connection( host,
    port,
    user,
    password,
    statusID,
    statusDesc,
    useSSL,
    isGoogle,
    viewOfflines,
    viewSmiles );  
                                 
    hideDiv( document.getElementById( FORM_DIV ) );
    showDiv( document.getElementById( LOG_DIV ), true );
    
    connection.onLogUpdated = function () { repaintLog(); };
    connection.onSessionStarted = function() {
        sessionStart();
    };
    connection.onConnectionError = function() { 
        appendError();
    };
    
    connection.onMyStatusChanged = function() {
        updateStatus();
    };
    
    connection.onMessageReceived = function( conv ) {
        window.focus();
        if ( window.getAttention ) window.getAttention();
        refreshMenu();
        updateConversation( conv );
    };
    
    connection.onMailReceived = function() {
        updateMail();
    };
    
    connection.onContactChanged = function( changedContact ) {
        refreshContacts();
    };
    
    connection.onContactRequest = function( c ) { 
        requestContact( c );
    };

    connection.connect();
}

