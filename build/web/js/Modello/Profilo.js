function Profile( n,
                  h,
                  p,
                  u,
                  d,
                  pw,
                  ty,
                  sid,
                  sdesc,
                  ssl,
                  google,
                  off,
                  smiles ) {
                  

    var name = n;
    var host = h;
    var port = p;
    var password = pw;
    var statusID = sid;
    var statusDesc = sdesc;
    var useSSL = ssl;
    var isGoogle = google;
    var viewOfflines = off;
    var viewSmiles = smiles;
    var user = u;
    var domain = d;
    var jid = user + "@" + domain;
    var fulljid = jid;
    var lastTimeMailSeen;
    var type = ty;
    
    this.getType = function() { return type; };
    this.setType = function(t) { type = t; };
    
    
    this.getFullJID = function() {
        return fulljid;
    };
    
    this.setFullJID = function( fjid ) {
        fulljid = fjid;
    };
    
    this.setLastTimeMailSeen = function( lastTime ) {
        lastTimeMailSeen = lastTime;
    };
    
    this.getLastTimeMailSeen = function() {
        return lastTimeMailSeen;
    };
    
    this.getJID = function() { return jid };
    this.getName = function () { return name; };
    this.setName = function(n) { name = n; };
    this.getDomain = function() { return domain; };
    this.setDomain = function( d ) { domain = d; };
    
    this.getHost = function () { return host; };
    this.setHost = function(h) { host = h; };
    
    this.getPort = function() { return port; };
    this.setPort = function(p) { port = p; };
    
    this.getUser = function() { return user; };
    this.setUser = function(u) { user = u; };
    
    this.getPassword = function() { return password; };
    this.setPassword = function(p) { password = p; };
    
    this.getStatusID = function() { return statusID; };
    this.setStatusID = function(s) { statusID = s; };

    this.getStatusDesc = function() { return statusDesc; };
    this.setStatusDesc = function(s) { statusDesc = s; };
     
    this.getUseSSL = function() { return useSSL; };
    this.setUseSSL = function(s) { useSSL = s; };
    
    this.getIsGoogle = function() { return isGoogle;};
    this.setIsGoogle = function(i) { isGoogle = i; };
    
    this.getViewOfflines = function() { return viewOfflines; };
    this.setViewOfflines = function(v) { viewOfflines = v; };
    
    this.getViewSmiles = function() { return viewSmiles; };
    this.setViewSmiles = function(v) { viewSmiles = v; };
}