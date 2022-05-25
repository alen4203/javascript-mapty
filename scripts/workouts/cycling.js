import Workout from './workout.js';
export default class Cycling extends Workout {
  type = 'cycling';
  #markerId;
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
  }
}
