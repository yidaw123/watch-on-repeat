const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><input id="test" type="text" />`);
global.document = dom.window.document;

class CascadingTimeInput {
  constructor(inputEl, withMillis = false, onChange = null) {
    this.inputEl = inputEl;
    this.withMillis = withMillis;
    this.onChange = onChange;
    
    this.defaultChars = this.withMillis ? ['H','H','M','M','S','S','s','s','s'] : ['H','H','M','M','S','S'];
    this.chars = [...this.defaultChars];
    
    this.inputEl.value = this.format();
  }

  format() {
    let str = `${this.chars[0]}${this.chars[1]}:${this.chars[2]}${this.chars[3]}:${this.chars[4]}${this.chars[5]}`;
    if (this.withMillis) {
      str += `.${this.chars[6]}${this.chars[7]}${this.chars[8]}`;
    }
    return str;
  }

  setValue(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
      this.chars = [...this.defaultChars];
      this.inputEl.value = this.format();
      return;
    }
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds % 1) * 1000);
    
    let hStr = h.toString().padStart(2, '0');
    let mStr = m.toString().padStart(2, '0');
    let sStr = s.toString().padStart(2, '0');
    let msStr = ms.toString().padStart(3, '0');
    
    this.chars[0] = hStr[0]; this.chars[1] = hStr[1];
    this.chars[2] = mStr[0]; this.chars[3] = mStr[1];
    this.chars[4] = sStr[0]; this.chars[5] = sStr[1];
    if (this.withMillis) {
      this.chars[6] = msStr[0]; this.chars[7] = msStr[1]; this.chars[8] = msStr[2];
    }
    this.inputEl.value = this.format();
  }
}

const inputEl = document.getElementById('test');
const ci = new CascadingTimeInput(inputEl, true);
ci.setValue(null);
console.log("After null:", inputEl.value);
ci.setValue(0);
console.log("After 0:", inputEl.value);
