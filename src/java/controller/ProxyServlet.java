package controller;

import java.io.*;
import java.net.URLEncoder;
import java.util.Collection;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.*;
import javax.servlet.http.*;
import org.jivesoftware.openfire.gateway.protocols.xmpp.packet.GoogleMailBoxPacket;
import org.jivesoftware.openfire.gateway.protocols.xmpp.packet.GoogleMailNotifyExtension;
import org.jivesoftware.openfire.gateway.protocols.xmpp.packet.GoogleNewMailExtension;
import org.jivesoftware.openfire.gateway.protocols.xmpp.packet.IQWithPacketExtension;
import org.jivesoftware.openfire.gateway.protocols.xmpp.packet.GoogleNewMailPacket;
import org.jivesoftware.smack.*;
import org.jivesoftware.smack.filter.OrFilter;
import org.jivesoftware.smack.filter.PacketFilter;
import org.jivesoftware.smack.filter.PacketTypeFilter;
import org.jivesoftware.smack.packet.IQ;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.PacketExtension;
import org.jivesoftware.smack.packet.Presence;
import org.jivesoftware.smack.provider.ProviderManager;

public class ProxyServlet extends HttpServlet {

    public static final String ERROR_MSG = "ERR";
    public static final String OK_MSG = "OK";
    
