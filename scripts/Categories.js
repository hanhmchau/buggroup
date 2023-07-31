import { MODULE_ID } from "../main.js";

export const Constants = {
	ACTIVE_CATEGORY: "DND5E.FeatureActive",
	PASSIVE_CATEGORY: "DND5E.FeaturePassive",
	DEFAULT_CATEGORIES: ["DND5E.FeatureActive", "DND5E.FeaturePassive"]
};

export default class Categories {
	constructor(actorId) {
		this.actor = game.actors.get(actorId);
	}

	async create(newLabel) {
		const existingCategories = this.actor.getFlag("buggroup", "categories") || {};
		const generatedId = randomID();
		const newCategories = {
			...existingCategories,
			[generatedId]: {
				label: newLabel
			}
		};
		const sortOrder = this.actor.getFlag("buggroup", "sortOrder") || [];
		await this.actor.update({
			flags: {
				buggroup: {
					sortOrder: [...sortOrder, generatedId],
					categories: newCategories
				}
			}
		});
	}

	async rename(id, newLabel) {
		const existingCategories = this.actor.getFlag("buggroup", "categories") || {};
		const newCategories = {
			...existingCategories,
			[id]: {
				label: newLabel
			}
		};
		await this.actor.setFlag("buggroup", "categories", newCategories);
	}

	async delete(categoryId) {
		for (const item of this.actor.items.contents) {
			if (item.getFlag(MODULE_ID, "categoryId") === categoryId) {
				await item.unsetFlag(MODULE_ID, "categoryId");
			}
		}
		await this.actor.unsetFlag("buggroup", `categories.${categoryId}`);
		const sortOrder = this.actor.getFlag("buggroup", "sortOrder") || [];
		await this.actor.update({
			"flags.buggroup.sortOrder": sortOrder.filter((id) => id !== categoryId),
			[`flags.buggroup.categories.-=${categoryId}`]: null
		});
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

	async sort(categoryId, siblingId) {
		const orderedCategoryIds = this.getOrder();
		const originalPosition = orderedCategoryIds.indexOf(categoryId);
		const removedOrder = orderedCategoryIds.toSpliced(originalPosition, 1);
		const siblingPosition = siblingId ? removedOrder.indexOf(siblingId) : removedOrder.length;
		const newOrder = removedOrder.toSpliced(siblingPosition, 0, categoryId);
		await this.actor.setFlag("buggroup", "sortOrder", newOrder);
	}

	getAll() {
		return this.actor.getFlag("buggroup", "categories") || {};
	}

	getOrder() {
		return this.actor.getFlag("buggroup", "sortOrder") || [];
	}

	async sortCategories(categoryId, siblingId) {
		const orderedCategoryIds = this.getOrder();
		const originalPosition = orderedCategoryIds.indexOf(categoryId);
		const removedOrder = orderedCategoryIds.toSpliced(originalPosition, 1);
		const siblingPosition = siblingId ? removedOrder.indexOf(siblingId) : removedOrder.length;
		const newOrder = removedOrder.toSpliced(siblingPosition, 0, categoryId);
		await this.actor.setFlag("buggroup", "sortOrder", newOrder);
	}
}
