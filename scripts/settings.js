export const ModuleOptions = {
	ENABLE_QUICK_ACCESS: "enable-qa-tab"
};

export class ModuleSettings {
	static MODULE_NAME = "buggroup";

	static registerSettings() {
		game.settings.register(
			this.MODULE_NAME,
			ModuleOptions.ENABLE_QUICK_ACCESS,
			this._buildConfig(ModuleOptions.ENABLE_QUICK_ACCESS, {
				default: true,
				scope: "world",
				onChange: () => {}
			})
		);
	}

	static getSetting(option) {
		return game.settings.get(this.MODULE_NAME, option);
	}

	/** @private */
	static _getNameConfig(optionName) {
		return {
			name: `${this.MODULE_NAME}.${optionName}-s`,
			hint: `${this.MODULE_NAME}.${optionName}-l`
		};
	}

	/** @private */
	static _buildConfig(optionName, config = {}) {
		const defaultConfig = {
			scope: "client",
			config: true,
			default: false,
			type: Boolean,
			onChange: (x) => window.location.reload()
		};
		return {
			...defaultConfig,
			...this._getNameConfig(optionName),
			...config
		};
	}
}
