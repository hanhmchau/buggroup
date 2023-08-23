"use strict";

import { libWrapper } from "./lib/libwrapper.js";
import "./lib/dragula.min.js";
import Categories, { Constants } from "./scripts/Categories.js";
import Renderer from "./scripts/Renderer.js";
import QuickAccessTab from "./scripts/QuickAccessTab.js";
import preloadTemplates from "./scripts/preload-templates.js";
import { ModuleOptions, ModuleSettings } from "./scripts/settings.js";
import Enhancer from "./scripts/Enhancer.js";

export const MODULE_ID = "buggroup";

Hooks.once("init", () => {
	preloadTemplates();
});

Hooks.on("setup", () => {
	ModuleSettings.registerSettings();
});

Hooks.once("ready", () => {
	const tidyMethod = (method) => `CONFIG.Actor.sheetClasses.character['dnd5e.Tidy5eSheet'].cls.prototype.${method}`;
	const baseMethod = (method) => `CONFIG.Actor.sheetClasses.character['dnd5e.ActorSheet5eCharacter'].cls.prototype.${method}`;
	libWrapper.register(
		MODULE_ID,
		tidyMethod("getData"),
		async function (wrapped) {
			const data = await wrapped();
			const service = new Categories(data.actor._id);
			const categories = service.getAll(data.actor._id);
			const orderedCategoryIds = service.getOrder(data.actor._id);
			const filteredFeatures = data.features
				.slice(2)
				.map((group) => group.items)
				.flat();
			// move Class and Background features to the bottom of the list
			data.features = data.features.slice(2).concat(data.features.slice(0, 2));
			const orderedCustomCategories = orderedCategoryIds
				.map((categoryId) => {
					const category = categories[categoryId];
					if (category) {
						return {
							label: category.label,
							hasActions: true,
							isClass: false,
							dataset: { type: "feat", categoryId, custom: true },
							items: filteredFeatures.filter((item) => item.flags[MODULE_ID]?.categoryId === categoryId)
						};
					}
				})
				.filter((cat) => cat); // remove null
			data.features.unshift(...orderedCustomCategories);
			// remove items already in custom categories from default Active/Passive categories
			Constants.DEFAULT_CATEGORIES.forEach((label) => {
				const category = data.features.find((cat) => cat.label === label);
				if (category) {
					category.dataset = {
						...category.dataset,
						categoryId: label
					};
					category.items = category.items.filter((cat) => {
						const categoryId = cat.flags?.buggroup?.categoryId;
						return !categoryId || categoryId === label;
					});
				}
			});
			return data;
		},
		"WRAPPER"
	);

	libWrapper.register(
		MODULE_ID,
		baseMethod("_filterItems"),
		function (wrapped, items, filters) {
			return wrapped(items, filters).filter((item) => {
				if (filters.has("non-concentration") && item.data.components.concentration) return false;
				return true;
			});
		},
		"WRAPPER"
	);
});

Hooks.on("createItem", (item) => {
	const categoryId = item.data.data.categoryid;
	if (categoryId) {
		delete item.data.data.categoryid;
		item.setFlag(MODULE_ID, "categoryId", categoryId);
	}
});

Hooks.on("renderHotbar", (hotbar, html, data) => {
	highlightDroppable();
});

Hooks.on("renderTidy5eSheet", async (app, html, data) => {
	const quickAccessEnabled = ModuleSettings.getSetting(ModuleOptions.ENABLE_QUICK_ACCESS);
	if (data.isCharacter) {
		if (quickAccessEnabled) injectQuickAccessTabIntoSheetData(app);
		const renderer = new Renderer(data.actor._id, html);
		renderer.prepare();
		addDataTypeToItemHeaders(html);
		if (quickAccessEnabled) await initializeQuickAccessTab(data.actor._id, html, app);
		restoreAllTabsPosition(app);
		renderer.configureDraggable();
		const enhancer = new Enhancer(data.actor._id, app, html);
		enhancer.enhance();
	}
});

function restoreAllTabsPosition(app) {
	app._restoreScrollPositions(app._element);
}

function injectQuickAccessTabIntoSheetData(app) {
	if (!app.options.scrollY.includes(".quick-access .inventory-list")) {
		app.options.scrollY.push(".quick-access .inventory-list");
	}
}

async function initializeQuickAccessTab(actorId, html, app) {
	const quickAccessTab = new QuickAccessTab(actorId, html, app);
	await quickAccessTab.addQuickAccessTab();
	if (app.activateQuickAccessTab) {
		app._tabs[0].activate("quick-access");
	}
}

function addDataTypeToItemHeaders(html) {
	const items = $(html).find(".tab.inventory .items-header");
	const features = $(html).find(".tab.features .features-list").children(".items-header");

	items.add(features).each((index, itemHeader) => {
		const $itemList = $(itemHeader).next(".item-list");
		const dataType = $itemList.find(".item-create").attr("data-type");
		if (dataType) {
			$(itemHeader).attr("data-type", dataType);
			$(itemHeader).next(".item-list").addBack().wrapAll(`<ul class="items-wrapper" data-type="${dataType}"></ul>`);
		}
	});
}

function highlightDroppable() {
	$("#hotbar")
		.on("dragenter dragover", ".macro", function (ev) {
			$(this).addClass("dragover");
		})
		.on("dragleave drop", ".macro", function (ev) {
			$(this).removeClass("dragover");
		});
}
