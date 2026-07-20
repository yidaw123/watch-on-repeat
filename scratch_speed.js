const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const insertPoint = `  setPlaybackSpeed(rate, hideToast = false, fromAutoTempo = false) {`;
const newFunction = `  changePlaybackSpeed(delta) {
    let currentSpeed = 1.0;
    
    if (this.state.isMultiSegment) {
      const idx = this.state.abLoop.currentSegmentIndex || 0;
      if (this.state.abLoop.multiSegments[idx]) {
        currentSpeed = this.state.abLoop.multiSegments[idx].speed || this.state.playbackRate || 1.0;
        let newSpeed = Math.max(0.25, Math.min(2.0, currentSpeed + delta));
        newSpeed = Math.round(newSpeed * 100) / 100;
        
        if (typeof this.setSegmentSpeed === 'function') {
          this.setSegmentSpeed(newSpeed, idx);
        } else {
          this.state.abLoop.multiSegments[idx].speed = newSpeed;
          this.setPlaybackSpeed(newSpeed);
          this.saveLoopData();
          if (this.renderMultiSegments) this.renderMultiSegments();
        }
        return;
      }
    }
    
    currentSpeed = this.state.playbackRate || 1.0;
    let newSpeed = Math.max(0.25, Math.min(2.0, currentSpeed + delta));
    newSpeed = Math.round(newSpeed * 100) / 100;
    this.setPlaybackSpeed(newSpeed);
  }

  setPlaybackSpeed(rate, hideToast = false, fromAutoTempo = false) {`;

content = content.replace(insertPoint, newFunction);
fs.writeFileSync('app.js', content, 'utf8');
console.log("Added changePlaybackSpeed");
