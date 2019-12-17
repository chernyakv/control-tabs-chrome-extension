$(function() {
    $('#countSave').click(function () {    
        var count = $('#tabsCount').val();
        chrome.storage.sync.set({'maxNumberOfOpenTabs': parseInt(count) });    
        window.close();   
    })
})