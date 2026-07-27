const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><input id="test" type="text" />`);
global.window = dom.window;
global.document = dom.window.document;

// Extract the CascadingTimeInput class from app.js
const appCode = fs.readFileSync('app.js', 'utf8');
const classMatch = appCode.match(/class CascadingTimeInput \{[\s\S]*?\n\}/);
if (classMatch) {
    eval(classMatch[0]);
    const inputEl = document.getElementById('test');
    const ci = new CascadingTimeInput(inputEl, true, () => {});
    ci.setValue(null);
    console.log("Input value after setValue(null):", inputEl.value);
} else {
    console.log("Class not found");
}
