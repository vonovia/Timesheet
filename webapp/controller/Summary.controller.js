/*global location*/
/*jQuery.sap.registerModulePath("jsPDF.autotable", "../model/type/autotable");
jQuery.sap.registerModulePath("jsPDF", "../model/type/jspdf");*/
sap.ui.define([
	"vonovia/timesheet/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"vonovia/timesheet/model/formatter"
	// "jsPDF"
], function(
	BaseController,
	JSONModel,
	History,
	formatter
	// jsPDF
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
		},

		_onCreatePDF: function() {
			/** @type sap.m.Table */
			var oTable = this.byId("summaryTable");
			var oItems = oTable.getItems();
			var oColumns = oTable.getColumns();
			var pdfColumns = [];
			var pdfRows = [];

			for (var index = 0; index < oColumns.length; index++) {
				var column = {title: oColumns[index].getHeader().getText(), dataKey: index};
				pdfColumns.push(column);
			}

			for (var index = 0; index < oItems.length; index++) {
				var oCells = oItems[index].getCells();
				var pdfCells = new Object();
				for (var indexCell = 0; indexCell < oCells.length; indexCell++) {
					var value = oCells[indexCell]._lastValue;
					if (indexCell > 0 && indexCell < 7) { value = value.substring(0,5); }
					if (value == null) {
						value = oCells[indexCell].getText();
					}
					pdfCells[indexCell] = value;
				}
				pdfRows.push(pdfCells);
			}
			
			var sig = this.byId("sPad").save();
			
			var doc = new jsPDF();
			doc.setFontSize(18);
			doc.text(7, 15, "Zeiterfassung");
			var oPoperties = oTable.getBindingContext().getObject();
			doc.setFontSize(11);
			doc.text(7, 20, oPoperties.Pernr);
			doc.text(7, 25, oPoperties.Company);
			doc.text(7, 30, oPoperties.Department);
			doc.autoTable(pdfColumns, pdfRows, {
			startY: 35,
				margin: {
					horizontal: 7
				},
				bodyStyles: {
					valign: 'top'
				},
				styles: {
					overflow: 'linebreak',
					columnWidth: 'wrap'
				},
				columnStyles: {
					8: {
						columnWidth: 'auto'
					}
				}
			});
			doc.addImage(sig,'PNG', 7, doc.autoTable.previous.finalY + 10);
			doc.save('table.pdf');
		}

	});

});