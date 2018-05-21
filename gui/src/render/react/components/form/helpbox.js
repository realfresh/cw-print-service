import React from 'react'
import classNames from 'classnames';
import { Collapse } from 'react-collapse';

export default class HelpBox extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      active: typeof props.active == 'boolean' ? props.active : false,
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({active: !this.state.active})
  }

  render() {
    const { objClass, headerClass, contentClass, title } = this.props;
    const active = this.state.active;
    const objClassFull = classNames('help-box', objClass);
    const headerClassFull = classNames('help-box-header', 'cursor flex-line-center no-wrap', headerClass);
    const contentClassFull = classNames('help-box-content', contentClass);
    const icon = active ? "fa fa-chevron-circle-down cursor" : 'fa fa-chevron-circle-right cursor';
    return (
      <div className={objClassFull}>
        <div className={headerClassFull} onClick={this.toggle}>
          <i className={classNames(icon, 'p-r-2')}/>
          { title || "Click for more information" }
        </div>
        <Collapse isOpened={active}>
          <div className={contentClassFull}>
            {this.props.children}
          </div>
        </Collapse>
      </div>
    );
  }

}


