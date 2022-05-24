import Workout from './workout.js';
export default class Cycling extends Workout {
  type = 'cycling';
  #markerId;
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
  }
}
