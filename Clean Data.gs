function testdataval() {
  var clientProp = getClientProp('mf','single','yes');
  var propSheetObj = new PropertyInfo();
  var phone = propSheetObj.getRowValByTag('naked_domain');
  var dataValChecker = new DataVal(clientProp);
  //var emailArry = dataValChecker.runDataVal('email');
  var customSlugs = dataValChecker.runDataVal('naked_domain',phone);
  Logger.log(customSlugs);

}

/*
  Data validation class that mutates property info sheet values into appropriate strings
*/
class DataVal {
  constructor(clientProp) {
    this.vertical = clientProp.vertical
    this.domainType = clientProp.domainType
    this.chainBranding = clientProp.chainBranding
    this.corp = clientProp.corp
  }
  runDataVal(tag, dataByTag) {
    this.dataByTag = dataByTag
    this.numLocations = dataByTag.length
    const cleanedData = []
    for (let i = 0; i < this.numLocations; i++) {
      let str = this.dataByTag[i].toString().trim()
      str = this.validate(str, tag)
      cleanedData.push(str)
    }
    return [cleanedData]
  }
  
  validate(str, tag) {
    switch(tag) {
        case "email":
          str = this.emailVal(str);
          break;
        case "custom_slug":
          str = this.generateSlug(str);
          break;
        case "twitter_username": case "facebook_username": case "yelp_username": case "pinterest_username": case "instagram_username": case "youtube_username": case "linkedin_username":
          str = this.valSocialLinks(str);
          break;
        case "local_phone_number": case "display_phone_number":
          str = this.valPhoneNum(str);
          break;
        case "naked_domain":
          str = this.valDomain(str);
          break;
        case "floor_plans":
          str = this.valFloorPlans(str);
          break;
        case "state":
          str = this.getStateAbb(str);
          break;
        case "landmark_1_name": case "nearby_healthcare_1": case "nearby_gasoline": case "nearby_roadway_1": case "nearby_roadway_2": case "community_amenity_1": case "community_amenity_2": case "community_amenity_3": case "apartment_amenity_1": case "apartment_amenity_2": case "apartment_amenity_3":
        "apartment_amenity_1","apartment_amenity_2",
    "apartment_amenity_3"
          str = this.extractFirstVal(str);
          break;
        case "nearby_restaurants": case "nearby_shopping": case "nearby_employers": case "nearby_schools":
          str = this.formatCommaSepList(str);
          break;
        default:
          break;
      }
    return str
  } 
  
  emailVal(str) {
    let result = ''
    const regexmatch = str.match(/\b([^\s]+@[^\s]+)\b/)
    if (str.includes('@') && regexmatch !== null) {
      result = regexmatch[0]
    }
    return result
  }
  
  generateSlug(str) {
    if(this.corp) {
      str = 1
    } else {
      if (this.chainBranding === 'yes') { // address passed in if chain branding and will be formatted
      str = str.toString().replace(/[^A-Za-z0-9|" "]/g, '') // replaces all non numeric of alphabetic characters
        .substr(str.indexOf(' ') + 1) // everything after address numbers
        .toLowerCase().trim().replace(/\s\s+|\s/g, '-')
      } else { // this will pass in the brand name to clean for a slug (not chain branded)
        str = str.toString().toLowerCase().trim().replace(/\s\s+|\s/g, '-')
      }
    }
    return str
  }
  
  valSocialLinks(str) {
    if ((str) && this.hasSocialLink(str)) {
      if (str.includes('?')) {
        str = str.substr(0, str.indexOf('?'))
      }
      if (str.substr(str.length - 1) === '/') { // checks if last character in url is trailing slash
        str = str.substr(0, str.length - 1)
      }
      str = str.split('/').pop()
    } else {
      str = ''
    }
    return str
  }
  
  hasSocialLink(str) {
    const socialStrings = ['yelp', 'facebook', 'twitter', 'pinterest', 'instagram', 'youtube', 'linkedin']
    let val = false
    for (let i = 0; i < socialStrings.length; i++) {
      if (str.includes(socialStrings[i])) {
        val = true
        break
      }
    }
    return val
  }
  
  valPhoneNum(str) {
    str = str
      ? str.toString().replace(/[^0-9\.]+/g, '').replace(/\./g, '').trim()
      : ''
    return str != "" && str.length === 10
      ? `${str.substr(0, 3)}-${str.substr(3, 3)}-${str.substr(6, 4)}`
      : '';
  }
  
