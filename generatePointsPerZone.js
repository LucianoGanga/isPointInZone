const geolib = require('geolib')
const Json2csvParser = require('json2csv').Parser;

const fs = require('fs');
const Json2csvTransform = require('json2csv').Transform;


// Generados con https://mygeodata.cloud/converter/kml-to-json
const zonesFull = require('./zonesFull.json')
const pointsFull = require('./pointsFull.json')

function run () {

  // Iterate over all the fullZones to get only name + polygonCoordinates for each of them
  let simplifiedZones = []
  for(let zoneFull of zonesFull.features) {
    simplifiedZones.push({ 
      name: zoneFull.properties.Name, 
      description: zoneFull.properties.description, 
      polygonCoordinates: zoneFull.geometry.coordinates[0].map(coord => {
        return { 
          latitude: coord[0], 
          longitude: coord[1] 
        }
      })
    })
  }

  // Now simplify the points
  let simplifiedPoints = []
  for(let pointFull of pointsFull.features) {
    if (pointFull.geometry && pointFull.geometry.coordinates) {
      simplifiedPoints.push({ 
        name: parseInt(pointFull.properties.Name).toString(), 
        coordinates: {
          latitude: pointFull.geometry.coordinates[0],
          longitude: pointFull.geometry.coordinates[1]
        }
      })
    }
  }

  // Once the points and the coordinates have been simplified, then comparate them to get the final result as JSON
  const pointsWithZone = []
  for (let point of simplifiedPoints) {
    for (let zone of simplifiedZones) {
      if (geolib.isPointInside(point.coordinates, zone.polygonCoordinates)) {
        
        // Push the point + zone to the pointsWithZone array
        pointsWithZone.push({ 
          point: point.name,
          zone: zone.name
        })

        // As the point can only be in a unique zone, then if there's a match, continue with the next point
        continue
      }
    }
  }

  const fields = [
    {
      label: 'Manzana',
      value: 'point'
    },
    {
      label: 'Zona',
      value: 'zone'
    }
  ]

  // Prepare the JSON2CSV Parser
  const json2csvParser = new Json2csvParser({ fields })

  // Parse the JSON to a CSV
  const csv = json2csvParser.parse(pointsWithZone, { fields })

  // Save the CSV content in a file
  fs.writeFileSync('./result.csv', csv)
  // const output = fs.createWriteStream('./result.csv', { encoding: 'utf8' })

  // console.log('pointsWithZone', JSON.stringify(pointsWithZone, null, 2))
  console.log(csv)

}

run()