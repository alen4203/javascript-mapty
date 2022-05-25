import 'leaflet/dist/leaflet.css';
import 'leaflet';

import * as model from './model.js';
import * as mapView from './views/mapView.js';
import * as formView from './views/formView.js';

//////////////////////////////////
// Application Architecture

class App {
  _sort = false;
  constructor() {
    // get position from geolocation
    this._loadMap();

    // Handling clicks on the map
    mapView.addHandlerShowForm(this._showForm);

    formView.addHandlerNewWorkout(this._newWorkout.bind(this));

    // Toggle the form input for running (cadence) and cycling (elevation)
    formView.addHandlerToggleElevationField();

    formView.addHandlerGoToWorkout(this._goToWorkout);

    formView.addHandlerClearWorkouts(this._deleteAllWorkouts);

    formView.addHandlerSortWorkouts(this._sortWorkouts.bind(this));

    formView.addHandlerDeleteWorkout(this._deleteWorkout);

    formView.addHandlerShowEditForm(this._controlShowEditForm.bind(this));
  }

  async _loadMap() {
    try {
      // Get geolocation
      const pos = await model.getLocation();
      const { latitude, longitude } = pos.coords;
      const coords = [latitude, longitude];
      mapView.initMap(coords);

      // Render workout markers from local storage & add markers to markersArr
      model.state.workoutsArr?.forEach(workout => {
        const marker = mapView.renderWorkoutMarker(workout);
        model.addWorkoutMarker(workout, marker);
      });
      // Render workout in list
      formView.renderWorkouts(model.state.workoutsArr);
    } catch (error) {
      console.error(error);
    }
  }

  _showForm(mapE) {
    // Record the coords clicked by the user
    const { lat, lng } = mapE.latlng;

    model.state.mapLocation.lat = lat;
    model.state.mapLocation.lng = lng;

    // Show form
    formView.showForm();
  }

  _newWorkout(formData) {
    try {
      // Validate input and create new workout
      model.validateInput(formData);
      const workout = model.createNewWorkout(formData);

      // Add workout to the workout array
      model.state.workoutsArr.push(workout);

      // Render workout on map with a marker
      const marker = mapView.renderWorkoutMarker(workout);
      model.addWorkoutMarker(workout, marker);

      // Render workout in list
      formView.clearWorkouts();
      formView.renderWorkouts(model.state.workoutsArr);

      // When adding new workouts, the order could be wrong
      this._sort = false;

      // Hide form & clear input fields
      formView.hideForm();

      // Set local storage
      model.setLocalStorage();
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  _goToWorkout(workoutEl) {
    // Get the target workout
    const workout = model.getWorkoutByElement(workoutEl);

    // Set the mapView center to workout's coords
    mapView.changeView(workout.coords);

    // Using the public interface
    workout.click();
  }

  _deleteWorkout(workoutEl) {
    const [workoutId, markerId] = model.getIndexFromArr(workoutEl);
    // Delete workout & marker from view
    formView.deleteWorkout(workoutEl);
    mapView.deleteMarker(model.state.markersArr[markerId]);

    // Delete workout & marker from array
    model.deleteWorkout(workoutId, markerId);

    // reset localstorage
    model.setLocalStorage();
  }

  _deleteAllWorkouts() {
    // Clear view
    mapView.clearMarkers(model.state.markersArr);
    formView.clearWorkouts();

    // Clear model state and localstorage
    model.clearAll();
  }

  _sortWorkouts() {
    // Change the sort state
    this._sort = !this._sort;

    // Set workoutsArr in order (short -> long)
    const newWorkoutsArr = model.sortWorkoutsArr(this._sort ? true : false);

    // Re-render workouts on view
    formView.clearWorkouts();
    formView.renderWorkouts(newWorkoutsArr);
  }

  _controlShowEditForm(workoutEl, editForm) {
    // Get the workout being edited
    const workout = model.getWorkoutByElement(workoutEl);

    // Tell formView to call handler when user submit edit
    const handler = this._editWorkout.bind(this);
    formView.addHandlerEditWorkout(editForm, workout, handler);
  }

  _editWorkout(workout, formData, form) {
    try {
      // Edit workout and update workoutsArr
      model.validateInput(formData);
      workout = model.reassignWorkoutAttr(workout, formData);
      model.updateWorkoutsArr(workout);

      // Close edit form
      formView.hideEditForm(form);

      // Re-render workouts
      formView.clearWorkouts();
      formView.renderWorkouts(model.state.workoutsArr);

      // Delete old marker from view & markersArr
      const marker = model.getMarkerById(workout.markerId);
      mapView.deleteMarker(marker);
      model.deleteWorkoutMarker(workout.markerId);

      // Add updated marker to view and markersArr
      const newMarker = mapView.renderWorkoutMarker(workout);
      model.addWorkoutMarker(workout, newMarker);

      this._sort = false;

      // set local storage
      model.setLocalStorage();
    } catch (error) {
      alert(error);
    }
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