  valDomain(str) { 
    let domain = "";
    if(this.domainType === "multi") {
      domain = str.replace(/https:\/\/www.|https:\/\/|http:\/\/www.|http:\/\/|www\./gi, "" )
        .split("/", 1)
        .toString()
        .toLowerCase()
        .trim()
    }
    return domain;
  }
  
  valFloorPlans(str) {
    var hasStudio = false;
    if (str.indexOf("studio") != -1 || str.indexOf("Studio") != -1) {
      hasStudio = true;
    }
    str = str.replace(/\../g, "").replace(/[^0-9]+/g, "").toString().trim();
    if (str.length > 1 || hasStudio) {
      var x = str.substr(-1);
      str = str.slice(0, -1).split("").join(", ");
      if (hasStudio == true ) {
        str = (str + x).length > 1 ? "Studio, " + str + " & " + x : "Studio & " + x;
      } else {
        str = str + " & " + x;
      }
    }
    return str;
  }
  
  extractFirstVal(str) {
    return str ? str.split(/[\n,;(]/, 1).toString().trim() : ''
  }
  
  getStateAbb(str) {
    const stateMap = getStateMap()
    return stateMap[str]
  }
  
  formatCommaSepList(str) {
    str = str.replace(/[^\r\n\w\s|,;]/gi, '').trim()
    if (str) {
      if (!this.hasALineBreakComma(str)) {
        let arr = str.replace(/(\r\n|\n|\r)/g, ', ')
          .replace(/\s\s+/g, ' ')
          .split(/\n;|,+/g)
        arr.forEach((e, i) => {
          arr[i] = e.trim()
        })
        arr = arr.filter(Boolean)
        str = arr.join().trim()
      } else {
        str = str.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' ').toString().trim()
        str = str.replace(/\s\s+/g, ' ')
      }
    }
    str = str.replace(/,+/g, ', ')
    return str
  }
  
  hasALineBreakComma(str) {
    const index = str.indexOf("\n") - 1;
    const char1 = str.charAt(index);
    const char2 = str.charAt(index -1);
    return char1 === /\,|\;/g || char2 === /\,|\;/g ? true : false
  }
    
} 


const getStateMap = () => {
  return {
    "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT",
    "Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
    "Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN",
    "Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM",
    "New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI",
    "South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA",
    "West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","Alberta":"AB","British Columbia":"BC","Manitoba":"MB","New Brunswick":"NB",
    "Newfoundland And Labrador":"NL","Nova Scotia":"NS","Northwest Territories":"NT","Nunavut":"NU","Ontario":"ON","Prince Edward Island":"PE",
    "Quebec":"QC","Saskatchewan":"SK","Yukon":"YT"
  }
}




//does not take into condideration decimal numbers
function cleanFloorPlans(str) {
  const hasStudio = !!(str.includes('studio') || str.includes('Studio'))
  str = str.replace(/\../g, '').replace(/[^0-9]+/g, '').toString().trim()
  if (str.length > 1 || hasStudio) {
    const x = str.substr(-1)
    str = str.slice(0, -1).split('').join(', ')
    if (hasStudio) {
      str = (str + x).length > 1 ? `Studio, ${str} & ${x}` : `Studio & ${x}`
    } else {
      str = `${str} & ${x}`
    }
  }
  return str
}



//this function is used in the searchRowIndexArray to print out default values in columns where the values are static
function printDefaultValues(numLocations,search, domainType, corp) { 
  const spinUpFileHeaders = getSpinUpFileHeaders()
  return search === 'secure_domain' && domainType === 'single' 
    ? fillArray('', numLocations)
    : fillArray(getDefaultTagValue(corp)[search], numLocations)
}

function getDefaultTagValue(corp) {
  return corp ? {
    'corporate': 'true',
    'status': 'Pending',
    'no_deploy': 'false',
    'spinup_web_theme': 'default', 
    'secure_domain': 'true' 
  } : {
    'corporate': 'false',
    'status': 'Pending',
    'no_deploy': 'false',
    'spinup_web_theme': 'default', 
    'secure_domain': 'true' 
  }
}

function fillArray(value, len) {  //this function works the printDefaultValues function to fill an array full of default values to be printed in a range
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(value);
  }
  return [arr];
}