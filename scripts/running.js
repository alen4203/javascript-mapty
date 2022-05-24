import Workout from './workout.js';
export default class Running extends Workout {
  type = 'running';
  #markerId;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}
