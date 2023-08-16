import { Constants } from "./Categories.js";

export default class Sorter {
	constructor(actor) {
		this.actor = actor;
	}

	async sortItems(itemId, targetId, oldCategoryId, newCategoryId) {
		const recategorizeUpdate = oldCategoryId != newCategoryId ? [this._getMoveToCategoryUpdate(itemId, newCategoryId)] : [];
		const sortWithinUpdate = this._getSortWithinCategoryData(itemId, targetId);
		await this.actor.updateEmbeddedDocuments("Item", [...recategorizeUpdate, ...sortWithinUpdate]);
	}

	_getMoveToCategoryUpdate(itemId, categoryId) {
		if (categoryId) {
			switch (categoryId) {
				case Constants.ACTIVE_CATEGORY:
				case Constants.PASSIVE_CATEGORY:
					return {
						_id: itemId,
						"flags.buggroup.-=categoryId": null
					};
				default:
					return {
						_id: itemId,
						"flags.buggroup.categoryId": categoryId
					};
			}
		}
	}

	_getSortWithinCategoryData(itemId, targetId) {
		// Get the drag source and its siblings
		const source = this.actor.items.get(itemId);
		const siblings = this.actor.items.filter((i) => {
			return i.type === source.type && i.id !== source.id;
		});

		// Get the drop target
		const target = siblings.find((s) => s.id === targetId);

		// Ensure we are only sorting like-types
		if (target && source.type !== target.type) return [];

		// Perform the sort
		const sortUpdates = SortingHelpers.performIntegerSort(source, { target: target, siblings, sortBefore: true });
		const updateData = sortUpdates.map((u) => {
			const update = u.update;
			update._id = u.target.id;
			return update;
		});
		return updateData;
	}
}
