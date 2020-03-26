/*
 Checks for errors in the property info tab that need to be fixed prior to spinning up csv
*/
function checkErrors(propSheetObj,clientProperties) {
  var errorObj = new PropertySheetErrors(clientProperties);
  var errors = false
  var tierOneErrors = errorObj.checkTierOneErrors(propSheetObj,clientProperties);
  var tierTwoErrors = errorObj.checkTierTwoErrors(propSheetObj,clientProperties);
  if(tierOneErrors) {
    errors = true
  }
  else if(tierTwoErrors) {
    errors = true
  }
  return errors
}


/*
 *Checks for the number of blanks in an array list
 @param Array list to check for blanks in
 @param length of arrayList
 *
*/ 
function numOfBlanks(arryVal,arrylen) {
  var trueLen = arryVal.filter(Boolean).length;
  return arrylen - trueLen;
}

/*
 *compares 2 array lists for missing values
 *@returns an array with elements that the original array contains 
 *but the list being compared to does not contain
*/ 
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

function howManyRepeated(str){
  str = str.toString().split("").sort().join("").match(/(.)\1+/g);
  return str ? str.length : 0
}

function valid(vertVal, domainStrat, chainBran) {
  let val = true
  const arryVal = [vertVal, domainStrat, chainBran]
  for (let i = 0; i < arryVal.length; i++) {
    if (arryVal[i] === 'Select' || !arryVal[i]) {
      getUI().alert('Please Select An Option from All Drop Downs')
      val = false
      break
    }
  }
  return val
}
/*
  This class offers methods to check property info sheet errors to ensure an appropriate state
*/
class PropertySheetErrors {
  constructor(clientProperties) {
    this.clientProperties = clientProperties
    this.tags = {
      standard: ['current_website', 'naked_domain', 'name', 'street_address_1', 'city', 'state', 'postal_code', 'country', 'local_phone_number', 'display_phone_number', 'email', 'negative_keywords'],
      mfTags: ['current_website', 'naked_domain', 'name', 'street_address_1', 'city', 'state', 'postal_code', 'country', 'local_phone_number', 'display_phone_number', 'email', 'property_feature_1', 'primary_type', 'floor_plans', 'negative_keywords']
    }
    this.ui = getUI()
  }
  checkTierOneErrors(propSheetObj) {
    const propTagArry = propSheetObj.propertyTagsArry()
    if (this.checkMissingTags(this.clientProperties, propTagArry) || this.checkMissingNames(propTagArry, propSheetObj) || this.checkMissingAddress(propSheetObj)) {
      return true
    }
  }

  checkTierTwoErrors(propSheetObj) {
    let alerts = []
    const propTagArry = propSheetObj.propertyTagsArry()
    const missingDomains = this.checkMissingDomains(this.clientProperties, propTagArry, propSheetObj)
    const phoneIssues = this.checkPhoneIssues(propTagArry, propSheetObj)
    const floorPlanIssues = this.checkFloorPlans(propTagArry, propSheetObj)
    alerts.push(missingDomains, phoneIssues, floorPlanIssues)
    alerts = alerts.filter(Boolean)
    if (alerts.length > 0) {
      this.ui.alert(alerts.join('\n'))
      return true
    }
  }

  checkMissingTags(clientProperties, propTagArry) {
    const missingTags = (clientProperties.vertical === 'mf') ? this.tags.mfTags.diff(propTagArry) : this.tags.standard.diff(propTagArry)
    if (missingTags.length > 0) {
      this.ui.alert('Error: \nYou are missing the following required tags in the workbook:\nMissing Tags: ' + missingTags + '\nCheck to ensure the workbook is up to date')
      return true
    }
  }

  checkMissingNames(propTagArry, propSheetObj) {
    const nameRowNum = propTagArry.indexOf('name') + 1
    const nameRangeValues = propSheetObj.getRowValByTag('name')
    const numNameBlanks = numOfBlanks(nameRangeValues, nameRangeValues.length)
    if (numNameBlanks > 0) {
      this.ui.alert('Error: \nYou either have values in a property info tab past the last locations column or are missing brand names in row ' + nameRowNum +
               '\nAdd brand names to all locations in row ' + nameRowNum + ' and clear all columns past the last location column in use.')
      return true
    }
  }

