sap.ui.define([
		"vonovia/timesheet/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("vonovia.timesheet.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);