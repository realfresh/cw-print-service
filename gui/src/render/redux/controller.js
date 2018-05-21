import autobind from 'class-autobind';
import { reducers, Actions } from './index';
import ipc from '../ipc';
import Raven from 'raven-js';

class BaseReduxCtrl {
  constructor(store) {
    autobind(this);
    this.store = store;
    this.init();
  }
  init() {
    // CREATE ALL HELPERS
    const { dispatch } = this.store;
    const keys = Object.keys(reducers);
    keys.forEach( r => {
      const update_fn = Actions[`${r}_update`];
      const clear_fn = Actions[`${r}_clear`];
      this[`${r}_load_start`] = (data={}) => {
        dispatch(update_fn({
          error: false,
          fetching: true,
          ...data
        }))
      };
      this[`${r}_load_success`] = (data={}) => {
        dispatch(update_fn({
          error: false,
          fetching: false,
          ...data
        }))
      };
      this[`${r}_load_error`] = (data={}) => {
        dispatch(update_fn({
          error: true,
          fetching: false,
          ...data
        }))
      };
      this[`${r}_update`] = (data={}) => {
        dispatch(update_fn(data))
      };
      this[`${r}_clear`] = () => {
        dispatch(clear_fn())
      };
    })
  }
}

export default class ReduxCtrlCreator extends BaseReduxCtrl {

  constructor(store) {
    super(store);
    autobind(this);
  }

  async app_printers_sync() {
    const { dispatch } = this.store;
    const { data } = await ipc.system_get_printers();
    dispatch(Actions.app_update({ system_printers: data }));
  }

  config_update(update, timeout) {
    update = update || {};
    this.store.dispatch(Actions.config_update(update));
    clearTimeout(this.update_timeout);
    this.update_timeout = setTimeout(() => {
      ipc.service_update_config(update);
      if (update.api_key) {
        Raven.setUserContext({
          user: {
            id: update.api_key,
          }
        })
      }
    }, (timeout || 300));

  }

  async config_sync() {
    const { data } = await ipc.service_get_config();
    this.config_update(data, 1);
  }

  loader_toggle(on, msg, opacity=0.70) {
    const { dispatch } = this.store;
    dispatch(Actions.loader_update({ on, msg, opacity }));
  }

}