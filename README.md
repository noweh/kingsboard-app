# King's Board 👑

Une application d'échecs interactive qui affiche les zones d'influence des pièces sur le plateau.

## Fonctionnalités

- Échiquier interactif avec glisser-déposer des pièces
- Affichage des zones d'influence des pièces avec un code couleur
- Possibilité d'inverser l'orientation du plateau
- Possibilité de changer la vue (alliés ou ennemis)
- Affichage des pièces capturées

## Technologies utilisées

- React
- TypeScript
- chess.js pour la logique du jeu d'échecs
- react-chessboard pour l'affichage de l'échiquier
- Axios pour les appels API

## Installation

1. Clonez ce dépôt
2. Installez les dépendances :
   ```
   npm install
   ```
3. Lancez l'application :
   ```
   npm start
   ```

## Configuration

La base URL de l'API peut être modifiée dans le fichier `src/config.ts`.

## Structure du projet

- `src/App.tsx` : Composant principal de l'application
- `src/components/` : Composants réutilisables
  - `InfluenceBoard.tsx` : Affichage des zones d'influence
  - `CapturedPieces.tsx` : Affichage des pièces capturées
- `src/services/` : Services pour les appels API
  - `api.ts` : Fonctions pour communiquer avec l'API
- `src/config.ts` : Configuration de l'application

## API

L'application communique avec une API locale pour récupérer les zones d'influence des pièces. L'API attend une requête POST à l'endpoint `/retrieve_colors` avec un corps de requête spécifique et renvoie un tableau 2D représentant les zones d'influence.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
