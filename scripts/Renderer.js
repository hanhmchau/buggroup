import Categories from "./Categories.js";

export default class Renderer {
	constructor(actorId, html) {
		this.actor = game.actors.get(actorId);
		this.html = html;
		this.service = new Categories(actorId);
	}

	prepare() {
		this.renderCategoryHeader();
		this.renderWrapperAroundCategories();
		this.renderCreateCategoryButton();
	}

	configureDraggable() {
		this.configureDraggableItems();
		this.configureDraggableCategories();
	}

	configureDraggableCategories() {
		const $categories = $(".custom-categories");
		$categories.find("features-header").addClass("draggable");
		dragula($categories.toArray(), {
			moves: (el, container, handle) => $(handle).closest(".features-header").length > 0
		}).on("drop", async (el, target, source, sibling) => {
			const categoryId = $(el).attr("data-category");
			const siblingId = sibling ? $(sibling).attr("data-category") : null;
			await this.service.sortCategories(categoryId, siblingId);
		});
	}

	configureDraggableItems() {
		const $itemList = $(".features-header.dragzone").next(".item-list");
		$itemList.find(".item").removeAttr("draggable");
		dragula($itemList.toArray(), {
			moves: (el) => $(el).hasClass("item"),
			accepts: (el, target, source, sibling) => sibling != null
		}).on("drop", async (el, target, source, sibling) => {
			const itemId = $(el).attr("data-item-id");
			const targetId = $(sibling).attr("data-item-id");
			const oldCategoryId = $(source).attr("data-category");
			const newCategoryId = $(target).attr("data-category");
			this.service.sortItems(itemId, targetId, oldCategoryId, newCategoryId);
		});
	}

	addRenameCallback(categoryId, item) {
		$(item)
			.find(".item-name")
			.attr("spellcheck", false)
			.attr("contenteditable", true)
			.attr("data-category", categoryId)
			.wrap("<div class='category-header'></div>")
			.blur((ev) => {
				ev.preventDefault();
				this.service.rename(categoryId, ev.target.textContent);
			})
			.keydown((ev) => {
				if (ev.code === "Enter") {
					$(ev.target).blur();
				}
			});
	}

	async confirmDeleteCategory() {
		return Dialog.confirm({
			title: "Delete category?",
			content: "<p>Deleting the category will not delete its items.</p><br><p>The items will be returned to the default Active/Passive Features categories.</p>",
			yes: () => true,
			no: () => false
		});
	}

	addDeleteCallback(categoryId, item) {
		const deleteCategoryButton = $(`<a class="delete-category"><i class="fas fa-trash-alt"></i></a>`).click(async (ev) => {
			ev.preventDefault();
			const confirmed = await this.confirmDeleteCategory();
			if (confirmed) {
				await this.service.delete(categoryId);
			}
		});
		$(item).find(".category-header").append(deleteCategoryButton);
	}

	renderCategoryHeader() {
		const customCategories = this.service.getAll();
		$(this.html)
			.find(".features-header")
			.each((index, item) => {
				const $itemList = $(item).next(".item-list");
				const categoryId = $itemList.find(".item-create").attr("data-categoryid");
				if (categoryId != null) {
					$itemList.attr("data-category", categoryId);
					$(item).addClass("dragzone");
				}
				if (categoryId in customCategories) {
					this.addRenameCallback(categoryId, item);
					this.addDeleteCallback(categoryId, item);
					$(item).addClass("custom dragzone draggable");
				}
			});
	}

	renderWrapperAroundCategories() {
		$(this.html)
			.find(".features-header.custom")
			.each((index, featureHeader) => {
				const categoryId = $(featureHeader).find(".item-name").attr("data-category");
				$(featureHeader).next(".item-list").addBack().wrapAll(`<ul class="category-wrapper" data-category="${categoryId}"></ul>`);
			});
		$(this.html).find(".category-wrapper").wrapAll('<ul class="custom-categories"></ul>');
	}

	renderCreateCategoryButton() {
		const addCategoryBtn = $(`<a class="category-create"><i class="fas fa-plus"></i>&nbsp;Add custom category</a>`).click(async (ev) => {
			ev.preventDefault();
			await this.service.create("New Category");
		});
		this.html.find(`.tab.features .inventory-filters`).prepend(addCategoryBtn);
	}
}
