/*
 This class provides methods to access data in the property sheet tab
*/
class PropertyInfo {
  //constructor functions
  constructor() {
    this.propertyValues = (function () {
      return propertySheet.getRange(1, 1, propertySheet.getLastRow(),propertySheet.getLastColumn()).getValues(); 
    }());
  }
  
  
  //class methods
  getNewPropertyValues() {
    this.propertyValues = propertySheet.getRange(1, 1, propertySheet.getLastRow(),propertySheet.getLastColumn()).getValues(); 
    return this.propertyValues;
  }
  
  numOfLoc() {
    return this.getRowValByTag('name').length;
  };
  
  nameRowIndex() {
    return this.getRowIndexByTag('name');
  }
  
  propertyTagsArry() {
    return this.propertyValues.map(function(v){ return v[0] });
  }
  /*
  //@param entire workbook values
  //@param index(not row number) of tag in first column.
  //@return row array of location info from row index passed in
  */
  getRowIndexByTag(tag) {
    return this.propertyTagsArry().indexOf(tag);
  }
  
  getAFullRowByTag(tag) {
    const result = []
    const rowIndx = this.getRowIndexByTag(tag)
    const nameIndx = this.nameRowIndex()
    for (let i = 0; i < this.propertyValues[nameIndx].length; i++) {
      result.push(this.propertyValues[rowIndx][i])
    }
    return result
  }
  /* 
  //@param proerty workbook values
  //@param tag to find row values of
  //@return row values in workbook relevant to tagproperty
  */
  getRowValByTag(tag) {
    const result = []
    const rowIndx = this.getRowIndexByTag(tag)
    const nameIndx = this.nameRowIndex()
    if (rowIndx !== -1) {
      for (let i = 3; i < this.propertyValues[nameIndx].length; i++) {
        result.push(this.propertyValues[rowIndx][i])
      }
    }
    return result
  }
  
  getLocAddressProp() {
    const flatColumnArry = this.propertyTagsArry()
    return {
      streetAddIndx: flatColumnArry.indexOf('street_address_1') + 1,
      cityIndx: flatColumnArry.indexOf('city') + 1,
      stateIndx: flatColumnArry.indexOf('state') + 1,
      postalCodeIndx: flatColumnArry.indexOf('postal_code') + 1
    }
  }
}


//needs to return an array in an array
//EX: [['west, east, north', 'south, downtown, east']]
function getKeywords(propSheetObj, tagToSearch, clientProp) {
  const landmarkTags = getLandmarkTagArr(clientProp.vertical)
  const dataCleaner = new DataVal(clientProp)
  let row = []
  if (tagToSearch === 'neighborhood_keywords') {
    const neighborhoodTerms = propSheetObj.getRowValByTag('neighborhood')
    neighborhoodTerms.forEach((data, i) => {
      row[i] = dataCleaner.formatCommaSepList(data)
    })
  } else if (tagToSearch === 'landmark_keywords') {
    landmarkTags.forEach((tag) => {
      const landmarkRow = propSheetObj.getRowValByTag(tag)
      landmarkRow.forEach((data, i) => {
        row[i] = row[i]
          ? `${row[i]}, ${dataCleaner.formatCommaSepList(data)}`
          : dataCleaner.formatCommaSepList(data)
      })
    })
  } else { // amenity_keywords
    row = clientProp.vertical === 'mf' ? getAmentiesArray(propSheetObj, dataCleaner) : null
  }
  row = row ? [row] : null
  return row
}

function getLandmarkTagArr(vertical) {
  const obj = {
    mf: ["landmark_1_name","nearby_employers","nearby_schools","nearby_restaurants","nearby_shopping","entertainment"],
    ss: ["landmark_1_name","nearby_roadway_1","nearby_roadway_2"],
    sl: ["landmark_1_name","nearby_employers","nearby_restaurants","nearby_shopping","entertainment","nearby_healthcare_1"]
  }
  return obj[vertical]
}

function getAmentiesArray(propSheetObj, dataCleaner) {
  var row = []
  var apartmentAmenitiesArry = getAmentiesData(propSheetObj,"apartment_amenity");
  var communityAmenitiesArry = getAmentiesData(propSheetObj,"community_amenity");
  var otherAmenities = getOtherAmenities(propSheetObj, dataCleaner);
  apartmentAmenitiesArry.forEach((item, i) => {
    row[i] = getData(apartmentAmenitiesArry[i],communityAmenitiesArry[i], otherAmenities[i])
  })
  return row
}

function getData(str, str1, str2) {
  let val = ''
  const arr = [str, str1, str2]
  arr.forEach((str) => {
    val = val && str
      ? `${val}, ${str}`
      : str || val
  })
  return val
}

function getOtherAmenities(propSheetObj, dataCleaner) {
  const amenTags = ['apartment_amenity', 'apartment_amenity_1', 'apartment_amenity_2', 'apartment_amenity_3',
    'other_apartment_amenities', 'community_amenity', 'community_amenity_1', 'community_amenity_2', 'community_amenity_3', 'other_community_amenities']
  const row = []
  amenTags.forEach(function(tag) {
    const amenityRow = propSheetObj.getRowValByTag(tag)
    amenityRow.forEach(function(data, i) {
      if (data === 'Yes' || data === 'No' || !data) {
        row[i] = row[i] ? row[i] : ''
      } else {
        row[i] = row[i] ? `${row[i]}, ${dataCleaner.formatCommaSepList(data)}` : dataCleaner.formatCommaSepList(data)
      }
    })
  })
  return row
}

function getAmentiesData(propSheetObj, tag) {
  const firstColumn = getColumnOneVal(propSheetObj.propertyValues)
  const firstAmenityIndex = firstColumn.indexOf(tag)
  const lastAmenityIndex = firstColumn.lastIndexOf(tag)
  const firstLocIndex = 3
  const lastLocIndex = propSheetObj.numOfLoc() + firstLocIndex
  const amenityNameIndex = 1
  const row = []
  if (firstAmenityIndex !== -1) {
    for (let i = firstAmenityIndex; i <= lastAmenityIndex; i++) {
      for (let x = firstLocIndex; x < lastLocIndex; x++) {
        const rowValues = propSheetObj.propertyValues[i]
        if (rowValues[x] === 'Yes') {
          row[x - firstLocIndex] = row[x - firstLocIndex] ? `${row[x - firstLocIndex]}, ${rowValues[amenityNameIndex]}` : rowValues[amenityNameIndex]
        } else {
          row[x - firstLocIndex] = row[x - firstLocIndex] ? row[x - firstLocIndex] : ''
        }
      }
    }
  } else {
    for (let i = 0; i < propSheetObj.numOfLoc(); i++) { row[i] = '' }
  }
  return row
}

/*
//@param entire workbook values
//@return column values for first column in workbook
*/
function getColumnOneVal(propertySheetValues) {
  return propertySheetValues.map(v => v[0] )
}

