function getSpinUpFileHeaders() {
  return [
    "name","internal_branded_name","corporate","street_address_1","city","state","postal_code","country","neighborhood",
    "neighborhood_2","email","office_hours_note","status","status_note","no_deploy","secure_domain","custom_slug",
    "twitter_username","facebook_username","yelp_username","pinterest_username","instagram_username","youtube_username",
    "google_cid","linkedin_username","local_phone_number","display_phone_number","gtm_codes","spinup_web_theme",
    "spinup_strategy","naked_domain","off_platform_link","business_description","location_listing_category_id",
    "secondary_listing_categories","pay_online_url","license_number","nearby_schools","nearby_school_1","nearby_school_2",
    "nearby_employers","nearby_employer_1","nearby_employer_2","nearby_employer_3","apartment_amenity_1","apartment_amenity_2",
    "apartment_amenity_3","nearby_restaurants","nearby_shopping","landmark_1_name","landmark_2_name","landmark_3_name",
    "floor_plans","community_amenity_1","community_amenity_2","community_amenity_3","care_level_1","care_level_2",
    "care_level_3","care_level_4","care_level_5","care_level_6","nearby_healthcare_1","nearby_roadway_1","nearby_roadway_2",
    "nearby_gasoline","property_feature_1","property_feature_2","property_feature_3","property_feature_4","neighborhood_keywords", 
    "landmark_keywords","amenity_keywords","comm_amenity_keywords","class","primary_type","current_website","negative_keywords"
  ];
} 

var keywordCategories = ['neighborhood_keywords', 'landmark_keywords', 'amenity_keywords', 'comm_amenity_keywords']                       
//var excludedMFSEOValues = ["apartment_amenity_1", "community_amenity_1"];
var excludedValues = ["", "neighborhood", "landmark_1_name"];
var defaultPrintTags = ["corporate", "status", "no_deploy", "secure_domain", "spinup_web_theme"];
var spinUpTab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('spinUpFile');
var propertySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("**Paste Property Info**");

function excludedValueMatch(value,clientProp) {
  return excludedValues.includes(value) || keywordCategories.includes(value)
}

/*
  finds range of brand names in project workbook
  @return Returns array of row values matching search value tag   //propSheetObj
  propSheetObj, tagToSearch, clientProp
*/
function collectTagResults(propSheetObj, tagToSearch, clientProp,dataValObj)  {
  let rowValues = null;
  //sets default value if searchString matches defaultPrintTags array value
  if(defaultPrintTags.includes(tagToSearch)) { //default values
    rowValues = printDefaultValues(propSheetObj.numOfLoc(), tagToSearch, clientProp.domainType);    
  }
  else if(!excludedValueMatch(tagToSearch,clientProp)) { 
    rowValues = getRowValues(propSheetObj, tagToSearch, clientProp,dataValObj);
  }
  else if(keywordCategories.includes(tagToSearch)) {
    rowValues = getKeywords(propSheetObj, tagToSearch, clientProp)
  }
  return rowValues;
}

//helper method for collectTagResults to get values of rows not using default values or rows that should be skipped
function getRowValues(propSheetObj, searchString, clientProp, dataValObj) {
  const tagIndex = propSheetObj.getRowIndexByTag(searchString) // Row Number - 1
  let rowValues = null
  const stringTest = (function() {
    return searchString === 'custom_slug' ? getCustomSlugConfig()[clientProp.chainBranding] : searchString
  }())

  if (tagIndex !== -1 || (searchString === 'custom_slug' && stringTest)) {
    const dataByTag = propSheetObj.getRowValByTag(stringTest)
    rowValues = dataValObj.runDataVal(searchString, dataByTag)
  } else if(searchString === 'internal_branded_name') {
    const nameArr = propSheetObj.getRowValByTag('name')
    const addressArr = propSheetObj.getRowValByTag('street_address_1')
    const cityArr = propSheetObj.getRowValByTag('city')
    rowValues = nameArr.map((name, index) => {
      return `${name} - ${addressArr[index]} - ${cityArr[index]}`
    })
    rowValues = [rowValues]
  }
  return rowValues
}

function getCustomSlugConfig() {
  return {
    'yes': 'street_address_1',
    'no': 'name'
  }
}


/*
  function takes a row array and transposes it to a column array
*/
function collectAndFormatResults(propSheetObj, tagToSearch, clientProp, dataValObj) {
  const rowValue = collectTagResults(propSheetObj, tagToSearch, clientProp, dataValObj)
  let result = null
  if (rowValue) { // ensures there are values to transpose
    result = rowValue[0].map(elem => [elem])
  }
  return result
}

function setPostalCodeFormat(numLocations, spinUpFileHeaders) {
    const printColumnIndex = spinUpFileHeaders.indexOf('postal_code') + 1
    const namePrintRange = spinUpTab.getRange(2, printColumnIndex, numLocations, 1)
    namePrintRange.setNumberFormat('@').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
    spinUpTab.getRange(2, 1, numLocations, spinUpFileHeaders.length).setNumberFormat('@').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
}

function testMain() {
  main("mf","single","no");
}

function getClientProp(vert,domType,branding) {
  return {
      vertical: vert,
      domainType: domType,
      chainBranding: branding
  }
}

/*
//This function runs the workbook >> Csv functionality
*/
function main(vertical, domainType, chainBranding) {
  const isValid = valid(vertical, domainType, chainBranding)
  if (isValid) {
    const clientProperties = getClientProp(vertical, domainType, chainBranding)
    const propSheetObj = new PropertyInfo()
    const hasErrors = checkErrors(propSheetObj, clientProperties)
    if (!hasErrors) {
      spinUpTab.clear('A1:BR100')
      propSheetObj.getNewPropertyValues()
      const numLocations = propSheetObj.numOfLoc()
      const dataValObj = new DataVal(clientProperties)
      const spinUpFileHeaders = getSpinUpFileHeaders()
      const val = [spinUpFileHeaders]
      for(let i = 0; i < numLocations; i++) { val.push([]) }
      spinUpFileHeaders.forEach((header, colIndex) => {
        const result = collectAndFormatResults(propSheetObj, header, clientProperties, dataValObj)
        for(let row = 1; row <= numLocations; row++) {
          val[row][colIndex] = result ? result[row-1] : ""
        }
      })
      spinUpTab.getRange(2, 1, numLocations, spinUpFileHeaders.length).setNumberFormat('@').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
      spinUpTab.getRange(1, 1, numLocations + 1, spinUpFileHeaders.length).setValues(val)
    }
  }
}

function test1() {
  var redirects = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Redirects Tool');
  var redrange = redirects.getRange(1,1,5,3).getValues()
  Logger.log(redrange)
}