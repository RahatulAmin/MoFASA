import { auth } from './utils/firebase';

const getProjects = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const projects = localStorage.getItem(`projects_${user.uid}`);
        return projects ? JSON.parse(projects) : [];
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
};

const saveProjects = async (projects) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        localStorage.setItem(`projects_${user.uid}`, JSON.stringify(projects));
    } catch (error) {
        console.error('Error saving projects:', error);
    }
};

export { getProjects, saveProjects }; 