jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"vonovia/timesheet/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"vonovia/timesheet/test/integration/pages/Worklist",
		"vonovia/timesheet/test/integration/pages/Object",
		"vonovia/timesheet/test/integration/pages/NotFound",
		"vonovia/timesheet/test/integration/pages/Browser",
		"vonovia/timesheet/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "vonovia.timesheet.view."
	});

	sap.ui.require([
		"vonovia/timesheet/test/integration/WorklistJourney",
		"vonovia/timesheet/test/integration/ObjectJourney",
		"vonovia/timesheet/test/integration/NavigationJourney",
		"vonovia/timesheet/test/integration/NotFoundJourney",
		"vonovia/timesheet/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});