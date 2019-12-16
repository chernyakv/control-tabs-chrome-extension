$(function() {
    $('#countSave').click(function () {    
        var count = $('#tabsCount').val();
        chrome.storage.sync.set({'tasksLimit': parseInt(count) });       
    })
})