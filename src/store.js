const getProjects = async () => {
    try {
        const projects = await window.electronAPI.getProjects();
        return projects || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
};

const saveProjects = async (projects) => {
    try {
        await window.electronAPI.saveProjects(projects);
    } catch (error) {
        console.error('Error saving projects:', error);
    }
};

export { getProjects, saveProjects }; 