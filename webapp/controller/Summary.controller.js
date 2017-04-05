/*global location*/
//jQuery.sap.registerModulePath("SignaturePad", "../model/type/SignaturePad");
sap.ui.define([
	"vonovia/timesheet/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"vonovia/timesheet/model/formatter"
], function(
	BaseController,
	JSONModel,
	History,
	formatter
) {
	"use strict";

	return BaseController.extend("vonovia.timesheet.controller.Summary", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel, iOriginalBusyDelay, oTable = this.byId("summaryTable");
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "summaryView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			this.getRouter().getRoute("summary").attachPatternMatched(this._onObjectMatched, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle, oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("summaryView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_onObjectMatched: function(oEvent) {
			var month = oEvent.getParameter("arguments").month;
			this.getModel().metadataLoaded().then(function() {
				var sUsername = this.getModel("appView").getProperty("/username");
				var sObjectPath = this.getModel().createKey("TIMESHEET_BASISSet", {
					Username: sUsername
				});
				this._bindView("/" + sObjectPath, month);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath, month) {

			var oTable = this.byId("summaryTable");
			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: "Slots"
				}
			});
			//oTable.bindElement({ path: "Slots", sorter: { path: "SlotDate", descending: false }, filters: {	path: "SlotMonth" ,operator: "EQ" ,value1: "12" }});
			if (month < 10) {
				month = "0" + month;
			}
			var oFilterMonth = new sap.ui.model.Filter("SlotMonth", sap.ui.model.FilterOperator.EQ, month);
			oTable.getBinding("items").filter([oFilterMonth]);
		}

	});

});