    private static final int     STATE_NOT_CONNECTED = 1;
    private static final int     STATE_CONNECTED = 2;
    private static final int     STATE_LOGGED = 3;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException {

        HttpSession session = request.getSession( true );
        PrintWriter out;

        XMPPConnection connection = null;
        String host = null;
        Integer port = null;
        Integer useSSL = null;
        
        Object oState = session.getAttribute( "state" );
        int state = oState == null ? STATE_NOT_CONNECTED : ( Integer ) oState;

        if ( state == STATE_NOT_CONNECTED ) {

            response.setContentType("text/html;charset=UTF-8");
            out = response.getWriter();

            Object oHost = request.getParameter( "h" );
            Object oPort = request.getParameter( "p" );
            Object oSSL = request.getParameter( "s" );
            Object oDomain = request.getParameter( "d");

            if ( oHost == null || oPort == null || oSSL == null || oDomain == null ) {
                out.print( ERROR_MSG );
                session.invalidate();
                return;
            }

            host = ( String ) oHost;
            port = Integer.valueOf( ( String ) oPort );
            useSSL = Integer.valueOf( ( String ) oSSL );
            String domain = ( String ) oDomain;

            ConnectionConfiguration cfg = new ConnectionConfiguration( host, port.intValue(), domain );
            try {
                connection = new XMPPConnection( cfg );
                connection.connect();
            }
            catch ( XMPPException e ) {
                out.print( ERROR_MSG );
                connection.disconnect();
                session.invalidate();
                return;
            }
            state = STATE_CONNECTED;
            session.setAttribute( "state", state );
            session.setAttribute( "conn", connection );

            // ho verificato i dati di connessione
            out.print( OK_MSG );
        }
        else {

            response.setContentType("text/xml");
            out = response.getWriter();
            connection = ( XMPPConnection ) session.getAttribute("conn");
            String action = ( String ) request.getParameter( "a" );

            if ( connection == null || action == null || !connection.isConnected() )  {
                out.print( "<error/>" );
                session.invalidate();
                return;
            }

            if ( action.equals( "login" ) ) {
                
                if ( state == STATE_LOGGED ) {
                    out.println("<error/>");
                    return; 
                }
                    
                String user = ( String ) request.getParameter( "u" );
                String pass = ( String ) request.getParameter( "p" );
                try {
                    connection.login(user, pass, "webgtalk", false);
                } catch (XMPPException ex) {
                    out.println( "<error/>");
                    return;
                } catch ( IllegalStateException ex1 ) {
                    out.println( "<error/>");
                    return;
                }
                				
                ProviderManager.getInstance().addIQProvider(GoogleMailBoxPacket.MAILBOX_ELEMENT,
                                                            GoogleMailBoxPacket.MAILBOX_NAMESPACE,
                                                            new GoogleMailBoxPacket.Provider());

                PacketFilter nofilter = new PacketFilter() {
                    public boolean accept( Packet p ) {
                        return true;
                    }
                };
                PacketCollector collector = connection.createPacketCollector(nofilter);
                session.setAttribute( "collector", collector );
                session.setAttribute( "state", STATE_LOGGED );
                out.println("<authok/>");
            }
            else  {
                
                if ( state != STATE_LOGGED ) {
                    out.println("<error/>");
                    return;  
                }

                if (action.equals("update")) {

                    out.println("<ok/>");
                    String type = (String) request.getParameter("type");
                    String id = (String) request.getParameter("id");
                    String status = (String) request.getParameter("status");
                    int itype = Integer.valueOf(type).intValue();
                    int statusID = Integer.valueOf(id).intValue();

                    Presence.Mode mode = Presence.Mode.available;
                    if (statusID == 1) {
                        mode = Presence.Mode.away;
                    } else if (statusID == 2) {
                        mode = Presence.Mode.xa;
                    } else if (statusID == 3) {
                        mode = Presence.Mode.dnd;
                    }

                    Presence.Type ptype = Presence.Type.available;
                    if (itype == 3) {
                        ptype = Presence.Type.unavailable;
                    }
                    Presence newStatus = new Presence(ptype, status, 24, mode);
                    connection.sendPacket(newStatus);
                } else if (action.equals("msg")) {
                    out.println("<ok/>");
                    String body = (String) request.getParameter("body");
                    String to = (String) request.getParameter("to");
                    Message message = new Message();
                    message.setBody(body);
                    message.setTo(to);
                    connection.sendPacket(message);
                } else if (action.equals("add")) {
                    String id = (String) request.getParameter("jid");
                    Presence request_add = new Presence(Presence.Type.subscribe);
                    request_add.setTo(id);
                    connection.sendPacket(request_add);
                    out.println("<ok/>");
                } else if (action.equals("accept")) {
                    String id = (String) request.getParameter("jid");
                    Presence accept_add = new Presence(Presence.Type.subscribed);
                    accept_add.setTo(id);
                    connection.sendPacket(accept_add);
                    out.println("<ok/>");
                } else if (action.equals("remove")) {
                    String id = (String) request.getParameter("jid");
                    Presence accept_add = new Presence(Presence.Type.unsubscribed);
                    accept_add.setTo(id);
                    connection.sendPacket(accept_add);
                    out.println("<ok/>");
                } else if (action.equals("deny")) {
                    String id = (String) request.getParameter("jid");
                    Presence accept_add = new Presence(Presence.Type.unsubscribe);
                    accept_add.setTo(id);
                    connection.sendPacket(accept_add);
                    out.println("<ok/>");
                } else if (action.equals("getmail")) {
                    out.println("<ok/>");
                    String time = (String) request.getParameter("time");
                    String tid = ( String ) request.getParameter( "tid");
                    String to = connection.getUser();
                    to = to.substring(0, to.indexOf("/"));
                    GoogleMailNotifyExtension gmne = new GoogleMailNotifyExtension();
                    
                    if ((tid != null) && (!tid.equals("")))
                        gmne.setNewerThanTid( new Long( tid ).longValue() );                    
                    
                    if ((time != null) && (!time.equals("")))
                        gmne.setNewerThanTime( new java.util.Date( Long.valueOf( time ).longValue() ) );
                    
                    IQWithPacketExtension mailreq = new IQWithPacketExtension( to, gmne);
                    mailreq.setFrom( connection.getUser() );
                    connection.sendPacket( mailreq );
                    request.getSession().getServletContext().log( "email req:" + mailreq.toXML() );
                } else if (action.equals("wait")) {
                    PacketCollector collector = (PacketCollector) session.getAttribute("collector");
                    Packet newpacket = collector.nextResult();
                    String tobrowser = newpacket.toXML();
                    tobrowser = tobrowser.replaceAll( "&", URLEncoder.encode( "&", "UTF-8" ) );
                    out.println(tobrowser);
                    request.getSession().getServletContext().log(tobrowser);
                } else if (action.equals("logout")) {
                    out.println("<ok/>");
                    connection.sendPacket(new Presence(Presence.Type.unavailable));
                    connection.disconnect();
                    session.invalidate();
                } else {
                    out.println("<error/>");
                }
                out.flush();
            }
        }

    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException {
        processRequest(request, response);
    }


    protected void doPost(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, IOException {
        processRequest(request, response);
    }


    public String getServletInfo() {
        return "Servlet that acts as a proxy!";
    }
}
