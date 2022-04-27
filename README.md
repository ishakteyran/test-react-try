<h3 align="center">Real time mock crypto exchange rates</h3>

<!-- ABOUT THE PROJECT -->

### What's inside this repo?

- Socket.io for real time updates.
- API Clients for retrieving real time mock crypto prices.
- Ability to submit exchange data to the server
- Display exchange data and filter the data
- Production standard structuring of the application.


#### Task description

On connecting with socket.io the app will get crypto prices in the following format:

[{
base: 'ADA', target: 'USD', priceStart: 0.29, priceEnd: 0.99, name: 'Cardano',
baseUrl: 'basecurrencyUrlLink,
baseDecimalPlaces: 6, targetDecimalPlaces: 2, targetUrl: 'targetcurrencyUrlLink'
}]

Above is just one example for ADA to USD. Similarly the app will get it for other currencies once connected  to socket.io and after that on every interval set by the server. 

The data you used can be found in <a href="https://www.figma.com/file/YMRGT8t3GlxDMH8cN7BTw9/Technical-Assessment?node-id=24%3A1295">Exchange screen</a>

On Submit click the app calls /api/detail (POST) for saving transaction. 

All the saved records are shown in the grid <a href="https://www.figma.com/file/YMRGT8t3GlxDMH8cN7BTw9/Technical-Assessment?node-id=21%3A2715">Historical data</a>. 


### Built With

- [React.js]() - JavaScript runtime built on Chrome's V8 JavaScript engine.
- [Socket.io]() - Event driven JavaScript library for real time web applications.

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps :

### Prerequisites

To run this project, you'll need to have the following installed:

- Node.js : [https://nodejs.org](https://nodejs.org)

- npm :
  ```sh
  npm install npm@latest -g
  ```


### Installation

1. Clone the repo :
   ```sh
   git clone https://github.com/ishakteyran/redacre-react-client-crypto.git
   ```
2. Install dependencies (use `sudo` if required) :

   ```sh
   npm install
   ```

3. Modify the `/src/constants/constants.tsx` file and configure :

   ```JS
   socketURL = <URL_TO_SOCKET>;
   socketEventName = <SOCKET_EVENT_NAME_TO_GET_LIVE_PRICES>
   apiURL = <API_BASE_URL>
   apiURLPrefix = <API_PREFIX>
   apiPostEndpoint = <API_ENDPOINT_TO_SUBMIT_EXCHANGE_DATA>
   apiGetEndpoint = <API_ENDPOINT_TO_RECEIVE_EXCHANGE_DATA>
   ```
   and all other constants you would like to use in the app.

### Start the App :


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
