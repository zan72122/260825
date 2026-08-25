# Runtime fragments

The browser loader in `../main.js` fetches these six fragments in order, joins them without transformation, and imports the result as a Blob-backed ES module.

They are fragments of one lexical program rather than standalone modules. The split keeps each repository write small while preserving the original scene implementation exactly. When refactoring the full game, replace this transport-oriented split with normal domain modules (`venue`, `florals`, `mechanics`, `scenes`, `ui`).
