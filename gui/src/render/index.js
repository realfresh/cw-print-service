import "../styles/app.scss";
import "animate.css/animate.css";
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Reducers } from './redux/index';
import ReduxCtrlCreator from './redux/controller';
import App from './react/app';
import { unhandledPromiseReject, openDevToolsF12 } from './utils'
import Velocity from 'velocity-animate';
import 'velocity-animate/velocity.ui';
window.Velocity = Velocity;
import Raven from 'raven-js';

Raven.config('https://67a8a28c501749f6b6be6d2c7733eebf@sentry.io/1210311', {
  autoBreadcrumbs: true,
  captureUnhandledRejections: true,
}).install();

const store = createStore(Reducers);
const ReduxCtrl = new ReduxCtrlCreator(store);

Raven.context(() => {

  ReactDOM.render((
    <Provider store={store}>
      <App/>
    </Provider>
  ), document.getElementById('mount'));

  unhandledPromiseReject();
  openDevToolsF12();

});

export { ReduxCtrl, store }