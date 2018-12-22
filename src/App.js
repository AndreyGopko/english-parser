import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {
    url: '',
    letter: '',
  }

  onChange = (field) => (e) => {
    const url = e.target.value;
    const urlSplitted = url && url.split('/');
    const letter = urlSplitted[urlSplitted.length - 2];
    this.setState({
      [field]: e.target.value,
      letter
    })
  }

  parse = () => {
    fetch('http://localhost:3001?queryUrl=' + this.state.url + '&letter=' + this.state.letter);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <label>
            URL:
            <input onChange={this.onChange('url')} placeholder='URL...'/>
          </label>
          <label>
            Letter:
            <input onChange={this.onChange('letter')} defaultValue={this.state.letter} placeholder='Letter...'/>
          </label>
          <button onClick={this.parse}>Parse</button>
        </header>
      </div>
    );
  }
}

export default App;
