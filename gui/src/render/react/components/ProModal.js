import React from 'react'
import shortid from 'shortid';
import ClickOutHandler from 'react-onclickout';
import classNames from 'classnames'
import Transition from 'react-transition-group/Transition';

export default class ProModal extends React.Component {

  constructor(props) {
    super(props);
    this.id = shortid.generate();
    this.onClickOut = this.onClickOut.bind(this);
  }

  onClickOut(e) {
    try {
      if (
        this.props.active &&
        typeof e.target.className == 'string' &&
        typeof e.target.className.indexOf == 'function' &&
        e.target.className.indexOf(this.id) !== -1 &&
        e.target.className.indexOf('modal-inner') !== -1 ||
        e.target.className.indexOf("modal") !== -1) {
        this.props.onClickOut();
      }
    }
    catch(e) {
      console.log(e)
    }
  }

  render() {

    const { modalClass, innerClass, contentClass, active, contentStyle } = this.props;

    const duration = 300;
    const modalTransition = {
      entering: {
        display: 'block',
        opacity: 0,
      },
      entered:  {
        display: 'block',
        opacity: 1,
      },
      exiting: {
        display: 'block',
        opacity: 0,
      },
      exited: {

      }
    };

    const contentTransition = {
      entering: {

      },
      entered:  {
        transform: "translateY(0px)"
      },
    };

    return (
      <Transition in={!!active} timeout={duration}>
        {(state) => (
          <div
            style={{...modalTransition[state], transition: `0.3s all` }}
            className={classNames("modal", modalClass, this.id)}>
            <div className={classNames("modal-inner p-2", innerClass, this.id)}>
              <ClickOutHandler onClickOut={this.onClickOut}>
                <Transition in={active} timeout={duration}>
                  {(state) => (
                    <div
                      style={{...contentTransition[state], ...(contentStyle || {})}}
                      className={classNames("modal-content", contentClass)}>
                      {this.props.children}
                    </div>
                  )}
                </Transition>
              </ClickOutHandler>
            </div>
          </div>
        )}
      </Transition>
    );

  }

}
