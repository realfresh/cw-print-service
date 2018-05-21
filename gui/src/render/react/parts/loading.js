import React from 'react';
import { connect } from 'react-redux';
import { ClipLoader } from 'react-spinners';

class Loading extends React.Component {

  constructor(props) {
    super(props);
    this.timeout = null;
    this.active = false;
  }

  updateModal(props) {
    const Velocity = window.Velocity;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      let overlay = document.getElementById('loading-overlay');
      let box = document.getElementById('loading-overlay-centerbox');
      Velocity(overlay, 'stop');
      Velocity(box, 'stop');

      if (props.on && !this.active) {
        this.active = true;
        let opacity = props.opacity || 0.85;
        Velocity(overlay, { opacity }, {
          duration: 100,
          display: 'flex',
          easing: 'ease',
          complete: function() {
            Velocity(box, { opacity: 1 }, {
              duration: 100,
              display: 'block',
              easing: 'ease',
            });
          }
        });
      }

      else if (!props.on) {
        this.active = false;
        Velocity(box, { opacity: 0 }, {
          duration: 100,
          display: 'none',
          easing: 'ease',
          complete: function() {
            Velocity(overlay, { opacity: 0 }, {
              duration: 100,
              display: 'none',
              easing: 'ease',
            });
          }
        });
      }

    }, 100);

  }

  componentDidMount() {
    this.updateModal(this.props);
  }

  componentDidUpdate() {
    this.updateModal(this.props);
  }

  render() {
    return (
      <div id="loading-overlay" className="overlay">
        <div id="loading-overlay-centerbox" className="overlay-centerbox">
          <div className="text-center m-b-4">
            <ClipLoader color="#4491ee"/>
          </div>
          { this.props.msg && <div className="overlay-centerbox-text">{this.props.msg}</div> }
        </div>
      </div>
    );
  }

}

export default connect(state => ({
  on: state.loader.on,
  msg: state.loader.msg,
  opacity: state.loader.opacity,
}))(Loading)