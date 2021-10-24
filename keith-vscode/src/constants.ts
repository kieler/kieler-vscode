/**
 * Object holding all information about the views of this extension.
 * view.id has to be the same as specified in package.json. 
 */
const views = {
    compiler: {
        id: "kieler-kico",
        name: "KIELER Compiler",
    },
    simulation: {
        id: "kieler-simulation-tree",
        name: "KIELER Simulation Tree",
    },
};

/**
 * Config holding all information, which have to be the same across the entire extension (e.g. views or other constants).
 */
export const config = {
    name: "kieler",
    views: {
        kieler: views,
    },
};
