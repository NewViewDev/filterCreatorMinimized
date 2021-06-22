importScripts("./mathjs/lib/browser/math.js")
/*
Instead of solving manually (would have to write own parser unless want to use eval which is unsave),
use math.js's evaluate function to safely do all sorts of math. Just need to add values to a string
and pass to eval
Needed to make a deep coppy so that I dont read from overwritten pixels
*/
onmessage = function (message){
  imageData = message.data[0];
  equations = message.data[1];
  height = message.data[2];
  width = message.data[3];
  let dataArr = imageData.data;
  let editedData = new Uint8ClampedArray(dataArr.length);
  //Should really just create a new array with 0 elems and add to it instead of using a copy
  function processPixel(indx){
    //Stores red green and blue values
    let changeToRGBA = [0,0,0,dataArr[indx+3]];
    for(let i = 0; i < equations.length; ++i){
      let equation = "";
      for(let elem of equations[i]){
        if(elem.type === "square"){
          let colorIndx = findColorIndx(indx, elem.loc, width, dataArr.length, elem.color);
          if(colorIndx >= 0){
            if(dataArr[colorIndx] === undefined){
              //seems to happen more often than I would think for blur function
              //Probably something odd with findColorIndx
              console.log("Undefined pixel location: " + colorIndx.toString());
              equation += "0";
            }
            else{
              equation += dataArr[colorIndx];
            }
          }
          else{
            //Could let user chose devault value
            equation += "0";
          }
        }
        if(elem.type === "sign"){
          equation += elem.sign;
        }
        if(elem.type === "value"){
          equation += elem.value;
        }
      }
      // console.log(equation);
      // console.time("mathEval");
      changeToRGBA[i] = math.evaluate(equation);
      // console.timeEnd("mathEval");
    }
    //would it be faster to just convert to Uint8ClampedArray after?
    editedData[indx] = changeToRGBA[0];
    editedData[indx+1] = changeToRGBA[1];
    editedData[indx+2] = changeToRGBA[2];
    editedData[indx+3] = changeToRGBA[3];
  }

  //pixelIndx always points to the red value of the imageData

  let pixelIndx = 0;
  //Loop though every pixel and apply all equations to it.
  // console.log("Pixel Loop Starting");
  while(pixelIndx < dataArr.length){
    processPixel(pixelIndx)
    //Update image line by line to show progress
    if(pixelIndx%(width*height) === 0){
      let editedImage = new ImageData(editedData, width, height);
      postMessage(editedImage);
    }
    pixelIndx += 4;
  }
  // console.log("Done processing");
  let editedImage = new ImageData(editedData, width, height);
  postMessage(editedImage);
  console.log("Filter Image End");
}

function findColorIndx(currIndx, relativePos, width, arrLength, color){
  let toAddX = relativePos[0]*4;
  let toAddY = relativePos[1]*4*width;
  // console.log("X: " + toAddX.toString());
  // console.log("Y: " + toAddY.toString());
  // console.log("currIndx: " + currIndx.toString());

  if((toAddY+currIndx < 0 || toAddY+currIndx >= arrLength) || (toAddX+currIndx < 0 || toAddX+currIndx >= arrLength)){
    // console.log("out of bounds");
    return -1; //out of bounds
  }
  //We know pixel is valid.
  // console.log("Found index: " + (currIndx + toAddY + toAddX + color).toString());
  return (currIndx + toAddY + toAddX + color);
}
