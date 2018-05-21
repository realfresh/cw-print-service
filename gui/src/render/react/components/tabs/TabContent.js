import React from 'react';
import classNames from 'classnames';

export default class TabContent extends React.Component {

  constructor(props) {
    super(props);
  }


  render() {
    const baseClass = classNames(
      this.props.activeKey == this.props.tabKey ? '' : 'hide'
    );
    return (
      <div className={baseClass}>
        {this.props.children}
      </div>
    )
  }

}
