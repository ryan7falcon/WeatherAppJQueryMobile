if (!window.jQuery){
	console.log('jQuery is not loaded')
}

//openweathermap.org weather api
var _apiUrl = 'http://api.openweathermap.org/data/2.5/'
var _api_key = 'b714ec74bbab5650795063cb0fdf5fbe'
//current city
var _city
var myLocation = {}

$(document).on("pageshow", "#forecastPage", function(event){
  //get city and forecast for this city
  if (_city == null){
    getCity().done(function(){
       //get forecast
       getForecast(_city).then(onGetForecast)
     })   
  }
  else{
    getForecast(_city).then(onGetForecast)
  }

})


$(document).ready(function  () {


  $(errorContainer).hide()

  //Hide error
  $(btnHide).click(function(){
    $(errorContainer).hide()
  })

  //on click on Change City button
  $(changeCity).click(searchCityAndGetWeather)

  //on click on listview item in recent searches
  $(document).on('click', '.cityListItem', function(){
    _city = $(this).text()
    getWeatherAndScroll()
  })

  //on enter press
  $(document).on('keypress', '#searchInput', function(event){
    if (event.which == 13) {
      event.preventDefault();
      searchCityAndGetWeather()
    }  
  })

  //navigation
  $(document).on('swipeleft', function(){
    $.mobile.changePage("#home")
  })

  $(document).on('swiperight', function(){
    $.mobile.changePage("#forecastPage")
  })

  //populate the list of default cities
  axios.get('resources/data/data.json')
  .then(function (response){
    var defaultCities = response.data.cities   
    populateDefault(defaultCities)
  })
  
  //get city and weather for this city
  getCity().done(function(){
     //get weather
     //getWeatherAndScroll()
     getTodaysWeather(_city).then(onGetTodaysWeather)
   })

})
  //get the name of the city from the search box and get weather
  function searchCityAndGetWeather(){
    _city = $(searchInput).val()
    getWeatherAndScroll()
  }

  // converts an object with parameters to a query string like 
  // paramName1=paramValue1&paramName2=paramValue2
  function prepRouteParams (params) {
    return Object.keys(params)
    .map(function (key) {
      return key + '=' + encodeURIComponent(params[key]);
    }).join('&')
  }

  //gets a URL for weather API call based on city and type(today or forecast)
  function getUrl(city, type){
    var count = type === 'weather' ? 1 : 5
    var params = {
      q: city,
      type: 'accurate',
      APPID: _api_key,
      cnt: count,
      units: 'metric'
    }
    return _apiUrl + type + '?' + prepRouteParams(params);
  }

  //gets today's weather
  function getTodaysWeather(city){
    var url = getUrl(city, 'weather')
    return axios.get(url)
  }

  

  //display todays weather
  function onGetTodaysWeather(todaysWeather){
    var data = todaysWeather.data

    if(data.cod == 200){
      var weather = data.weather[0]

      //add info to the main page
      var icon = weather.icon;
      _city = data.name
      var template = $('#today').html()
      var renderJQP = Handlebars.compile(template)
      var html = renderJQP({
        icon: icon, 
        city: _city,
        desc: weather.description,
        temp: data.main.temp,
        
      })
      $('#weatherHomeContainer').html(html)   

      //add searched city to local storage
      addCityToStorage(_city)
      //update the list
      populateRecent()
      //hide previous errors
      $(errorContainer).hide()
    }
    else{
      //show error
      var msg = 'City not found'
      $(errorMessage).html(msg)
      $(errorContainer).show()
    }
    
  }

  //get a list of predefined cities
  function populateRecent(){
     //populate the list of recent cities
     if(localStorage.recentCities){
      template = $('#recentListItems').html()
      renderJQP = Handlebars.compile(template)
      html = renderJQP({
        searchHistory: JSON.parse(localStorage.recentCities)
      })
      $('#recent').html(html)
      $(recent).listview()
      $(recent).listview('refresh')     
      
    }
  }

  //populate the list of default cities as a datalist for input text box
  function populateDefault(defaultCities){
    template = $('#defaultListItems').html()
    renderJQP = Handlebars.compile(template)
    html = renderJQP({
      defaultCities: defaultCities
    })
    $('#default').html(html)
    $('#default').listview()
    $('#default').listview('refresh')   
  }

  

  //get todays weather and forecast and scroll up
  function getWeatherAndScroll(){
    //get current weather
    getTodaysWeather(_city).then(onGetTodaysWeather)
    //get forecast
    //getForecast(_city).then(onGetForecast)
    //scroll to top
    $.mobile.silentScroll(0)
  }
  //add found city to local Storage
  function addCityToStorage(city){
    if (localStorage.recentCities){
      var arr = JSON.parse(localStorage.recentCities)
          //check if the city already there, if not, add it
          if (arr.indexOf(city) == -1){
            arr.unshift(city)
          }        
          localStorage.recentCities = JSON.stringify(arr)

        }
        else{
          localStorage.recentCities = '["' + city + '"]'
        }

      }

  //get current city
  function getCity(){
    var d = $.Deferred()
    getLocation().done(function(){
      //get city name using coordinates
      var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+myLocation.lat+','+myLocation.lng+'&sensor=true'
      axios.get(url)
      .then(function(data){
        _city = data.data.results[1].formatted_address
        d.resolve()
      })
    }).fail(function(){
      _city = 'Toronto'
      d.resolve()
    })
    return d.promise()
  }

  //gets forecast
  function getForecast(city){
    var url = getUrl(city, 'forecast/daily')
    return axios.get(url)
  }

  //display forecast
  function onGetForecast(forecast){
    var data = forecast.data

    console.log(data)
    //clear forecast for previous city
    $('#weatherForecastContainer').html("<h1>" + data.city.name + "</h1>")

     /*
    var myLineChart = new Chart(myCanvas, {
      type: 'line',
      data: {
        labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
        datasets: [
        {
          label: "Forecast",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: "rgba(75,192,192,1)",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [
          data.list[0].temp.day, 
          data.list[1].temp.day, 
          data.list[2].temp.day, 
          data.list[3].temp.day, 
          data.list[4].temp.day, 
          ],
          spanGaps: false,
        }
        ]
      }
    })
    */
    if(data.cod == 200){
      for(var i = 0; i < data.cnt; i++)
      {
        var forecast = data.list[i]
        //add info to the main page
        var day = i+1;
        var icon = forecast.weather[0].icon
        var template = $('#forecast').html()
        var renderJQP = Handlebars.compile(template)
        var html = renderJQP({
          day: day,
          icon: icon, 
          temp: forecast.temp.day,
          
        })

        $('#weatherForecastContainer').append(html)   
      } 
      
      var myCanvas = $('#myCanvas')
      var forecastData = {
        labels : ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
        datasets :
        [
        {
          fillColor : "rgba(172,194,132,0.4)",
          strokeColor : "#ACC26D",
          pointColor : "#fff",
          pointStrokeColor : "#9DB86D",
          data : [
          data.list[0].temp.day, 
          data.list[1].temp.day, 
          data.list[2].temp.day, 
          data.list[3].temp.day, 
          data.list[4].temp.day
          ]
        }
        ]
      }
      var forecastChart = document.getElementById('myCanvas').getContext('2d');
      new Chart(forecastChart).Line(forecastData);

      //hide previous errors
      $(errorContainer).hide()
    }
    else
    {
      //show error
      var msg = 'City not found'
      $(errorMessage).html(msg)
      $(errorContainer).show()
    }

      //TODO: add info to forecast page
      //add a chart
      //style everything
    }

  //get current location
  function getLocation(){
    var d =$.Deferred()
    //get current location
    if (navigator.geolocation) {    
      navigator.geolocation.getCurrentPosition(
        function showPosition(position){
          myLocation.lat = position.coords.latitude
          myLocation.lng = position.coords.longitude
          d.resolve()
        }, function showError(err){
          var msg = "Failed to get your position: " + err.message
          console.log(msg)
          $(errorMessage).html(msg)
          $(errorContainer).show()
          d.reject()
        })     
    }
    else {
      var msg = 'geolocation is not supported in your browser'
      console.log(msg)
      $(errorMessage).html(msg)
      $(errorContainer).show()
      d.reject()
    }
    return d.promise()
  }