  checkMissingAddress(propSheetObj) {
    const addressIndexes = propSheetObj.getLocAddressProp()
    const keys = ['street_address_1', 'city', 'state', 'postal_code']
    for (let i = 0; i < keys.length; i++) {
      const getRowVal = propSheetObj.getRowValByTag(keys[i])
      const numBlank = numOfBlanks(getRowVal, getRowVal.length)
      //const stateErr = 
      if (numBlank > 0) {
        this.ui.alert('Error: All locations address, city, state and zip cells must be filled out in the projects workbook. \n' +
               '\nAddress Rows: ' + addressIndexes.streetAddIndx + ' - ' + addressIndexes.postalCodeIndx)
        return true
      }
    }
  }

  checkMissingDomains(clientProperties, propTagArry, propSheetObj) {
    if (clientProperties.domainType == 'multi') {
      const domainIndex = propTagArry.indexOf('naked_domain') + 1
      const rowRangeValues = propSheetObj.getRowValByTag('naked_domain')
      const domainArrylen = propSheetObj.numOfLoc()
      const numDomainBlanks = numOfBlanks(rowRangeValues, domainArrylen)
      if (numDomainBlanks > 0) {
        const missingDomain = 'Error: \nAll multi domain locations need their domain field filled out.' + '\nAdd domains to all locations in row ' + domainIndex
        return missingDomain
      }
    }
  }

  checkPhoneIssues(propTagArry, propSheetObj) {
    const newPhoneArray = this.copyLocalToDefaultPhone(propSheetObj) // copies local number to display phone number field if display phone number is blank
    const numPhoneBlanks = numOfBlanks(newPhoneArray, newPhoneArray.length)
    if (numPhoneBlanks > 0) {
      const phoneRowNum = propTagArry.indexOf('display_phone_number') + 1
      const missingDefaultPhoneNum = 'Error: \nYour missing phone number values in row ' + phoneRowNum + '. Please enter the locations city area code followed by 555-5555(EX: 541-555-5555) in row ' + phoneRowNum
      return missingDefaultPhoneNum
    }
  }

  checkFloorPlans(propTagArry, propSheetObj) {
    if (propTagArry.includes('floor_plans')) {
      const floorPlansIndex = propTagArry.indexOf('floor_plans') + 1
      const rowRangeValues = propSheetObj.getRowValByTag('floor_plans')
      const hasBathroomData = this.checkForBathValues(rowRangeValues, rowRangeValues.length)
      if (hasBathroomData == true) {
        const bathroomValuesError = 'Error: \nLooks like some floor plans cells are using bathroom numbers' + '\nDelete all bathroom numbers and references to bathroom from floor plans cells in row ' + floorPlansIndex
        return bathroomValuesError
      }
    }
  }

  checkForBathValues(floorPlansValues, arrylen) {
    for (let i = 0; i < arrylen; i++) {
      const value = floorPlansValues[i].toString().toLowerCase().search(/bath/)
      let numVal = floorPlansValues[i].toString()
      numVal = numVal.replace(/\../g, '')
      numVal = numVal.replace(/[^0-9]+/g, '').toString().trim()
      if (value >= 0 || howManyRepeated(numVal) > 0) {
        return true
      }
    }
    return false
  }

  /*
  Checks for blanks in display phone number row.
  Copies values from local phone number to blank display phone number
  @return array of new display phone number values
  */
  copyLocalToDefaultPhone(propSheetObj) {
    const localPhoneNumVal = propSheetObj.getRowValByTag('local_phone_number')
    const defaultPhoneNumVal = propSheetObj.getRowValByTag('display_phone_number')
    const defaultPhoneRange = propertySheet.getRange(propSheetObj.getRowIndexByTag('display_phone_number') + 1, 4, 1, propSheetObj.numOfLoc())
    const dataValObj = new DataVal(this.clientProperties)
    const newDefPhoneNumArry = []
    defaultPhoneNumVal.forEach((defaultNumber, i) => {
      const cleanedDefaultNum = dataValObj.valPhoneNum(defaultNumber)
      const cleanedLocalNum = dataValObj.valPhoneNum(localPhoneNumVal[i])
      if (cleanedDefaultNum) { // checks if number is not blank after running it through the clean phone num method
        newDefPhoneNumArry.push(cleanedDefaultNum)
      } else if (cleanedLocalNum) {
        newDefPhoneNumArry.push(cleanedLocalNum)
      } else {
        newDefPhoneNumArry.push('')
      }
    })
    defaultPhoneRange.setValues([newDefPhoneNumArry])
    return newDefPhoneNumArry
  }
}


