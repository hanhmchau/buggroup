import { MODULE_ID } from "../main.js";
import Sorter from "./Sorter.js";

export const Constants = {
	ACTIVE_CATEGORY: "DND5E.FeatureActive",
	PASSIVE_CATEGORY: "DND5E.FeaturePassive",
	DEFAULT_CATEGORIES: ["DND5E.FeatureActive", "DND5E.FeaturePassive"]
};

export default class Categories {
	constructor(actorId) {
		this.actor = game.actors.get(actorId);
		this.sorter = new Sorter(this.actor);
	}

	async create(newLabel) {
		const generatedId = randomID();
		const sortOrder = this.actor.getFlag("buggroup", "sortOrder") || [];
		await this.actor.update({
			flags: {
				buggroup: {
					sortOrder: [generatedId, ...sortOrder],
					categories: {
						[generatedId]: {
							label: newLabel
						}
					}
				}
			}
		});
	}

	async rename(id, newLabel) {
		const newCategories = {
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
		await this.sorter.sortItems(itemId, targetId, oldCategoryId, newCategoryId);
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

	get(id) {
		return this.actor.getFlag("buggroup", `categories.${id}`);
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
