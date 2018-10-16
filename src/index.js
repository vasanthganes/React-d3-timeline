import React, { Component } from "react";
import ReactDOM from "react-dom";
import TimeLineComponent from "./timeline";

import "./styles.css";

class App extends Component {
  render() {
    return (
      <div className="App">
        <TimeLineComponent />
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
