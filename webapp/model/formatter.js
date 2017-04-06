sap.ui.define([], function() {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function(sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		saldo: function(iSaldo) {
			var sHours = (Math.floor(iSaldo / 3600));
			var sSign = sHours < 0 ? "-" : "";
			sHours = sHours < 0 ? sHours * -1 : sHours;
			var sNull = sHours < 10 ? "0" : "";
			var sMinutes = ((Math.floor(iSaldo / 60) % 60));
			sMinutes = sMinutes < 0 ? sMinutes * -1 : sMinutes;
			var sNullM = sMinutes < 10 ? "0" : "";
			var sSeconds = (iSaldo % 60);
			sSeconds = sSeconds < 0 ? sSeconds * -1 : sSeconds;
			var sNullS = sSeconds < 10 ? "0" : "";
			return sSign + sNull + sHours + ":" + sNullM + sMinutes ;//+ ":" + sNullS + sSeconds;
		},
		presence: function(iStart, iEnd) {
			return iStart.getTime() - iEnd.getTime();
		}

	};

});