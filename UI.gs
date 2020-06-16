//Global Variables
var ui = SpreadsheetApp.getUi();

function getUI() { return SpreadsheetApp.getUi() }

function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Open App', 'showSidebar')
      .addToUi();
}

function showSidebar() {
  var SIDEBAR_TITLE = 'G5 SEO Implementation Scripts';
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(SIDEBAR_TITLE);
  SpreadsheetApp.getUi().showSidebar(ui);
}

//Adds menu items under the add on menu when installed
function onInstall(e) {
  onOpen(e);
}

