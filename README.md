# King's Board 👑

An interactive chess application that displays the influence zones of pieces on the board.

## Features

- Interactive chessboard with drag-and-drop functionality
- Display of piece influence zones with color coding
- Ability to flip the board orientation
- Ability to switch between views (allies or enemies)
- Available pieces section for placing pieces on the board
- Visual indicators for controlled squares, defended pieces, and pieces in line of sight
- Mobile-responsive design

## Technologies Used

- React
- TypeScript
- chess.js for chess game logic
- react-chessboard for chessboard display
- Axios for API calls

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the application:
   ```
   npm start
   ```

## Configuration

The API base URL can be modified in the `src/config.ts` file.

## Project Structure

- `src/App.tsx`: Main application component
- `src/components/`: Reusable components
  - `InfluenceBoard.tsx`: Display of influence zones
  - `CapturedPieces.tsx`: Display of available pieces
- `src/services/`: Services for API calls
  - `api.ts`: Functions to communicate with the API
- `src/config.ts`: Application configuration

## API

The application communicates with a local API to retrieve the influence zones of pieces. The API expects a POST request to the `/retrieve_colors` endpoint with a specific request body and returns a 2D array representing the influence zones.

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
