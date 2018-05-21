import React from 'react';
import classNames from 'classnames';

export default class TabButton extends React.Component {

  constructor(props) {
    super(props);
  }


  render() {
    const baseClass = "p-3 animateEl cursor";
    const activeClass = classNames(baseClass, 'primary-text', 'border-bottom-primary-2');
    const inactiveClass = classNames(baseClass, 'border-bottom-medium-2');
    const containerClass = classNames('col text-center', {
      'col-25': this.props.col == 4,
      'col-33': this.props.col == 3 && !this.props.last,
      'col-34': this.props.col == 3 && this.props.last,
      'col-50': this.props.col == 2,
    });
    return (
      <div className={containerClass} onClick={() => this.props.setTab(this.props.tabKey)}>
        <div
          className={this.props.activeKey == this.props.tabKey ? activeClass : inactiveClass}>
          { this.props.smallText && <p className="small line-height-1">{this.props.value}</p> }
          { !this.props.smallText && this.props.value }
        </div>
      </div>
    )
  }

}
