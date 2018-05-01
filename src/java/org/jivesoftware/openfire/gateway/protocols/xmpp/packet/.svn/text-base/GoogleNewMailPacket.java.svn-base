/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.jivesoftware.openfire.gateway.protocols.xmpp.packet;

/**
 *
 * @author Dax
 */

import org.jivesoftware.smack.packet.IQ;
import org.jivesoftware.smack.packet.PacketExtension;
import org.jivesoftware.smack.provider.IQProvider;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;
//import org.apache.log4j.Logger;

import java.util.Vector;
import java.util.Date;
import java.util.ArrayList;
import java.util.Arrays;
import java.io.IOException;

public class GoogleNewMailPacket extends IQ {

    public static String ELEMENT_NAME = "new-mail";
    public static String NAMESPACE = "google:mail:notify";

    @Override
    public String getChildElementXML() {
        return "<" + ELEMENT_NAME + " xmlns=\"" + NAMESPACE + "\"/>";
    }
    
    public static class Provider implements IQProvider {

        public Provider() {
            super();
        }

        public IQ parseIQ(XmlPullParser parser) throws Exception {
            int eventType = parser.getEventType();
            while (eventType != XmlPullParser.END_DOCUMENT) {
                eventType = parser.next();
            }
            return new GoogleNewMailPacket();
        }
    }
    
}
