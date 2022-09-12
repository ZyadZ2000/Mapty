'use strict';

//when the user opens the website:
//sees his previous workouts marked on the map and recorded
//when he clicks on the map a form is displayed to register a new workout
//when the workout is submitted it's displayed on the map with styling according to that website

//how will the code be implemented
/*
1- get the location of the user and display a map using geolocation api and leaflet library
2- use local storage api to store workouts data (the website will not be hosted so don't worry about multiple users)
3- use console.log to explore objects
4- create classes for the app, the workouts and implement inheritence, private variables, protected methods, etc.
5- be careful and remember to use bind
6- remember eventListeners are created and stored to use, they don't need to excute immediately
7- making everthing in classes avoids messy code
8- remember the DOM itself is an API so browsers have apis of their own, geolocation is one of them
9- remember if you're planning on storing something in a database it gotta have an array of its own
*/

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let type;
let distance;
let duration;
let cadence;
let elevation;
class App {
  #map;
  latitude;
  longitude;
  workout;
  workouts = [];
  element;
  constructor() {
    //getting position and displaying map

    navigator.geolocation.getCurrentPosition(
      this._displayMap.bind(this),
      function () {
        alert("Couldn't get location");
      }
    );

    //To change types between running and cycling

    this._changeType();

    //handling form inputs

    form.addEventListener('submit', this._handleForm.bind(this));

    //changing map to clicked workout
    containerWorkouts.addEventListener('click', this._centeringMap.bind(this));
  }
  _displayMap(p) {
    this.latitude = p.coords.latitude;
    this.longitude = p.coords.longitude;
    let arr = [this.latitude, this.longitude];
    this.#map = L.map('map').setView(arr, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling map event
    this._loadStoredWorkouts();
    this.#map.on('click', this._handleMapClick.bind(this));
  }
  _handleMapClick(clickedPosition) {
    const { lat, lng } = clickedPosition.latlng;
    this.latitude = lat;
    this.longitude = lng;
    form.classList.remove('hidden');
  }
  _handleForm(event) {
    event.preventDefault();
    if (this._checkInputs()) {
      if (type === 'running') {
        this.workout = new Running(
          type,
          Number(distance),
          Number(duration),
          Number(cadence),
          [this.latitude, this.longitude]
        );
      } else if (type === 'cycling') {
        this.workout = new Cycling(
          type,
          Number(distance),
          Number(duration),
          Number(elevation),
          [this.latitude, this.longitude]
        );
      }

      this.workouts.push(this.workout);
      this.workout.createElement();
      this._createMarker(this.workout);
      form.classList.add('hidden');
      localStorage.setItem('workout', JSON.stringify(this.workouts));
    }
    return;
  }
  _createMarker(workout) {
    L.marker([this.latitude, this.longitude])
      .addTo(this.#map)
      .bindPopup(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          workout.type[0].toUpperCase() + workout.type.substring(1)
        } on ${months[workout.month]} ${workout.day}`,
        {
          closeOnClick: false,
          autoClose: false,
          className: `${workout.type}-popup`,
        }
      )
      .openPopup();
  }
  _changeType() {
    inputType.addEventListener('change', function (event) {
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
    });
  }
  _checkInputs() {
    type = inputType.value;
    distance = inputDistance.value;
    duration = inputDuration.value;
    cadence = inputCadence.value;
    elevation = inputElevation.value;
    if (type === 'running') {
      if (
        !isFinite(distance) ||
        !isFinite(duration) ||
        !isFinite(cadence) ||
        Number(distance) < 0 ||
        Number(duration) < 0 ||
        Number(cadence) < 0
      ) {
        alert('Please enter valid inputs :(');
        return false;
      } else {
        return true;
      }
    }
    if (type === 'cycling') {
      if (
        !isFinite(distance) ||
        !isFinite(duration) ||
        !isFinite(elevation) ||
        Number(distance) < 0 ||
        Number(duration) < 0
      ) {
        alert('Please enter valid inputs');
        return false;
      } else {
        return true;
      }
    }
  }
  _centeringMap(e) {
    let target = e.target.closest('.workout');
    if (target) {
      const id = target.dataset.id;
      const clickedWorkout = this.workouts.find(w => w.id == id);
      this.#map.setView(clickedWorkout.coords, 13, {
        animate: true,
        pan: {
          duration: 0.7,
        },
      });
    } else return;
  }
  _loadStoredWorkouts() {
    let retrievedWorkout;
    let w;
    let work;
    if (!localStorage.length) return;
    this.workouts = JSON.parse(localStorage.getItem('workout'));
    for (let i = 0; i < this.workouts.length; i++) {
      work = this.workouts[i];
      if (work.type === 'cycling') {
        w = new Cycling(
          work.type,
          work.distance,
          work.duration,
          work.elevation,
          work.coords
        );
        w.id = work.id;
        w.month = work.month;
        w.day = work.day;
        w.createElement();
        const [lat, lng] = w.coords;
        this.latitude = lat;
        this.longitude = lng;
        this._createMarker(w);
      } else {
        w = new Running(
          work.type,
          work.distance,
          work.duration,
          work.cadence,
          work.coords
        );
        w.id = work.id;
        w.month = work.month;
        w.day = work.day;
        w.createElement();
        const [lat, lng] = w.coords;
        this.latitude = lat;
        this.longitude = lng;
        this._createMarker(w);
      }
    }
  }
}
class Workout {
  month = Number(JSON.stringify(new Date()).substring(6, 8)) - 1;
  day = Number(JSON.stringify(new Date()).substring(9, 11));
  id = Date.now();
  element;
  constructor(type, distance, duration, coords) {
    this.type = type;
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}

class Running extends Workout {
  constructor(type, distance, duration, cadence, coords) {
    super(type, distance, duration, coords);
    this.cadence = cadence;
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = Number.parseInt(this.duration / this.distance);
  }
  createElement() {
    this.element = document.createElement('li');
    this.element.classList.add('workout');
    this.element.classList.add('workout--running');
    this.element.dataset.id = this.id;
    this.element.innerHTML = `<h2 class="workout__title">Running on ${
      months[this.month]
    } ${this.day}</h2>
        <div class="workout__details">
          <span class="workout__icon">🏃‍♂️</span>
          <span class="workout__value">${this.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${this.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${this.speed}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${this.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>`;
    form.insertAdjacentElement(`afterEnd`, this.element);
  }
}
class Cycling extends Workout {
  constructor(type, distance, duration, elevation, coords) {
    super(type, distance, duration, coords);
    this.elevation = elevation;
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = Number.parseInt(this.distance / (this.duration / 60));
  }
  createElement() {
    this.element = document.createElement('li');
    this.element.classList.add('workout');
    this.element.classList.add('workout--cycling');
    this.element.dataset.id = this.id;
    this.element.innerHTML = `<h2 class="workout__title">Cycling on ${
      months[this.month]
    } ${this.day}</h2>
        <div class="workout__details">
          <span class="workout__icon">🚴‍♀️</span>
          <span class="workout__value">${this.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${this.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${this.speed}</span>
          <span class="workout__unit">KM/H</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${this.elevation}</span>
          <span class="workout__unit">m</span>
        </div>`;
    form.insertAdjacentElement(`afterEnd`, this.element);
  }
}
const app = new App();
/*
localStorage.setItem(0, 1);
console.dir(localStorage);
console.log(localStorage.length);
var testObject = { one: 1, two: 2, three: 3 };

// Put the object into storage
localStorage.setItem('testObject', JSON.stringify(testObject));

// Retrieve the object from storage
var retrievedObject = localStorage.getItem('testObject');

console.log('retrievedObject: ', JSON.parse(retrievedObject));
*/
