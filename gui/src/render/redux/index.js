import { combineReducers } from "redux";
import { generateReducers } from './utils';
import reducer_list from './reducers_list';

const { reducers, actions } = generateReducers(reducer_list);

const Actions = {
  ...actions,
};

const Reducers = combineReducers({
  ...reducers
});

export { Reducers, Actions, reducers };
