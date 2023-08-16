import Sorter from "./Sorter.js";

export default class Enhancer {
	constructor(actorId, app) {
		this.actor = game.actors.get(actorId);
		this.sorter = new Sorter(this.actor);
		this.sheet = app;
	}

	async enhance() {
		await this.useEnhancedDragDrop();
		await this.addNonConcentrationFilter();
	}

	async useEnhancedDragDrop() {
		const $containers = $(".tab.inventory, .tab.spellbook").find(".item-list");
		const dragHandler = $('<a class="drag-handler"><i class="buggicon draggy"></i></a>');
		$containers.find(".item").prepend(dragHandler);

		dragula($containers.toArray(), {
			moves: (el, source, handle, sibling) => $(el).hasClass("item") && handle.closest(".drag-handler"),
			accepts: (el, target, source, sibling) => sibling != null && target == source
		}).on("drop", async (el, target, source, sibling) => {
			const itemId = $(el).attr("data-item-id");
			const targetId = $(sibling).attr("data-item-id");
			this.sorter.sortItems(itemId, targetId);
		});
	}

	async addNonConcentrationFilter() {
		const $filter = $(".filter-list[data-filter=spellbook]");
		const $concentrationFilter = $filter.find(".filter-item[data-filter=concentration]");
		const filterActive = this.sheet._filters.spellbook.has("non-concentration");
		const $nonConcentrationFilter = $(`<li class="filter-item ${filterActive ? "active" : ""}" data-filter="non-concentration">Non-conc.</li>`);
		$concentrationFilter.after($nonConcentrationFilter);
	}
}
