import React           from 'react';
import { render }      from 'react-dom';
import { Provider }    from 'react-redux';
import { createStore } from 'redux';
import AppContainer    from './containers/app-container';
import rootReducer     from './reducers';
import IpcAction       from './utils/ipc-action';
import GlobalKeyBind   from './utils/global-key-bind';
import TimeRefresher   from './utils/time-refresher';

let store = createStore(rootReducer);
IpcAction.subscribe(store);
GlobalKeyBind.subscribe(store);
TimeRefresher.subscribe(store);

if (process.env.NODE_ENV !== 'production') {
  //store.subscribe(() => console.log(store.getState()));
}

render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('root'),
);
