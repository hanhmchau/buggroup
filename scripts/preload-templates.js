const preloadTemplates = async function () {
	const templatePaths = ["modules/buggroup/templates/quick-access-body.html"];
	return loadTemplates(templatePaths);
};

export default preloadTemplates;
