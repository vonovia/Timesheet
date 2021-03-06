sap.ui.define([
	"vonovia/timesheet/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"vonovia/timesheet/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageToast) {
	"use strict";
	return BaseController.extend("vonovia.timesheet.controller.Worklist", {
		formatter: formatter,
		oFormatYyyymmdd: null,
		_sObjectPath: null,
		month: "00",
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel, iOriginalBusyDelay, oTable = this.byId("table");
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._oTableSearchState = [];
			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("worklistViewTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistViewTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				busy: true,
				backNav: false,
				monthFilter: 12
			});
			this.setModel(oViewModel, "worklistView");

			this.getRouter().getRoute("worklist").attachPatternMatched(this._initalizeView, this);
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)

			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				oViewModel.setProperty("/busy", false);
				// initalize new Entry Fields
			});
			//oTable.filter();
			//this.getOwnerComponent().getModel().metadataLoaded().then(this._initalizeView());

			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYYMMdd"
			});

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
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},
		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},
		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},
		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var oTableSearchState = [];
				var sQuery = oEvent.getParameter("query");
				if (sQuery && sQuery.length > 0) {
					oTableSearchState = [new Filter("SlotDate", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(oTableSearchState);
			}
		},
		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		handleCalendarSelect: function(oEvent) {
			var oCalendar = oEvent.getSource();
			var aSelectedDates = oCalendar.getSelectedDates();
			var oDate;
			var oData = {
				selectedDates: []
			};
			if (aSelectedDates.length > 0) {
				for (var i = 0; i < aSelectedDates.length; i++) {
					oDate = aSelectedDates[i].getStartDate();
					oDate.setHours(5);
					oData.selectedDates.push(oDate);
				}
				this.setModel(oData, "dataCalendar");
			} else {
				this.setModel(oData, "dataCalendar");
			}
		},
		handleCalendarChange: function(oEvent) {
			var oTable = this.byId("table");
			var date = oEvent.getSource().getStartDate();
			this.month = date.getMonth() + 1;
			
			var oFilterMonth = new sap.ui.model.Filter("SlotMonth", sap.ui.model.FilterOperator.EQ, this.month);
			oTable.getBinding("items").filter([oFilterMonth]);
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getModel().deleteCreatedEntry(this._oContext);
			this.getModel().refresh();
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("KeyValue")
			});
		},
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {object} oTableSearchState an array of filters for the search
		 * @private
		 */
		_applySearch: function(oTableSearchState) {
			/** @type sap.m.table */
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(oTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (oTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},
		/**
		 *@memberOf vonovia.timesheet.controller.Worklist
		 */
		onSave: function() {
			var oData = this.getModel("dataCalendar");
			var oContext = this.getView().byId("smartForm").getBindingContext();
			var oProperties = oContext.getObject();
			var oModel = oContext.getModel();
			var sPath = oContext.getPath();
			var oPropertiesNew = {
				Username: oProperties.sUsername,
				SlotMonth: "02",
				//AllocatedTime: sTime,
				//Keyvalue: "20170202",
				//SlotDate: new Date("2017/01/02"),
				PresenceTime: "PT9H0M0S",
				AllocatedTime: "PT9H0M0S",
				WorkTime: "PT9H0M0S",
				StartTime: oProperties.StartTime,
				EndTime: oProperties.EndTime
			};

			if (oData && oData.selectedDates.length > 0) {
				for (var i = 0; i < oData.selectedDates.length; i++) {
					oPropertiesNew.KeyValue = this.oFormatYyyymmdd.format(oData.selectedDates[i]);
					oPropertiesNew.SlotDate = oData.selectedDates[i];
					oPropertiesNew.SlotMonth = oData.selectedDates[i].getMonth() + 1;
					if (i === 0) {
						oModel.setProperty(sPath + "/KeyValue", oPropertiesNew.KeyValue);
						oModel.setProperty(sPath + "/SlotDate", oPropertiesNew.SlotDate);
						oModel.setProperty(sPath + "/SlotMonth", oPropertiesNew.SlotMonth.toString());
					} else {

						oModel.createEntry(this._sObjectPath + "/Slots", {
							properties: oPropertiesNew,
							success: this._onCreateSuccess.bind(this)
						});
					}
					this.getModel().submitChanges();
				}
			}
		},
		/**
		 *@memberOf vonovia.timesheet.controller.Worklist
		 */
		_showSummary: function() {
			this.getRouter().navTo("summary", { month: this.month });
		},

		// Get Data from Model an prefill fields
		_initalizeView: function() {
			if (this.getModel("worklistView").getProperty("backNav") === true) {
				this._initSmartForm();
				this.getModel("worklistView").setProperty("backNav", false);
			}
			//this.getModel().metadataLoaded().then(function() {
			var sUsername = this.getModel("FLP").getProperty("/username");
			if (this._sObjectPath) {
				// this._sObjectPath = this.getModel().createKey("TIMESHEET_BASISSet", {
				// 	Username: sUsername
				// });
			} else {
				this._sObjectPath = this.getModel().createKey("TIMESHEET_BASISSet", {
					Username: sUsername
				});
				this._sObjectPath = "/" + this._sObjectPath;
				this._bindView(this._sObjectPath);
				this._initSmartForm();
			}

			// bind the view to the new entry
			//	this.get_View().setBindingContext(this._oContext);
			//	}.bind(this));
		},

		_initSmartForm: function() {
			var sUsername = this.getModel("FLP").getProperty("/username");
			// create default properties
			var oProperties = {
				Username: sUsername,
				//SlotMonth: "00",
				//KeyValue: "00000000"
				//SlotDate: new Date("2017/01/02"),
				//PresenceTime: "PT9H0M0S",
				//AllocatedTime: "PT9H0M0S",
				//WorkTime: "PT9H0M0S"
			};

			// create new entry in the model
			this._oContext = this.getModel().createEntry(this._sObjectPath + "/Slots", {
				properties: oProperties,
				success: this._onCreateSuccess.bind(this),
				error: this._onCreateError.bind(this)
			});

			//this.getView().byId("smartForm").bindElement(this._oContext);
			/*this.getView().byId("smartForm").bindElement({
				path: sObjectPath,
				parameters: {
					expand: "toSlots"
				}
			});*/

			this.getView().byId("smartForm").setBindingContext(this._oContext);
		},

		_onCreateSuccess: function(oProduct) {

			// show success messge
			var sMessage = this.getResourceBundle().getText("Neuer Eintrag erfolgreich angelegt", [oProduct.SlotDate]);
			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false
			});
			this.getRouter().navTo("object", {
				objectId: oProduct.KeyValue
			});
		},

		_onCreateError: function(oProduct) {

			// show success messge
			var sMessage = this.getResourceBundle().getText("Fehler bei Anlage", [oProduct.SlotDate]);
			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false
			});
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oTable = this.byId("table");
			var today = new Date();
			this.month = today.getMonth() + 1;
			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: "Slots"
				}
			});
			//oTable.bindElement({ path: "Slots", sorter: { path: "SlotDate", descending: false }, filters: {	path: "SlotMonth" ,operator: "EQ" ,value1: "12" }});
			var oFilterMonth = new sap.ui.model.Filter("SlotMonth", sap.ui.model.FilterOperator.EQ, this.month );
			oTable.getBinding("items").filter([oFilterMonth]);
		}

	});
});