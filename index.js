var jimp = require('jimp')
var space = require('color-space')
var fs = require('fs')

var matrix = []  // rgb values of pixels in image.
var matrixLab = [] // Lab values of pixels in image.
var webcolors = [] // 150 web colors that people can distinguish. will be loaded from json file.
var filterd_color = [];
var output = {};

const GetColor = (image, callback) => {

  for (var x = 0; x < image.bitmap.width; x = x + 1) {
    var array = []
    var array2 = []
    for (var y = 0; y < image.bitmap.height; y = y + 1) {
      var color = image.getPixelColor(x, y);
      var rgb = jimp.intToRGBA(color); //convert hex to rgb
      array.push(rgb) // push rgb
      array2.push(space.rgb.lab([rgb.r, rgb.g, rgb.b])) // convert rgb to lab and push.
    }
    matrix.push(array) 
    matrixLab.push(array2)
    array2 = []
    array = []
  }
  /// We have Extracted color of each pixel in matrix array. now get web colors from json file.
  
  return FeedWebColor(callback);
}

// transform data from json file to array (web color) in programme.
const FeedWebColor = (callback) => {
  fs.readFile('data.json', (err, data) => {
    if (err) return console.log(err)
    
    data = JSON.parse(data); // parse data (string) into js array.

    // iterate over array.
    data.forEach(element => {
      var obj = { ...element }
      obj.count = 0;
      webcolors.push(obj)
    })
    // console.log('Web Colors Feeded.')
    // console.log(webcolors);
    return Xtractor(callback); 
  })
  
}

// Calculate distance between colors using SIE76 lab
const Distance_Cal = (array1, array2) => {
  deltaE = Math.sqrt(
    Math.pow(array1[0] - array2[0], 2) +
      Math.pow(array1[1] - array2[1], 2) +
      Math.pow(array1[2] - array2[2], 2)
  ) // CIELAB formula from wikipedia.
  return deltaE
}

const Xtractor = (callback) => {

  //console.log(matrixLab.length + ' x ' + matrixLab[0].length)
  for (var i = 0; i < matrixLab.length; i++) {
    for (var j = 0; j < matrixLab[0].length; j++) {
      MapColor(matrixLab[i][j])
    }
  }

  return FormatOutput(webcolors, callback);

}

// check array Lab value and map to one of the 150 colors in webcolors. mapping 
const MapColor = array => {
  var distance = []; // array will contain distance from all 150 colors of passed array.
  //console.log(array);
  webcolors.forEach(element => {
    distance.push(Distance_Cal(array, element.L));
  })
  var min = Math.min(...distance); //find minimum distance 
  //console.log(min);
  if ( min < 20) {
    var i = distance.indexOf(min); // index of that color in webcolors array;
    webcolors[i].count++ // increase count of the color.
  }
}

// create output
const FormatOutput = (array, callback) => {

  // extract color which have count greater than 1.
  //console.log(webcolors);
  array.forEach(element => {
    if(element.count>0) filterd_color.push(element);
  });

  filterd_color.sort(Compare);
  var totalCount = 0;
  filterd_color.forEach(element => totalCount = totalCount + element.count); //total counts in webcolors.
  var newArray = [];
  filterd_color.forEach(element => {
    var obj = {...element};
    obj.perc = (obj.count/totalCount)*100;
    newArray.push(obj);
  })
  //console.log(newArray);
  newArray.forEach(element => {
    console.log(element.hex + "  " + element.perc);
  })
  //return callback(newArray);

}

// Compare function to sort colors array based on count.
const Compare = (a, b) => {
  if(a.count > b.count) return -1;
  else if(a.count <= b.count) return 1;
  else return 0;
}


const exc = (path) => {
  jimp.read(path, (err, image) => {
    if (err) return console.log(err)
    image
    .resize(200, 200) // rwsize to 200 for beeter results.
    .quality(100)
    .write("new"+path);
  
    jimp.read("new"+path, (err, image) => {  
      GetColor(image, (array) => console.log(array));
    })
  
  });
}

exc(pathtofile);
  


