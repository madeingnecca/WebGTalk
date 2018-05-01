var PROXY_SERVLET = "ProxyServlet";

var NO_PROXY_CONN = "Proxy non operativo";
var PROXY_OK = "Proxy operativo";

var NT_REFRESH_DELAY = 300;
var HTTP_COMPLETED = 4;
var HTTP_OK = 200;

var MODE_AVAILABLE = 1;
var MODE_AWAY = 2;
var MODE_XA = 3;
var MODE_DND = 4;

var TYPE_AVAILABLE = 0;
var TYPE_ERROR = 1;
var TYPE_SUBSCRIBE = 2;
var TYPE_UNAVAILABLE = 3;
var TYPE_UNSUBSCRIBE = 4;
var TYPE_UNSUBSCRIBED = 5;

var OFFLINE = TYPE_UNAVAILABLE;

var PENDING_ADD_REQUEST = "Invitato - in attesa di conferma";

function Connection( host,
                      port,
                      user,
                      password,
                      statusID,
                      statusDesc,
                      useSSL,
                      isGoogle,
                      viewOfflines,
                      viewSmiles ){
     
    var usercopy = user;
    var user1 = usercopy.substring( 0, usercopy.indexOf("@") );
    var domain = usercopy.substring( usercopy.indexOf("@")+1, usercopy.length );
    
    var type = TYPE_AVAILABLE;
    if ( statusID == OFFLINE ) {
        statusID = MODE_DND;
        type = TYPE_UNAVAILABLE;
    }
    
    var profile = new Profile( user,
                      host,
                      port,
                      user1,
                      domain,
                      password,
                      type,
                      statusID,
                      statusDesc,
                      useSSL,
                      isGoogle,
                      viewOfflines,
                      viewSmiles );
                      
    var contacts = new Array();
    var conversations = new Array();
    var emails = new Array();
    var log = new Array();
    var networkThreadID;
    var sessionActive = false;
    
    this.getNetworkThreadID = function() {
      return networkThreadID;
    };
    
    this.setNetworkThreadID = function( ntid ){
        networkThreadID = ntid; 
    };
    
    this.isActive = function() {
        return sessionActive;
    };
    
    this.activate = function() {
        sessionActive = true;
    };
    
    // metodo statico
    function networkThread( conn ) {
        try {
            var url = PROXY_SERVLET + "?a=wait";
            var req = createXMLHttpRequest();
            req.onreadystatechange = function() {
                if ( !conn.isActive() ) {
                    window.clearInterval( conn.getNetworkThreadID() );    
                    return;
                }  
                if ( req.readyState == HTTP_COMPLETED && req.status == HTTP_OK ) {
                    onReceivedPacketFromProxy( req, conn );
                }
            }
            req.open( "GET", url );
            req.send( null );  
        } catch ( e ) {
            conn.onConnectionError();
        }        
    }
    
    this.getProfile = function() { return profile;}
        
    this.getLog = function() { return log; }
    this.setLog = function(l) { log = l; }

    function raiseException( conn, error ) {
       conn.addLog( error );
       conn.disconnect();
       conn.onConnectionError();
    }
    
    function createXMLHttpRequest() {
        var xmlhttp = null;
        try {
            xmlhttp = new XMLHttpRequest();
        } catch ( e ) {
            try {
                xmlhttp = new ActiveXObject( "Msxml2.XMLHTTP" );
            }
            catch ( e1 ) {
                xmlhttp = new ActiveXObject( "Microsoft.XMLHTTP" );
            }
        }
        return xmlhttp;
    }
     

    function sendSimplePacket( qs ) {
        var url = PROXY_SERVLET + "?" + qs
        var req = createXMLHttpRequest();
        req.onreadystatechange = function(){};
        req.open( "GET", url );
        req.send( null );  
    }

    this.addLog = function( tolog ) {
        log.push( tolog );
        this.onLogUpdated();
    }
    
    
    function onReceivedResponseFromProxy( req, conn ) {
        var response = req.responseText;
        if ( response == "ERR" ) {
            raiseException( conn, NO_PROXY_CONN );
            return;
        }
        conn.addLog( PROXY_OK );
        beginLogin( conn ); 
    }
    
    
    function beginLogin( conn ) {
        // effettuo login in modalità invisibile(?)
        var userName = conn.getProfile().getUser();
        var passwd = conn.getProfile().getPassword();
        var url = PROXY_SERVLET + "?a=login&u=" + userName + "&p="+passwd;
        var req = createXMLHttpRequest();
        req.onreadystatechange = function() {
            if ( req.readyState == HTTP_COMPLETED && req.status == HTTP_OK ) {  
              onLoginResponse( req, conn );
            }
        }
        req.open( "GET", url );
        req.send( null );  
    }
    
    
    
    function onLoginResponse( req, conn ) {
        var xmlpacket = req.responseXML;
        if ( xmlpacket.documentElement.tagName == "error") {
            raiseException( conn, "Login failed" );
            return;
        }
        conn.addLog( "Login successful" );
        // mando statusid e statusdesc impostati all'inizio
        conn.sendProfileUpdate();
        beginSession( conn );
    }
   
    
    function beginSession( conn ) {
        conn.activate();
        conn.onSessionStarted();
        var ntid = window.setInterval( networkThread, NT_REFRESH_DELAY, conn );
        conn.setNetworkThreadID( ntid );
        conn.sendMailNotifyRequest();
    }
  
    function getStatusID( str ) {

        if ( str == null || str == undefined ) str = "";

        var status = new Array();
        status["available"] = status[""] = MODE_AVAILABLE;
        status["away"] = MODE_AWAY;
        status["xa"] = MODE_XA;
        status["dnd"] = MODE_DND;
        return status[ str ];
    }    
    
  function onReceivedPacketFromProxy(req, conn ) {
        //window.alert( req.responseText );
        var packet = req.responseXML.documentElement;
        var packetList = packet;
        var jid;
        if (packetList.tagName == "iq") {
            var query = packetList.getElementsByTagName("query").item(0);
            if ( query && query.getAttribute("xmlns") == "jabber:iq:roster") {
                //Ricevuti dati contatto
                // prelevo gli item
                var v = query.childNodes;
                for (var i = 0; i < v.length; i++) {
                    jid = v[i].getAttribute("jid");
                    var contact;
                    if (v[i].getAttribute("subscription") == "both") {
                        // contatti nella mia lista ( anche io sono nella loro lista )
                        var name = v[i].getAttribute("name");
                        name = name == null ? jid: name;
                        contact = conn.addContact(jid,name, MODE_AVAILABLE, "", TYPE_UNAVAILABLE );
                        conn.onContactChanged( contact );
                    }
                    if (v[i].getAttribute("ask") == "subscribe") {
                        // contatti che ho aggiunto ma che devono ancora rispondere all'invito
                        var newJid;
                        try {
                            newJid = packetList.getElementsByTagName("item").item(0).getAttribute("jid");
                        } catch ( pipa ) {
                            newJid = jid;
                        }
                        jid = newJid;
                        contact = conn.addContact(jid,jid, MODE_AVAILABLE , PENDING_ADD_REQUEST, TYPE_UNAVAILABLE );
                        conn.onContactChanged( contact );
                    }
                }
            }
            
            if (conn.getProfile().getIsGoogle() == 1)
            {
                var mailbox = packetList.getElementsByTagName("mailbox").item(0);
                if( mailbox && mailbox.getAttribute("result-time") != "") {

                    var v = packetList.getElementsByTagName("mailbox").item(0).childNodes;

                    for (var i = 0; i < v.length; i++) {
                        var t = v[i];
                        var sender = t.getElementsByTagName("senders").item(0).getElementByTagName("sender").item(0).getAttribute("name");
                        var subject = t.getElemementsByTagName("subject").item(0).firstChild.nodevalue;
                        var body = t.getElemementsByTagName("snippet").item(0).firstChild.nodevalue;
                        emails.push(new Email(sender, subject, body));
                        var resultTime = parseInt( mailbox.getAttribute("result-time") );
                        conn.getProfile().setLastTimeMailSeen( new Date( resultTime ) );
                    }
                    conn.onMailReceived();
                }
                var newmail = packetList.getElementsByTagName("new-mail").item(0);
                if (newmail && newmail.getAttribute("xmlns") == "google:mail:notify") {
                    conn.sendMailNotifyRequest();
                }
            }
        }

        if (packetList.tagName == "presence") {
            jid = packetList.getAttribute("from");
            var len = jid.indexOf( "/") == -1 ? jid.length : jid.indexOf("/");
            jid = jid.substring( 0, len);
            var status;
            var statusDesc;
            try {
                status = packetList.getElementsByTagName("show").item(0).firstChild.nodeValue;;
            }
            catch ( exx ) {
                status = "available";
            }
            try {
                statusDesc = packetList.getElementsByTagName("status").item(0).firstChild.nodeValue;;
            }
            catch ( exx ) {
                statusDesc = "";
            }            
            
            if (packetList.getAttribute("type") == "subscribe") {
                var nuovo = new Contact( jid, jid,MODE_AVAILABLE, "",TYPE_UNAVAILABLE );
                window.alert( "jid passato all'oggetto: " + nuovo.getEmail() );
                window.alert( "jid vero = " + jid );
                conn.onContactRequest( nuovo );
            }
            else if (packetList.getAttribute("type") == "subscribed") {

                var newcontact = conn.addContact(jid, jid, status, statusDesc ,TYPE_AVAILABLE );
                conn.onContactChanged( newcontact );
            }
            else if (packetList.getAttribute("type") == "unsubscribed" || packetList.getAttribute("type") == "unsubscribe" ) {
                var changedContact = conn.getContactByEmail(jid);
                changedContact.setType( TYPE_UNAVAILABLE );
                conn.onContactChanged( newcontact );
            }
            else if (packetList.getAttribute("type") == "unavailable") {
                // un contatto e' andato offline
                if ( jid != conn.getProfile().getJID()) {
                  var changedContact = conn.getContactByEmail(jid);
                  changedContact.setType( TYPE_UNAVAILABLE );

                  conn.onContactChanged( changedContact );
                }
                else {
                    // ricevo che sono offline - (vaneggio del server??)
                    //conn.getProfile().setType( TYPE_UNAVAILABLE );
                    //conn.onMyStatusChanged();
                    conn.sendProfileUpdate();
                }
            }
            else if (!(packetList.hasAttribute("type"))) {
                
                if ( jid != conn.getProfile().getJID()) {
                    // ricevo status di un mio contatto
                  var changedContact = conn.getContactByEmail(jid);
                  changedContact.setStatusID(getStatusID( status ) );
                  changedContact.setStatusDesc(statusDesc);
                  changedContact.setType( TYPE_AVAILABLE );
                  conn.onContactChanged( changedContact );
                }
                else {
                  // ricevo variazione del mio status ( show, status )
                      conn.getProfile().setStatusID( getStatusID( status ) ) ;
                      
                      if ( conn.getProfile().getStatusDesc() == "" )
                          conn.getProfile().setStatusDesc(statusDesc);
                      
                      conn.onMyStatusChanged(); 
                }
            }
        }
        if ((packetList.tagName == "message") && !(packetList.hasAttribute("error")) && packetList.getElementsByTagName("body")[0] ) {
            var from = packetList.getAttribute("from");
            from = from.substring( 0, from.indexOf("/") );
            var conv = conn.addConversation(from);
            var msg = packetList.getElementsByTagName("body").item(0).firstChild.nodeValue;
            var to = packetList.getAttribute("to");
            conv.addMessage(new Message(msg, from, to));

            conn.onMessageReceived( conv );
        }
    }
    
    this.connect = function() {
        var h = this.getProfile().getHost();
        var p = this.getProfile().getPort();
        var ssl = this.getProfile().getUseSSL();
        var domain = this.getProfile().getDomain();
        var userName = this.getProfile().getUser();
        var passwd = this.getProfile().getPassword();

        if ( h == "" ){
            raiseException( this, "Host non specificato" );
        }
        
        if ( p == "NaN" ) {
            raiseException( this, "Porta non specificata" );
            return;
        }
        
        if ( userName == "" ) {
            raiseException( this, "Username non specificato" );
            return;
        }
        
        if ( passwd == "" ) {
            raiseException( this, "Password non specificata" );
            return;
        }
        
        if ( domain == "" ) {
            raiseException( this, "Dominio non specificato" );
            return;
        }
       
        var url = PROXY_SERVLET +"?h=" + h + "&p=" + p + "&s=" + ssl + "&d=" + domain;
        var req = createXMLHttpRequest();
        var oThis = this;
        req.onreadystatechange = function() {
          if ( req.readyState == HTTP_COMPLETED && req.status == HTTP_OK ) { 
              onReceivedResponseFromProxy( req, oThis);
          }
        };
        req.open( "GET", url );
        req.send( null );
    }
    
    this.disconnect = function() {
        if ( this.isActive() ) {
          var url = PROXY_SERVLET +"?a=logout";
          var req = createXMLHttpRequest();
          req.open( "GET", url );
          req.send( null );
          window.clearInterval( this.getNetworkThreadID() );
          sessionActive = false;
        }
    }
    
    this.addContact = function( email, nome, sid, sdesc, type ) { 
        if ( this.getContactByEmail( email ) == undefined ) {
            contacts[ email ] =  new Contact( email, nome, sid, sdesc, type );
        }
        return contacts[ email ];
    }
    
    this.deleteContact = function(c) {
        contacts[ c ] = undefined;
        var qs = "a=remove&jid=" + c ;
        sendSimplePacket( qs );        
    };
    
    this.getContactByEmail = function( email ) {
        return contacts[ email ];
    };
    
    this.addConversation = function(c) {        
        if ( conversations[ c ] == undefined ) {
            var dest = this.getContactByEmail( c );
            conversations[ c ] = new Conversation( dest );
        }
        return conversations[ c ];
    }; // c = contatto
    this.removeConversation = function(c) {
        conversations[ c ] = undefined;
    }; // c = conversazione
    
    this.readMails = function() { 
        return emails;
    };
    
    this.sendMessage = function( to, body ) {
        var msg = new Message( body, this.getProfile().getJID(), to );
        conversations[ to ].addMessage( msg );
        var qs = "a=msg&to=" + to + "&body=" + escape( body );
        sendSimplePacket( qs );
    };
    
    this.sendContactRequest = function( jid ) {
        var qs = "a=add&jid=" + jid;
        sendSimplePacket( qs );        
    };
    
    this.sendProfileUpdate = function() {
        var type = this.getProfile().getType();
        var id = this.getProfile().getStatusID();
        var desc = this.getProfile().getStatusDesc();
        var qs = "a=update&type=" + type + "&id=" + id + "&status=" + desc;
        sendSimplePacket( qs );          
    };
    
    this.sendMailNotifyRequest = function() {
        var time = this.getProfile().getLastTimeMailSeen();
        
        if ( time == null ) 
            time = "";
        else 
            time = time.getMilliseconds();
        
        var qs = "a=getmail&time=" + time;
        sendSimplePacket( qs );         
    };
    
    this.acceptContact = function(email, nome, sid, sdesc,type) {
        this.addContact(email, nome, sid, sdesc,type);
        var qs = "a=accept&jid=" + email;
        sendSimplePacket( qs );         
    };
    
    this.denyContact = function(email) {
    	if ( true ) return;
        var qs = "a=deny&jid=" + email;
        sendSimplePacket( qs );         
    };    
    
    this.getConversationByEmail = function( email ) {
        return conversations[ email ];
    };
    
    this.getContacts = function() {
        return contacts;
    };
    
    this.getConversations = function() {
        return conversations;
    };
    
}