/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../services/user-config.ts" />
/// <reference path="../../services/zomato-api-serv.ts" />
'use strict';
module controllers {

	export class RestaurantsAddCtrl {
		searchTerm: string = '';
		results: Array<any> = [];
		isSearching: boolean = false;
		dialogService: ng.material.IDialogService;
		userConfig: services.UserConfig;
		zomato: services.IZomatoService;
		logger: ng.ILogService;
		changed: boolean;



		static $inject = ['$log', '$mdDialog', 'UserConfig', 'ZomatoAPI'];
		constructor(logger: ng.ILogService, $mdDialog: ng.material.IDialogService, UserConfig: services.UserConfig, ZomatoAPI: services.IZomatoService) {
			this.dialogService = $mdDialog;
			this.userConfig = UserConfig;
			this.logger = logger;
			this.zomato = ZomatoAPI;
			this.changed = false;
		}

		search() {
			this.results = [];
			this.isSearching = true;
			this.zomato.searchAsync(this.searchTerm)
				.then((response) => {
					this.isSearching = false;
					if (response.success) {
						this.results = this.markExisting(response.data);
						this.searchTerm = '';
					}
					else {
						this.logger.log(response.error);
					}
				},
				(error) => {
					this.logger.log(error.error);
				});
		};

		hide() {
			this.dialogService.hide(this.changed);
		}

		stateChange(rest) {
			this.changed = true;
			if (rest.added) {
				this.userConfig.addRestaurant(rest);
			}
			else {
				this.userConfig.removeRestaurant(rest);
			}
		}

		markExisting(results) {
			var rests = this.userConfig.getRestaurantList();
			for (var i in results) {
				if (results.hasOwnProperty(i)) {
					for (var ii in rests) {
						if (rests.hasOwnProperty(ii)) {
							var same = results[i].url === rests[ii].url;
							results[i].added = same;
							if (same) { break; }
						}
					}
				}
			}

			return results;
		}

	}
}

angular.module('app').controller('RestaurantsAddCtrl', controllers.RestaurantsAddCtrl);