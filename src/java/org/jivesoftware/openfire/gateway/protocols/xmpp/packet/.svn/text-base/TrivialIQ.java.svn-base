package org.jivesoftware.openfire.gateway.protocols.xmpp.packet;

import org.jivesoftware.smack.packet.IQ;
import org.jivesoftware.smack.packet.PacketExtension;
import org.jivesoftware.smack.provider.IQProvider;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.util.Vector;
import java.util.Date;
import java.util.ArrayList;
import java.util.Arrays;
import java.io.IOException;

public class TrivialIQ extends IQ {

    private String xml = "";

    public TrivialIQ() {
    }

    public void setChildElementXML(String s) {
        xml = s;
    }

    public String getChildElementXML() {
        if ( true ) return "papo";
        return xml;
    }

    public static class Provider implements IQProvider {

        public IQ parseIQ(XmlPullParser parser) throws Exception {

            String xmlread = "";

            int eventType = parser.getEventType();

            while (eventType != XmlPullParser.END_DOCUMENT) {
                if (eventType == XmlPullParser.START_TAG) {

                    if (parser.getName().equals("iq")) {
                        continue;
                    }
                    xmlread += "<" + parser.getName();
                    String attributes = "";
                    for (int i = 0; i < parser.getAttributeCount(); i++) {
                        attributes += " " + parser.getAttributeName(i) + "=\"" + parser.getAttributeValue(i) + "\"";
                    }

                    if (parser.isEmptyElementTag()) {
                        xmlread += attributes + "/>";
                    } else {
                        xmlread += attributes + ">";
                    }
                } else if (eventType == XmlPullParser.END_TAG) {

                    if (parser.getName().equals("iq")) {
                        continue;
                    }
                    xmlread += "</" + parser.getName() + ">";
                } else if (eventType == XmlPullParser.TEXT) {
                    xmlread += parser.getText();
                }
                eventType = parser.next();
            }

            TrivialIQ toret = new TrivialIQ();
            toret.setChildElementXML(xmlread);
            return toret;

        }
    }
}