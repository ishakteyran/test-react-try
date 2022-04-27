import React from 'react';
import logo from './logo.svg';
import './App.css';

import "primereact/resources/themes/lara-light-indigo/theme.css";  //theme
import "primereact/resources/primereact.min.css";                  //core css
import "primeicons/primeicons.css";                                //icons

import CryptoExchangePrices from "./components/crypto-exchange-prices";

function App() {
  return (
    <div className="App">


         <CryptoExchangePrices></CryptoExchangePrices>



    </div>
  );
}

export default App;
