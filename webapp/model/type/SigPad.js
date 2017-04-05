jQuery.sap.registerModulePath("SignaturePad", "../model/type/SignaturePad");

sap.ui.define(["sap/ui/core/Control", "SignaturePad"], function(oControl, SignaturePad) {
    "use strict";
    return oControl.extend("vonovia.timesheet.model.type.SigPad", {
 
        metadata: {
            properties: {
                "width": {
                    type: "sap.ui.core.CSSSize",
                    defaultValue: "300px"
                },
                "height": {
                    type: "sap.ui.core.CSSSize",
                    defaultValue: "100px"
                },
                "thickness": {
                    type: "int",
                    defaultValue: 2
                },
                "bgcolor": {
                    type: "sap.ui.core.CSSColor",
                    defaultValue: "white"
                },
                "signcolor": {
                    type: "sap.ui.core.CSSColor",
                    defaultValue: "black"
                }
            }
        },
 
        renderer: function(oRm, oControl) {
            var thickness = parseInt(oControl.getProperty('thickness'), 10);
            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.addStyle("width", oControl.getProperty('width'));
            oRm.addStyle("height", oControl.getProperty('height'));
            oRm.addStyle("background-color", oControl.getProperty('bgcolor'));
            oRm.writeStyles();
 
            oRm.writeClasses();
            oRm.write(">");
 
            oRm.write("<canvas width='" + oControl.getProperty('width') + "' " +
                "height='" + oControl.getProperty('height') + "'");
            oRm.writeControlData(oControl);
            oRm.addStyle("width", oControl.getProperty('width'));
            oRm.addStyle("height", oControl.getProperty('height'));
            oRm.writeStyles();
            oRm.write("></canvas>");
            oRm.write("</div>");
        },
 
        onAfterRendering: function() {
            var canvas = document.querySelector("canvas");
            try {
                this.signaturePad = new SignaturePad(canvas);
            } catch (e) {
                //console.error(e);
            }
        },
        clear: function() {
 
            this.signaturePad.clear();
 
        },
        save: function() {
            return this.signaturePad.toDataURL();
        }
    });
});