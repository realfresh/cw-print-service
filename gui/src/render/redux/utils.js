
export const generateReducers = (list) => {

  const reducers = {};
  const actions = {};

  Object.keys(list).forEach( name => {
    const reducer = list[name];
    const { initial_state } = reducer;

    const UPDATE_NAME = `${name.toUpperCase()}_UPDATE`;
    const CLEAR_NAME = `${name.toUpperCase()}_CLEAR`;

    actions[`${name}_update`] = (updates) => {
      return {
        type: UPDATE_NAME,
        data: updates
      }
    };
    actions[`${name}_clear`] = () => {
      return {
        type: CLEAR_NAME,
      }
    };

    reducers[name] = (state = initial_state, action) => {
      switch (action.type) {
        case UPDATE_NAME:
          return { ...state, ...action.data };
        case CLEAR_NAME:
          return { ...initial_state };
        default:
          return state
      }
    }
  });

  return { reducers, actions }

};
