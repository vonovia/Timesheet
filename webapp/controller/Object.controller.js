/*global location*/
sap.ui.define([
	"vonovia/timesheet/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"vonovia/timesheet/model/formatter",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, History, formatter, MessageToast) {
	"use strict";
	return BaseController.extend("vonovia.timesheet.controller.Object", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			var _this = this;
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("objectView"),
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
		onPress: function() {},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var sUser = this.getModel("appView").getProperty("/username");
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("TIMESHEET_SLOTSet", {
					Username: sUser,
					KeyValue: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					// success: this._onChangeSuccess.bind(this),
					// error: this._onChangeError.bind(this),
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_onBindingChange: function() {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.KeyValue,
				sObjectName = oObject.SlotDate;
			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
				sObjectName,
				sObjectId,
				location.href
			]));
		},
		/**
		 *@memberOf vonovia.timesheet.controller.Object
		 */
		onSave: function() {
			// var oContext = this.getView().byId("smartForm").getBindingContext();
			// var oProperties = oContext.getObject();
			// var oModel = oContext.getModel();
			// var sPath = oContext.getPath();
			if (this.getModel().hasPendingChanges()) {
				this.getModel().submitChanges();
			}
		},
		onDelete: function() {
			var oContext = this.getView().byId("smartFormChange").getBindingContext();
			var sPath = oContext.getPath();
			this.getModel().remove(sPath, {success: this._onChangeSuccess.bind(this),
					error: this._onChangeError.bind(this)});
			this.getModel().submitChanges();
			
		},
		
			_onChangeSuccess: function(oProduct) {

			// show success messge
			var sMessage = this.getResourceBundle().getText("Änderung erfolgreich", [oProduct.SlotDate]);
			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false
			});
			this.onNavBack();
		},
		
		_onChangeError: function(oProduct) {

			// show success messge
			var sMessage = this.getResourceBundle().getText("Fehler beim Ändern", [oProduct.SlotDate]);
			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false
			});
		}
	});
});