export default class QuickAccessTab {
	constructor(actorId, html, app) {
		this.actor = game.actors.get(actorId);
		this.html = html;
		this.app = app;
		this.tab = null;
	}

	async addQuickAccessTab() {
		const tabName = "Quick Access";
		const quickAccessBtn = $('<a class="item" data-tab="quick-access">' + tabName + "</a>");
		this.html.find('.tabs[data-group="primary"] .item[data-tab="inventory"]').before(quickAccessBtn);

		const sheet = this.html.find(".sheet-body");
		const quickAccessTabHtml = $(await renderTemplate("modules/buggroup/templates/quick-access-body.html", {}));
		this.tab = quickAccessTabHtml;
		sheet.append(quickAccessTabHtml);
		this.addWeaponsAndConsumables();
		this.addFeatures();
		this.addFilters();

		// Set QA Tab as Active
		this.html.find('.tabs .item[data-tab="quick-access"]').click((ev) => {
			this.app.activateQuickAccessTab = true;
		});

		// Unset QA Tab as Active
		this.html.find('.tabs .item:not(.tabs .item[data-tab="quick-access"])').click((ev) => {
			this.app.activateQuickAccessTab = false;
		});
	}

	addWeaponsAndConsumables() {
		const dest = this.html.find(".tab.quick-access .quick-items");
		const types = ["weapon", "consumable"];
		types.forEach((type) => {
			const section = this.html.find(`.tab.inventory .items-wrapper[data-type=${type}]`);
			dest.append(section.clone(true));
		});
	}

	addFeatures() {
		const dest = this.html.find(".tab.quick-access .quick-features");

		const customCategories = this.html.find(".tab.features .custom-categories");
		dest.append(customCategories.clone(true));

		const feats = this.html.find(".tab.features .items-wrapper[data-type=feat]");
		dest.append(feats.clone(true));
	}

	addFilters() {
		const itemFilters = this.html.find(".tab.quick-access .inventory-filters.items");
		itemFilters.append("<h3><i class='fas fa-toolbox'></i>Inventory</h3>");
		itemFilters.append(this.html.find(".tab.inventory .filter-list").clone(true));

		const featureFilters = this.html.find(".tab.quick-access .inventory-filters.features");
		featureFilters.append("<h3><i class='fas fa-chess-queen'></i>Features</h3>");
		featureFilters.append(this.html.find(".tab.features .filter-list").clone(true));
	}
}
