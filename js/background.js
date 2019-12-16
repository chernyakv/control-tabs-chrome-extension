chrome.runtime.onStartup.addListener(onStartupHandler);
chrome.tabs.onCreated.addListener(onCreatedHandler);
chrome.tabs.onRemoved.addListener(onRemovedHandler);
chrome.storage.onChanged.addListener(getNumberOfOpenTabs);

var maxNumberOfOpenTabs = 6;

function onStartupHandler() {
    chrome.storage.sync.get('tasksLimit', function(items) {        
        if(items.tasksLimit) {
            maxNumberOfOpenTabs = parseInt(items.tasksLimit);        
        } else {
            chrome.storage.sync.set({'tasksLimit': maxNumberOfOpenTabs})
        }        
    })          
}

function onCreatedHandler(tab){   
    console.log(maxNumberOfOpenTabs);
    chrome.tabs.query({ currentWindow: true }, removeExtraTabs(tab.id));
    if(!tab.openerTabId) {
        chrome.tabs.move(tab.id, {windowId: null, index: 0});
    }
}

function removeExtraTabs(newTabId) {
    return tabs => {
        if(tabs.length > maxNumberOfOpenTabs) {
            chrome.tabs.remove(newTabId);
            alert(`Max number of tabs - ${maxNumberOfOpenTabs}`);            
        }
    }    
}

function onRemovedHandler(tabId) {
    //console.log('Removed tab - ' + tabId);
}

function getNumberOfOpenTabs() {
    chrome.storage.sync.get(null, function(items){
        maxNumberOfOpenTabs = parseInt(items.tasksLimit);
    })    
}






